import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { InvoiceService } from "@/lib/services/invoice.service";
import { updateInvoiceStagingSchema } from "@/lib/validations/invoice.schema";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const invoice = await InvoiceService.getInvoiceById(id, user.firmId);

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return successResponse(invoice);
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return errorResponse("Failed to fetch invoice", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateInvoiceStagingSchema.parse(body);

    const updated = await InvoiceService.updateStagingStatus(
      id,
      user.firmId,
      validatedData.stagingStatus,
      validatedData
    );

    return successResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/invoices/[id] error:", error);
    if (error.name === "ZodError") {
      return errorResponse("Validation failed", 422, error.errors);
    }
    return errorResponse(error?.message || "Failed to update invoice", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await prisma.invoice.findFirst({
      where: { id, client: { firmId: user.firmId } },
    });

    if (!existing) {
      return errorResponse("Invoice not found", 404);
    }

    await prisma.invoice.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error);
    return errorResponse("Failed to delete invoice", 500);
  }
}
