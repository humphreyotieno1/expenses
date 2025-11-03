"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export type TrendDatum = {
  label: string;
  income: number;
  expense: number;
};

type ExpenseTrendChartProps = {
  data: TrendDatum[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
};

export function ExpenseTrendChart({
  data,
  isLoading,
  formatCurrency,
}: ExpenseTrendChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Loading trend data...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 text-sm text-muted-foreground">
        Add more transactions to visualize your monthly trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
      >
        <CartesianGrid
          stroke="var(--border)"
          strokeDasharray="4 4"
          opacity={0.25}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          stroke="var(--muted-foreground)"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}
          width={70}
        />
        <Tooltip
          cursor={{ strokeDasharray: "4 4", stroke: "var(--border)" }}
          contentStyle={{
            borderRadius: 12,
            borderColor: "var(--border)",
            background: "var(--background)",
            boxShadow:
              "0px 10px 30px rgba(15, 23, 42, 0.12), 0px 3px 10px rgba(15, 23, 42, 0.08)",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value: number, name) => {
            const label = name === "income" ? "Income" : "Expenses";
            return [formatCurrency(value), label];
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{ paddingTop: 4 }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="var(--chart-1)"
          strokeWidth={2.4}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Expenses"
          stroke="var(--chart-2)"
          strokeWidth={2.4}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
