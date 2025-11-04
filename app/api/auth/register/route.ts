import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be less than 120 characters.")
    .optional(),
  email: z
    .string()
    .min(1, "Email is required.")
    .email({ message: "Enter a valid email address." })
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be less than 100 characters."),
});

export async function POST(request: Request) {
  let payload;

  try {
    const body = await request.json();
    payload = registerSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed.",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists for that email address." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(payload.password, 12);

  try {
    await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name ?? null,
        passwordHash,
        onboarded: false,
      },
    });
  } catch (error) {
    console.error("[API][auth][register]", error);
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

