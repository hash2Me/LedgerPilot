import { z } from "zod";

export const TaxEntityEnum = z.enum([
  "LLC",
  "S_CORP",
  "C_CORP",
  "SOLE_PROP",
  "PARTNERSHIP",
]);

export const ClientStatusEnum = z.enum(["ACTIVE", "ONBOARDING", "ARCHIVED"]);

export const createClientSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(120, "Company name cannot exceed 120 characters"),
  taxEntity: TaxEntityEnum,
  einTaxId: z
    .string()
    .regex(/^(\d{2}-\d{7})?$/, "EIN must be in XX-XXXXXXX format")
    .optional()
    .or(z.literal("")),
  status: ClientStatusEnum.default("ONBOARDING"),
  assignedUserId: z.string().uuid("Invalid assigned user ID").optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid("Invalid client ID"),
});

export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: ClientStatusEnum.optional(),
  taxEntity: TaxEntityEnum.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientFilterInput = z.infer<typeof clientFilterSchema>;
