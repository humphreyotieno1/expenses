import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

import { authOptions } from "@/lib/auth";
import { type CreateExpenseInput, createExpenseSchema } from "@/lib/validators/expense";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { TransactionType } from "@/lib/generated/prisma/enums";

function parseTypeParam(value: string | null): TransactionType | undefined {
  if (!value) return undefined;

  const normalized = value.toUpperCase();
  if (normalized === "INCOME" || normalized === "EXPENSE") {
    return normalized as TransactionType;
  }

  return undefined;
}

function serializeExpense(expense: Awaited<ReturnType<typeof prisma.expense.findFirst>>) {
  if (!expense) return null;

  return {
    id: expense.id,
    title: expense.title,
    category: expense.category,
    type: expense.type,
    amount: expense.amount.toNumber(),
    date: expense.date.toISOString(),
    notes: expense.notes,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() || undefined;
  const type = parseTypeParam(url.searchParams.get("type"));
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const dateFilter: Prisma.DateTimeFilter = {};

  if (fromParam) {
    const parsed = new Date(fromParam);
    if (!Number.isNaN(parsed.valueOf())) {
      dateFilter.gte = parsed;
    }
  }

  if (toParam) {
    const parsed = new Date(toParam);
    if (!Number.isNaN(parsed.valueOf())) {
      dateFilter.lte = parsed;
    }
  }

  const where: Prisma.ExpenseWhereInput = {
    userId: session.user.id,
  };

  if (category) {
    where.category = category;
  }

  if (type) {
    where.type = type;
  }

  if (Object.keys(dateFilter).length > 0) {
    where.date = dateFilter;
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    data: expenses.map((expense) => serializeExpense(expense)),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateExpenseInput;

  try {
    const body = await request.json();
    payload = createExpenseSchema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({
        error: "Validation failed.",
        details: error.issues,
      }, { status: 422 });
    }

    return NextResponse.json({ error: "Failed to parse request." }, { status: 400 });
  }

  try {
    const created = await prisma.expense.create({
      data: {
        userId: session.user.id,
        title: payload.title.trim(),
        category: payload.category.trim(),
        type: payload.type,
        amount: new Prisma.Decimal(payload.amount),
        date: payload.date,
        notes: payload.notes?.trim() ?? null,
      },
    });

    return NextResponse.json({ data: serializeExpense(created) }, { status: 201 });
  } catch (error) {
    console.error("[API][expenses][POST]", error);
    return NextResponse.json({ error: "Failed to create expense." }, { status: 500 });
  }
}

