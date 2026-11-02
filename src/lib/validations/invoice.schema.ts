import { z } from "zod";

export const StagingStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Item description is required"),
  quantity: z.coerce.number().min(1).default(1),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  invoiceNumber: z.string().max(64).optional().nullable(),
  vendorName: z.string().min(1, "Vendor name is required").max(128),
  transactionDate: z.coerce.date(),
  subtotal: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default("USD"),
  category: z.string().max(64).optional().nullable(),
  fileUrl: z.string().min(1, "File URL or attachment is required"),
  stagingStatus: StagingStatusEnum.default("PENDING"),
  items: z.array(invoiceItemSchema).default([]),
  aiRawResponse: z.string().optional().nullable(),
});

export const updateInvoiceStagingSchema = z.object({
  stagingStatus: StagingStatusEnum,
  category: z.string().max(64).optional().nullable(),
  vendorName: z.string().min(1).max(128).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  subtotal: z.coerce.number().min(0).optional(),
  items: z.array(invoiceItemSchema).optional(),
});

/**
 * Zod schema for structured output from OpenAI GPT-4o Vision OCR
 */
export const aiInvoiceExtractionSchema = z.object({
  vendorName: z.string().describe("The name of the vendor, merchant, or supplier"),
  invoiceNumber: z.string().nullable().describe("The invoice, bill, or receipt reference number"),
  transactionDate: z.string().describe("ISO date string (YYYY-MM-DD) of the transaction"),
  currency: z.string().default("USD").describe("3-letter ISO currency code (USD, EUR, GBP, CAD)"),
  subtotal: z.number().describe("Subtotal amount before taxes"),
  taxAmount: z.number().default(0).describe("Total sales tax or VAT amount"),
  totalAmount: z.number().describe("Final total amount paid or due"),
  category: z.string().describe("Recommended accounting category (e.g. Office Supplies, Travel, Software & Subscriptions, Meals & Entertainment, Utilities)"),
  confidenceScore: z.number().min(0).max(100).describe("Confidence score (0-100) based on image clarity and data completeness"),
  items: z.array(
    z.object({
      description: z.string().describe("Description of the line item or service"),
      quantity: z.number().default(1).describe("Quantity purchased"),
      unitPrice: z.number().describe("Price per unit"),
      amount: z.number().describe("Total amount for this line item"),
    })
  ).describe("Parsed individual line items"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceStagingInput = z.infer<typeof updateInvoiceStagingSchema>;
export type AiInvoiceExtraction = z.infer<typeof aiInvoiceExtractionSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
