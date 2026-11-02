import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { VoiceMemoService } from "@/lib/services/voice-memo.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export const maxDuration = 60; // Allow 60 seconds for STT and LLM extraction

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    let clientId = formData.get("clientId") as string | null;

    if (!audioFile) {
      return errorResponse("No audio recording provided", 400);
    }

    // Default to first active client if none specified
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

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a base64 audio data URI for immediate in-browser playback
    const audioUrl = `data:${audioFile.type || "audio/webm"};base64,${buffer.toString("base64")}`;

    // 1. Transcribe audio via Groq Whisper or OpenAI Whisper
    const transcription = await VoiceMemoService.transcribeAudio(
      buffer,
      audioFile.name || "recording.webm",
      audioFile.type || "audio/webm"
    );

    // 2. Extract structured summary & action items via LLM
    const structuredSummary = await VoiceMemoService.extractStructuredSummary(transcription);

    // Calculate billable hours
    const billableHours = (structuredSummary.suggestedBillableMinutes / 60).toFixed(2);

    // 3. Persist to PostgreSQL database
    const voiceNote = await prisma.voiceNote.create({
      data: {
        clientId,
        userId: user.id,
        audioUrl,
        transcription,
        structuredSummary: structuredSummary as unknown as Prisma.InputJsonValue,
        billableHours: new Prisma.Decimal(billableHours),
      },
      include: {
        client: {
          select: { id: true, companyName: true, taxEntity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return successResponse(
      {
        voiceNote,
        structuredSummary,
      },
      201
    );
  } catch (error: any) {
    console.error("POST /api/voice-notes/transcribe error:", error);
    return errorResponse(error?.message || "Failed to process audio consultation", 500);
  }
}
