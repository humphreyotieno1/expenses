"use client";

import { useEffect, useMemo } from "react";
import { format } from "date-fns";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { ExpenseTrendChart } from "@/components/dashboard/expense-trend-chart";
import { useExpenseStore } from "@/store/expense-store";

type DashboardShellProps = {
  displayName: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function DashboardShell({ displayName }: DashboardShellProps) {
  const {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    lastSyncedAt,
  } = useExpenseStore((state) => ({
    expenses: state.expenses,
    isLoading: state.isLoading,
    error: state.error,
    fetchExpenses: state.fetchExpenses,
    lastSyncedAt: state.lastSyncedAt,
  }));

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    return expenses.reduce(
      (acc, expense) => {
        if (expense.type === "INCOME") {
          acc.totalIncome += expense.amount;
        } else {
          acc.totalExpenses += expense.amount;
        }
        acc.netBalance = acc.totalIncome - acc.totalExpenses;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netBalance: 0 },
    );
  }, [expenses]);

  const monthlyTrendData = useMemo(() => {
    const grouped = new Map<string, { label: string; income: number; expense: number }>();

    expenses.forEach((expense) => {
      const parsedDate = new Date(expense.date);
      if (Number.isNaN(parsedDate.valueOf())) {
        return;
      }

      const key = format(parsedDate, "yyyy-MM");
      if (!grouped.has(key)) {
        grouped.set(key, {
          label: format(parsedDate, "MMM yyyy"),
          income: 0,
          expense: 0,
        });
      }

      const entry = grouped.get(key)!;
      if (expense.type === "INCOME") {
        entry.income += expense.amount;
      } else {
        entry.expense += expense.amount;
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value);
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();

    expenses.forEach((expense) => {
      if (expense.type !== "EXPENSE") {
        return;
      }

      const category = expense.category?.trim() || "Uncategorized";
      totals.set(category, (totals.get(category) ?? 0) + expense.amount);
    });

    return Array.from(totals.entries())
      .sort(([, valueA], [, valueB]) => valueB - valueA)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const recentTransactions = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Welcome back, {displayName}!
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor your spending and income at a glance.
            </p>
            {lastSyncedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Last synced {format(new Date(lastSyncedAt), "MMM d, yyyy h:mm a")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default" size="sm" className="shadow-sm">
              Add Transaction
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm">
              Export Data
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="shadow-sm"
              onClick={() => void fetchExpenses()}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Income"
              value={currencyFormatter.format(totalIncome)}
              subtitle="vs. last month"
            />
            <SummaryCard
              title="Total Expenses"
              value={currencyFormatter.format(totalExpenses)}
              subtitle="vs. last month"
            />
            <SummaryCard
              title="Net Balance"
              value={currencyFormatter.format(netBalance)}
              subtitle="Updated daily"
            />
            <SummaryCard title="Upcoming Bills" value="0" subtitle="Due this week" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="min-h-[320px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Spending Trends</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ExpenseTrendChart
                  data={monthlyTrendData}
                  isLoading={isLoading}
                  formatCurrency={formatCurrency}
                />
              </CardContent>
            </Card>
            <Card className="min-h-[320px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Category Breakdown</CardTitle>
                  <CardDescription>This month</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <CategoryBreakdownChart
                  data={categoryBreakdown}
                  isLoading={isLoading}
                  formatCurrency={formatCurrency}
                />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <CardDescription>
                  {expenses.length === 0
                    ? "Add transactions to start tracking your spending."
                    : "Your latest activity appears here."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" className="shadow-sm">
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="shadow-sm">
                  Download CSV
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading your transactions...
                </p>
              ) : error ? (
                <p className="text-sm font-medium text-destructive">{error}</p>
              ) : recentTransactions.length > 0 ? (
                <ul className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border border-transparent bg-muted/40 px-4 py-3 shadow-sm transition-colors hover:border-border hover:bg-background"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")} · {transaction.category}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${transaction.type === "INCOME" ? "text-emerald-600" : "text-rose-500"}`}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {currencyFormatter.format(transaction.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                  You don&apos;t have any transactions yet. Add your first income or
                  expense to see it here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

