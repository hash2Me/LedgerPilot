import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

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
    const voiceNote = await prisma.voiceNote.findFirst({
      where: {
        id,
        client: { firmId: user.firmId },
      },
      include: {
        client: true,
        user: true,
      },
    });

    if (!voiceNote) {
      return errorResponse("Voice note not found", 404);
    }

    return successResponse(voiceNote);
  } catch (error) {
    console.error("GET /api/voice-notes/[id] error:", error);
    return errorResponse("Failed to fetch voice note", 500);
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
    const existing = await prisma.voiceNote.findFirst({
      where: {
        id,
        client: { firmId: user.firmId },
      },
    });

    if (!existing) {
      return errorResponse("Voice note not found", 404);
    }

    await prisma.voiceNote.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/voice-notes/[id] error:", error);
    return errorResponse("Failed to delete voice note", 500);
  }
}
