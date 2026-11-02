import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Request body schema for user registration */
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  firmName: z
    .string()
    .min(1, "Firm name is required")
    .max(200, "Firm name is too long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { fullName, email, password, firmName } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a URL-friendly slug from the firm name
    const slug = firmName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create firm + admin user in a transaction
    const user = await prisma.$transaction(async (tx: any) => {
      const firm = await tx.firm.create({
        data: {
          name: firmName,
          slug: `${slug}-${Date.now()}`, // ensure uniqueness
        },
      });

      return tx.user.create({
        data: {
          fullName,
          email,
          hashedPassword,
          role: "ADMIN",
          firmId: firm.id,
        },
      });
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
