import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { InvoiceService } from "@/lib/services/invoice.service";
import { createInvoiceSchema } from "@/lib/validations/invoice.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || undefined;
    const stagingStatus = (searchParams.get("status") as any) || undefined;
    const search = searchParams.get("search") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await InvoiceService.getInvoices(user.firmId, {
      clientId,
      stagingStatus,
      search,
      page,
      limit,
    });

    return successResponse(result.invoices, 200, result.meta);
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return errorResponse("Failed to fetch invoices", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const invoice = await InvoiceService.createInvoice(validatedData, user.id);
    return successResponse(invoice, 201);
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    if (error.name === "ZodError") {
      return errorResponse("Validation failed", 422, error.errors);
    }
    return errorResponse("Failed to create invoice", 500);
  }
}
