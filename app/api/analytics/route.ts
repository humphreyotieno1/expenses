import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  // 1. Day of Week Analysis (0 = Sunday, 6 = Saturday)
  const dayOfWeekData = await prisma.$queryRaw`
    SELECT EXTRACT(DOW FROM date) as day, SUM(amount) as total
    FROM "Expense"
    WHERE "userId" = ${session.user.id}
    AND type = 'EXPENSE'
    ${fromParam ? Prisma.sql`AND date >= ${new Date(fromParam)}` : Prisma.empty}
    ${toParam ? Prisma.sql`AND date <= ${new Date(toParam)}` : Prisma.empty}
    GROUP BY day
    ORDER BY day
  `;

  // 2. Category Trend (Monthly)
  const categoryTrendData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', date) as month,
      category,
      SUM(amount) as total
    FROM "Expense"
    WHERE "userId" = ${session.user.id}
    AND type = 'EXPENSE'
    ${fromParam ? Prisma.sql`AND date >= ${new Date(fromParam)}` : Prisma.empty}
    ${toParam ? Prisma.sql`AND date <= ${new Date(toParam)}` : Prisma.empty}
    GROUP BY month, category
    ORDER BY month ASC
  `;

  // 3. Insights Calculation
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthTotal] = await prisma.$queryRaw<{ total: number }[]>`
    SELECT SUM(amount) as total FROM "Expense"
    WHERE "userId" = ${session.user.id} AND type = 'EXPENSE'
    AND date >= ${currentMonthStart}
  `;

  const [lastMonthTotal] = await prisma.$queryRaw<{ total: number }[]>`
    SELECT SUM(amount) as total FROM "Expense"
    WHERE "userId" = ${session.user.id} AND type = 'EXPENSE'
    AND date >= ${lastMonthStart} AND date <= ${lastMonthEnd}
  `;

  const currentTotal = Number(currentMonthTotal?.total || 0);
  const lastTotal = Number(lastMonthTotal?.total || 0);
  const percentageChange = lastTotal === 0 ? 0 : ((currentTotal - lastTotal) / lastTotal) * 100;

  const insights = [
    {
      title: "Monthly Spending",
      value: currentTotal,
      change: percentageChange,
      description: `vs. last month (${lastTotal})`
    }
  ];

  // 4. Month-over-Month Chart Data (Last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyTrendData = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', date) as month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM "Expense"
    WHERE "userId" = ${session.user.id}
    AND date >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY month ASC
  `;

  return NextResponse.json({
    dayOfWeek: dayOfWeekData,
    categoryTrend: categoryTrendData,
    insights,
    monthlyTrend: monthlyTrendData
  });
}
