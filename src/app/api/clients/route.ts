import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { ClientService } from "@/lib/services/client.service";
import { createClientSchema, clientFilterSchema } from "@/lib/validations/client.schema";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const filters = clientFilterSchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      taxEntity: searchParams.get("taxEntity") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const result = await ClientService.getClients(user.firmId, filters);
    return successResponse(result.clients, 200, result.meta);
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return errorResponse("Failed to fetch clients", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    const client = await ClientService.createClient(user.firmId, validatedData);
    return successResponse(client, 201);
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    if (error.name === "ZodError") {
      return errorResponse("Invalid client data", 422, error.errors);
    }
    return errorResponse("Failed to create client", 500);
  }
}
