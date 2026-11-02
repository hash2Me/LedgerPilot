// ──────────────────────────────────────────────
// Shared TypeScript types for LedgerPilot
// Mirror Prisma enums so they can be used on the client
// without importing the generated Prisma client.
// ──────────────────────────────────────────────

/** Firm billing tier */
export type BillingTier = "FREE" | "PRO" | "ENTERPRISE";

/** Platform user role */
export type UserRole = "ADMIN" | "ACCOUNTANT" | "CLIENT";

/** Client company tax entity classification */
export type TaxEntity = "LLC" | "S_CORP" | "C_CORP" | "SOLE_PROP" | "PARTNERSHIP";

/** Client lifecycle status */
export type ClientStatus = "ACTIVE" | "ONBOARDING" | "ARCHIVED";

/** Invoice staging / review status */
export type StagingStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Document request workflow status */
export type DocumentRequestStatus = "REQUESTED" | "SUBMITTED" | "VERIFIED";

// ──────────────────────────────────────────────
// Session / Auth types
// ──────────────────────────────────────────────

/** Minimal user object stored in the NextAuth session */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  firmId: string;
}
