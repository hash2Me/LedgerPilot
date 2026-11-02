import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || undefined;

    const voiceNotes = await prisma.voiceNote.findMany({
      where: {
        client: { firmId: user.firmId },
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, companyName: true, taxEntity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return successResponse(voiceNotes);
  } catch (error) {
    console.error("GET /api/voice-notes error:", error);
    return errorResponse("Failed to fetch voice notes", 500);
  }
}
