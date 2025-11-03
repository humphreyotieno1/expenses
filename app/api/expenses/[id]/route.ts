import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  type UpdateExpenseInput,
  updateExpenseSchema,
} from "@/lib/validators/expense";

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

async function authorizeExpense(userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  return expense;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const expense = await authorizeExpense(session.user.id, id);

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeExpense(expense) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await authorizeExpense(session.user.id, id);

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  let payload: UpdateExpenseInput;

  try {
    const body = await request.json();
    payload = updateExpenseSchema.parse(body);
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

  const data: Prisma.ExpenseUpdateInput = {};

  if (payload.title !== undefined) {
    data.title = payload.title.trim();
  }

  if (payload.category !== undefined) {
    data.category = payload.category.trim();
  }

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.amount !== undefined) {
    data.amount = new Prisma.Decimal(payload.amount);
  }

  if (payload.date !== undefined) {
    data.date = payload.date;
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes?.trim() ?? null;
  }

  try {
    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ data: serializeExpense(updated) });
  } catch (error) {
    console.error("[API][expenses][PUT]", error);
    return NextResponse.json({ error: "Failed to update expense." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await authorizeExpense(session.user.id, id);

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  try {
    await prisma.expense.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API][expenses][DELETE]", error);
    return NextResponse.json({ error: "Failed to delete expense." }, { status: 500 });
  }
}

