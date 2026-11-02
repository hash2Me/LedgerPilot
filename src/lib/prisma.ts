// Prisma client singleton for the LedgerPilot project
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in hot-reloading environments (e.g., Next.js dev server)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Enable query logging for development; remove in production
    log: [{ emit: "event", level: "query" }],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
