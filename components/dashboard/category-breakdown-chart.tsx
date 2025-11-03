"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type CategoryDatum = {
  name: string;
  value: number;
};

type CategoryBreakdownChartProps = {
  data: CategoryDatum[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryBreakdownChart({
  data,
  isLoading,
  formatCurrency,
}: CategoryBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Loading category insights...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 text-sm text-muted-foreground">
        You haven&apos;t recorded any expenses yet. Add a few to unlock insights.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-[260px] flex-col">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            stroke="var(--background)"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: 12,
              borderColor: "var(--border)",
              background: "var(--background)",
              boxShadow:
                "0px 10px 30px rgba(15, 23, 42, 0.12), 0px 3px 10px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value: number, name) => {
              return [formatCurrency(value), name as string];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li
              key={item.name}
              className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                {item.name}
              </span>
              <span className="font-medium text-foreground">
                {formatCurrency(item.value)} · {percentage}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
