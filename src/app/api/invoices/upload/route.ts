import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { InvoiceService } from "@/lib/services/invoice.service";
import { AiExtractorService } from "@/lib/services/ai-extractor.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Allow sufficient time for vision LLM processing

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let clientId = formData.get("clientId") as string | null;

    if (!file) {
      return errorResponse("No invoice file uploaded", 400);
    }

    // Allowed file types: images and PDF
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(
        `Unsupported file type: ${file.type}. Please upload a JPG, PNG, WEBP, or PDF.`,
        400
      );
    }

    // Size limit check (25 MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return errorResponse("File size exceeds maximum limit of 25MB", 400);
    }

    // If no clientId provided, associate with the firm's first active client for convenience
    if (!clientId) {
      const defaultClient = await prisma.client.findFirst({
        where: { firmId: user.firmId },
        orderBy: { createdAt: "asc" },
      });
      if (!defaultClient) {
        return errorResponse("No client found for this firm. Please create a client first.", 400);
      }
      clientId = defaultClient.id;
    }

    // Convert file to Base64 for the AI Vision pipeline
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Construct preview URL (using data URI for immediate, zero-storage preview)
    const filePreviewUrl = `data:${file.type};base64,${base64Data}`;

    // Run AI OCR & Information Extraction Pipeline
    const extractedData = await AiExtractorService.extractFromInvoice(
      base64Data,
      file.type,
      file.name
    );

    // Save to Database via InvoiceService in PENDING staging status
    const invoice = await InvoiceService.createInvoice(
      {
        clientId,
        invoiceNumber: extractedData.invoiceNumber,
        vendorName: extractedData.vendorName,
        transactionDate: new Date(extractedData.transactionDate),
        subtotal: extractedData.subtotal,
        taxAmount: extractedData.taxAmount,
        totalAmount: extractedData.totalAmount,
        currency: extractedData.currency,
        category: extractedData.category,
        fileUrl: filePreviewUrl,
        stagingStatus: "PENDING",
        aiRawResponse: JSON.stringify({
          confidenceScore: extractedData.confidenceScore,
          extractedAt: new Date().toISOString(),
          originalFileName: file.name,
        }),
        items: extractedData.items,
      },
      user.id
    );

    return successResponse(
      {
        invoice,
        extraction: extractedData,
      },
      201
    );
  } catch (error: any) {
    console.error("POST /api/invoices/upload error:", error);
    return errorResponse(error?.message || "Failed to process and extract invoice", 500);
  }
}
