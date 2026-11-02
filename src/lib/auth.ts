import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * NextAuth configuration for LedgerPilot.
 *
 * Uses JWT strategy with a Credentials provider that authenticates
 * against the Prisma User table. Custom callbacks expose the user's
 * role and firmId on the session object.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          firmId: user.firmId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, persist role + firmId into the JWT
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role;
        token.firmId = u.firmId;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose role + firmId on the client-side session
      if (session.user) {
        const sUser = session.user as unknown as Record<string, unknown>;
        sUser.id = token.sub;
        sUser.role = token.role;
        sUser.firmId = token.firmId;
      }
      return session;
    },
  },
};
