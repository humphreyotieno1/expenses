"use client";

import { useMemo } from "react";
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

// Custom tooltip content that properly handles dark mode
function CustomTooltipContent({ 
  active, 
  payload, 
  formatter 
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload?: unknown }>;
  formatter?: (value: number, name: string) => [string, string];
}) {
  const styles = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        background: "#ffffff",
        color: "#000000",
        borderColor: "#e5e7eb",
      };
    }

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      background: computedStyle.getPropertyValue("--background").trim() || "#ffffff",
      color: computedStyle.getPropertyValue("--foreground").trim() || "#000000",
      borderColor: computedStyle.getPropertyValue("--border").trim() || "#e5e7eb",
    };
  }, []);

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const formattedValue = formatter 
    ? formatter(data.value, data.name)
    : [`${data.value}`, data.name];

  return (
    <div
      style={{
        backgroundColor: styles.background,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: "12px",
        padding: "8px 12px",
        boxShadow: "0px 10px 30px rgba(15, 23, 42, 0.12), 0px 3px 10px rgba(15, 23, 42, 0.08)",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "4px", color: styles.color }}>
        {data.name}
      </p>
      <p style={{ color: styles.color }}>
        {formattedValue[0]}
      </p>
    </div>
  );
}

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
    <div className="flex min-h-[260px] flex-col">
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
            content={(props) => (
              <CustomTooltipContent 
                {...props} 
                formatter={(value: number, name: string) => [formatCurrency(value), name]} 
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 max-h-[200px] overflow-y-auto">
        <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li
                key={item.name}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                  <span className="truncate font-medium text-foreground">{item.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatCurrency(item.value)} · {percentage}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
