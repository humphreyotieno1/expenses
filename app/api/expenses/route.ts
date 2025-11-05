import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

import { authOptions } from "@/lib/auth";
import { type CreateExpenseInput, createExpenseSchema, type TransactionType } from "@/lib/validators/expense";
import prisma from "@/lib/prisma";

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
    amount: Number(expense.amount),
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
  const search = url.searchParams.get("search")?.trim();
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const pageSizeParam = Number(url.searchParams.get("pageSize") ?? "10");

  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSizeRaw = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.floor(pageSizeParam) : 10;
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 50);
  const skip = (page - 1) * pageSize;

  const dateFilter: { gte?: Date; lte?: Date } = {};

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

  type ExpenseWhereInput = NonNullable<Parameters<typeof prisma.expense.findMany>[0]> extends { where?: infer W }
    ? W
    : never;

  const where: ExpenseWhereInput = {
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

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const totalCount = expenses.length;
  const pagedExpenses = expenses.slice(skip, skip + pageSize).map((expense) => serializeExpense(expense));
  const recent = expenses.slice(0, 5).map((expense) => serializeExpense(expense));

  const summary = expenses.reduce(
    (acc, expense) => {
      const amount = Number(expense.amount);
      if (expense.type === "INCOME") {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      acc.net = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, net: 0 },
  );

  const trendMap = new Map<string, { label: string; income: number; expense: number; order: number }>();

  expenses.forEach((expense) => {
    const parsedDate = new Date(expense.date);
    if (Number.isNaN(parsedDate.valueOf())) return;

    const key = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
    if (!trendMap.has(key)) {
      trendMap.set(key, {
        label: formatMonthLabel(parsedDate),
        income: 0,
        expense: 0,
        order: parsedDate.getFullYear() * 12 + parsedDate.getMonth(),
      });
    }

    const entry = trendMap.get(key)!;
    if (expense.type === "INCOME") {
      entry.income += Number(expense.amount);
    } else {
      entry.expense += Number(expense.amount);
    }
  });

  const trend = Array.from(trendMap.values())
    .sort((a, b) => a.order - b.order)
    .slice(-6)
    .map(({ label, income, expense }) => ({ label, income, expense }));

  const categoryTotals = new Map<string, number>();
  expenses.forEach((expense) => {
    if (expense.type !== "EXPENSE") return;
    const key = expense.category?.trim() || "Uncategorized";
    categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + Number(expense.amount));
  });

  const categoryBreakdown = Array.from(categoryTotals.entries()).map(([name, value]) => ({ name, value }));

  return NextResponse.json({
    data: pagedExpenses,
    meta: {
      totalCount,
      page,
      pageSize,
    },
    summary,
    trend,
    categoryBreakdown,
    recent,
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
        amount: payload.amount,
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

