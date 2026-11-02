import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "ACCOUNTANT" | "CLIENT";
  firmId: string;
}

/**
 * Retrieve authenticated user from server session
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as CurrentUser;
}
