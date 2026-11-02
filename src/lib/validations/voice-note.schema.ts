import { z } from "zod";

export const createVoiceNoteSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  audioUrl: z.string().min(1, "Audio recording is required"),
  transcription: z.string().optional(),
  billableHours: z.coerce.number().min(0).max(24).optional().default(0),
});

/**
 * Structured LLM extraction from voice memo
 */
export const structuredVoiceSummarySchema = z.object({
  summary: z.string().describe("Concise 1-2 sentence executive summary of the discussion"),
  topics: z.array(z.string()).describe("List of topics discussed (e.g. Q3 Tax Planning, 1099 Filing, Payroll)"),
  actionItems: z.array(
    z.object({
      task: z.string().describe("Specific actionable task to be completed"),
      assignee: z.enum(["ACCOUNTANT", "CLIENT"]).describe("Who is responsible for the task"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Urgency of the item"),
      dueDate: z.string().nullable().describe("Suggested due date if mentioned (YYYY-MM-DD) or null"),
    })
  ).describe("Parsed action items from the memo"),
  taxNotes: z.array(z.string()).describe("Key tax or legal considerations noted"),
  suggestedBillableMinutes: z.number().describe("Estimated billable time in minutes for this consultation"),
});

export type CreateVoiceNoteInput = z.infer<typeof createVoiceNoteSchema>;
export type StructuredVoiceSummary = z.infer<typeof structuredVoiceSummarySchema>;
