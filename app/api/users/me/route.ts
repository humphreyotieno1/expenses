import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const onboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be less than 120 characters.")
    .optional(),
  onboarded: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof onboardingSchema>;

  try {
    const body = await request.json();
    payload = onboardingSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed.",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const data: { name?: string | null; onboarded: boolean } = {
    onboarded: payload.onboarded ?? true,
  };

  if (typeof payload.name !== "undefined") {
    data.name = payload.name.length > 0 ? payload.name : null;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      onboarded: true,
    },
  });

  return NextResponse.json({ data: updated });
}

