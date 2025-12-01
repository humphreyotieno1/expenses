"use client";

import { useEffect, useMemo, useState } from "react";
import { format, endOfToday, endOfDay, startOfDay, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Filter, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useRouter } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useExpenseStore,
  type Expense,
  type ExpenseFilters,
} from "@/store/expense-store";
import { type TransactionType } from "@/lib/validators/expense";
import { ExpenseTrendChart } from "@/components/dashboard/expense-trend-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { TransactionDialog } from "@/components/dashboard/transaction-dialog";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { DeleteExpenseDialog } from "@/components/dashboard/delete-expense-dialog";
import type { DateRange } from "react-day-picker";
import { formatCurrencyValue, supportedCurrencies, type SupportedCurrency } from "@/lib/currency";

const typeOptions: Array<{ label: string; value: TransactionType | "ALL" }> = [
  { label: "All types", value: "ALL" },
  { label: "Income", value: "INCOME" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Savings", value: "SAVINGS" },
];

type DashboardShellProps = {
  displayName: string;
  currency: SupportedCurrency;
};

const quickExportOptions: Array<{
  label: string;
  range: () => { from: Date; to: Date };
}> = [
    {
      label: "Last 7 days",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subDays(to, 6));
        return { from, to };
      },
    },
    {
      label: "Last 14 days",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subDays(to, 13));
        return { from, to };
      },
    },
    {
      label: "Last 21 days",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subDays(to, 20));
        return { from, to };
      },
    },
    {
      label: "Last 30 days",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subDays(to, 29));
        return { from, to };
      },
    },
    {
      label: "Last 1 month",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subMonths(to, 1));
        return { from, to };
      },
    },
    {
      label: "Last 2 months",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subMonths(to, 2));
        return { from, to };
      },
    },
    {
      label: "Last 3 months",
      range: () => {
        const to = endOfToday();
        const from = startOfDay(subMonths(to, 3));
        return { from, to };
      },
    },
  ];

export function DashboardShell({ displayName, currency }: DashboardShellProps) {
  const router = useRouter();
  const {
    expenses,
    recent,
    summary,
    trend,
    categoryBreakdown,
    savingsByLocation,
    allCategories,
    totalCount,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    lastSyncedAt,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    fetchExpenses,
  } = useExpenseStore(
    useShallow((state) => ({
      expenses: state.expenses,
      recent: state.recent,
      summary: state.summary,
      trend: state.trend,
      categoryBreakdown: state.categoryBreakdown,
      savingsByLocation: state.savingsByLocation,
      allCategories: state.allCategories,
      totalCount: state.totalCount,
      page: state.page,
      pageSize: state.pageSize,
      isLoading: state.isLoading,
      error: state.error,
      filters: state.filters,
      lastSyncedAt: state.lastSyncedAt,
      setFilters: state.setFilters,
      resetFilters: state.resetFilters,
      setPage: state.setPage,
      setPageSize: state.setPageSize,
      fetchExpenses: state.fetchExpenses,
    })),
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [isCustomExportOpen, setIsCustomExportOpen] = useState(false);
  const [customExportRange, setCustomExportRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    setFilters({
      from: start.toISOString(),
      to: end.toISOString(),
    });
  }, [currentMonth, setFilters]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const categories = useMemo(() => {
    return allCategories.length > 0 ? allCategories : [];
  }, [allCategories]);

  const formatAmount = useMemo(
    () => (amount: number, type: TransactionType) => {
      const formatted = formatCurrencyValue(Math.abs(amount), selectedCurrency);
      return type === "EXPENSE" ? `-${formatted}` : `+${formatted}`;
    },
    [selectedCurrency],
  );

  const formatSummaryValue = useMemo(
    () => (value: number) => {
      const formatted = formatCurrencyValue(Math.abs(value), selectedCurrency);
      return value < 0 ? `-${formatted}` : formatted;
    },
    [selectedCurrency],
  );

  const handleFilterChange = async (partial: Partial<ExpenseFilters>) => {
    await setFilters(partial);
  };



  const handleExport = async (range?: { from?: Date; to?: Date }) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);

    const fromDateRaw = range?.from ?? (filters.from ? new Date(filters.from) : undefined);
    const toDateRaw = range?.to ?? (filters.to ? new Date(filters.to) : undefined);

    const fromDate = fromDateRaw ? startOfDay(fromDateRaw) : undefined;
    const toDate = toDateRaw ? endOfDay(toDateRaw) : undefined;

    if (fromDate) params.set("from", fromDate.toISOString());
    if (toDate) params.set("to", toDate.toISOString());

    params.set("page", "1");
    params.set("pageSize", Math.max(totalCount || pageSize, pageSize).toString());

    try {
      const response = await fetch(`/api/expenses?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = await response.json();
      const rows: Expense[] = payload?.data ?? [];

      if (!rows.length) {
        toast.info("No transactions to export yet");
        return;
      }

      const headers = ["Date", "Title", "Category", "Type", "Amount", "Notes"];
      const csvRows = rows.map((expense) => [
        format(new Date(expense.date), "yyyy-MM-dd"),
        expense.title,
        expense.category,
        expense.type,
        expense.amount.toFixed(2),
        expense.notes ?? "",
      ]);

      const csv = [headers, ...csvRows]
        .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export started", {
        description: "A CSV containing your selected period is downloading.",
      });
    } catch (error) {
      console.error("[Dashboard][export]", error);
      toast.error("Export failed", { description: "Unable to generate the CSV right now." });
    }
  };

  const handleCurrencyChange = async (value: SupportedCurrency) => {
    if (value === selectedCurrency) return;
    setIsUpdatingCurrency(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: value }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSelectedCurrency(value);
      toast.success("Currency updated", {
        description: `Amounts are now shown in ${value}.`,
      });
      router.refresh();
    } catch (error) {
      console.error("[Dashboard][currency]", error);
      toast.error("Could not update currency. Please try again.");
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const openCreate = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const openDelete = (expense: Expense) => {
    setDeleteExpense(expense);
    setIsDeleteOpen(true);
  };

  const activeType = filters.type ?? "ALL";

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
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
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[210px]" disabled={isUpdatingCurrency}>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate}>Add Transaction</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {quickExportOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => handleExport(option.range())}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCustomExportOpen(true)}>
                  Custom range…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="secondary"
              onClick={() => void fetchExpenses()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              {isLoading ? "Refreshing" : "Refresh"}
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Total Income"
                  value={formatSummaryValue(summary.income)}
                  subtitle="For the active filters"
                />
                <SummaryCard
                  title="Total Expenses"
                  value={formatSummaryValue(summary.expense)}
                  subtitle="For the active filters"
                />
                <SummaryCard
                  title="Total Savings"
                  value={formatSummaryValue(summary.savings)}
                  subtitle="For the active filters"
                />
                <SummaryCard
                  title="Net Balance"
                  value={formatSummaryValue(summary.net)}
                  subtitle="Income - Expenses - Savings"
                />
                <Card className="shadow-sm">
                  <CardHeader className="space-y-1">
                    <CardDescription>Active filters</CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight">
                      {filters.category || filters.type || filters.from || filters.to
                        ? "Custom view"
                        : "All data"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-xs">
                    {filters.type ? <Badge variant="outline">Type: {filters.type}</Badge> : null}
                    {filters.category ? (
                      <Badge variant="outline">Category: {filters.category}</Badge>
                    ) : null}
                    {filters.from ? (
                      <Badge variant="outline">From: {format(new Date(filters.from), "MMM d, yyyy")}</Badge>
                    ) : null}
                    {filters.to ? (
                      <Badge variant="outline">To: {format(new Date(filters.to), "MMM d, yyyy")}</Badge>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const now = new Date();
                        setCurrentMonth(now);
                        await resetFilters();
                        const start = startOfMonth(now);
                        const end = endOfMonth(now);
                        await setFilters({ from: start.toISOString(), to: end.toISOString() });
                      }}
                      disabled={isLoading}
                    >
                      Clear filters
                    </Button>
                  </CardFooter>
                </Card>
              </section>

              <section className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm">
                <header className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1 text-xs uppercase">
                    <Filter className="mr-2 h-3 w-3" /> Filters
                  </Badge>

                  <Select
                    value={activeType}
                    onValueChange={async (value) => {
                      await handleFilterChange({
                        type: value === "ALL" ? undefined : (value as TransactionType),
                      });
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.category ?? "ALL"}
                    onValueChange={async (value) => {
                      await handleFilterChange({ category: value === "ALL" ? undefined : value });
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <MonthSelector
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                </header>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <TransactionsTable
                  expenses={expenses}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  formatAmount={formatAmount}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} –
                    {Math.min(page * pageSize, totalCount)} of {totalCount} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (page > 1) await setPage(page - 1);
                      }}
                      disabled={page === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (page < totalPages) await setPage(page + 1);
                      }}
                      disabled={page === totalPages || isLoading}
                    >
                      Next
                    </Button>
                    <Select
                      value={String(pageSize)}
                      onValueChange={async (value) => {
                        await setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Rows" />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50].map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size} / page
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                      data={trend}
                      isLoading={isLoading}
                      formatCurrency={(value) => formatCurrencyValue(value, selectedCurrency)}
                    />
                  </CardContent>
                </Card>
                <Card className="min-h-[320px]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">Category Breakdown</CardTitle>
                      <CardDescription>This period</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CategoryBreakdownChart
                      data={categoryBreakdown}
                      isLoading={isLoading}
                      formatCurrency={(value) => formatCurrencyValue(value, selectedCurrency)}
                    />
                  </CardContent>
                </Card>
              </section>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <CardDescription>
                      {recent.length === 0
                        ? "Add transactions to start tracking your spending."
                        : "Your latest activity appears here."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading your transactions…</p>
                  ) : recent.length > 0 ? (
                    <ul className="space-y-3">
                      {recent.map((transaction) => (
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
                            className={cn(
                              "text-sm font-semibold",
                              transaction.type === "INCOME" ? "text-emerald-600" : "text-rose-500",
                            )}
                          >
                            {formatAmount(transaction.amount, transaction.type)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 p-10 text-center text-sm text-muted-foreground">
                      You don&apos;t have any transactions yet. Add your first income or expense to see it here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard filters={filters} currency={selectedCurrency} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={editingExpense ? "edit" : "create"}
        expense={editingExpense}
        categories={categories}
        defaultCategory={filters.category ?? categories[0] ?? "Other"}
      />

      <DeleteExpenseDialog
        expense={deleteExpense}
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setDeleteExpense(null);
          }
        }}
      />

      <Dialog open={isCustomExportOpen} onOpenChange={setIsCustomExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select export range</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="range"
            selected={customExportRange}
            onSelect={setCustomExportRange}
            numberOfMonths={2}
            initialFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!customExportRange?.from || !customExportRange?.to) {
                  toast.error("Select a start and end date to export.");
                  return;
                }
                void handleExport({
                  from: customExportRange.from,
                  to: customExportRange.to,
                });
                setIsCustomExportOpen(false);
              }}
              disabled={!customExportRange?.from || !customExportRange?.to}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <CardTitle className="text-3xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

