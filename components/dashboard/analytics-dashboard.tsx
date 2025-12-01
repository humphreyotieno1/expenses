"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ExpenseFilters } from "@/store/expense-store";
import { type SupportedCurrency, formatCurrencyValue } from "@/lib/currency";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface AnalyticsDashboardProps {
    filters: ExpenseFilters;
    currency: SupportedCurrency;
}

interface Insight {
    title: string;
    value: number;
    change: number;
    description: string;
}

export function AnalyticsDashboard({ filters, currency }: AnalyticsDashboardProps) {
    const [data, setData] = useState<{ dayOfWeek: any[]; categoryTrend: any[]; insights?: Insight[]; monthlyTrend?: any[] } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.from) params.set("from", filters.from);
                if (filters.to) params.set("to", filters.to);

                const res = await fetch(`/api/analytics?${params.toString()}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [filters.from, filters.to]);

    const dayOfWeekChartData = useMemo(() => {
        if (!data?.dayOfWeek) return [];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        // Ensure all days are present
        return days.map((day, index) => {
            const found = data.dayOfWeek.find((d: any) => d.day === index);
            return { name: day, total: found ? Number(found.total) : 0 };
        });
    }, [data]);

    const categoryTrendChartData = useMemo(() => {
        if (!data?.categoryTrend) return { data: [], categories: [] };
        const grouped = new Map<string, any>();
        const categories = new Set<string>();

        data.categoryTrend.forEach((item: any) => {
            const month = format(new Date(item.month), "MMM yyyy");
            if (!grouped.has(month)) {
                grouped.set(month, { name: month });
            }
            const entry = grouped.get(month);
            entry[item.category] = Number(item.total);
            categories.add(item.category);
        });

        return { data: Array.from(grouped.values()), categories: Array.from(categories) };
    }, [data]);

    const monthlyTrendChartData = useMemo(() => {
        if (!data?.monthlyTrend) return [];
        return data.monthlyTrend.map((item: any) => ({
            name: format(new Date(item.month), "MMM yyyy"),
            income: Number(item.income),
            expense: Number(item.expense)
        }));
    }, [data]);

    if (loading && !data) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-4">
            {data?.insights && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {data.insights.map((insight) => (
                        <Card key={insight.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {insight.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrencyValue(insight.value, currency)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {insight.change > 0 ? "+" : ""}{insight.change.toFixed(1)}% {insight.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Spending by Day of Week</CardTitle>
                        <CardDescription>Total expenses grouped by day</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayOfWeekChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatCurrencyValue(value, currency)}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrencyValue(value, currency)}
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        backgroundColor: "var(--popover)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        color: "var(--popover-foreground)"
                                    }}
                                    itemStyle={{ color: "var(--popover-foreground)" }}
                                    labelStyle={{ color: "var(--popover-foreground)" }}
                                />
                                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Category Trends</CardTitle>
                        <CardDescription>Monthly spending per category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryTrendChartData.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatCurrencyValue(value, currency)}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrencyValue(value, currency)}
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        backgroundColor: "var(--popover)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        color: "var(--popover-foreground)"
                                    }}
                                    itemStyle={{ color: "var(--popover-foreground)" }}
                                    labelStyle={{ color: "var(--popover-foreground)" }}
                                />
                                <Legend />
                                {categoryTrendChartData.categories.map((cat, index) => (
                                    <Bar
                                        key={cat}
                                        dataKey={cat}
                                        stackId="a"
                                        fill={`var(--chart-${(index % 5) + 1})`}
                                        radius={[0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Income vs Expense (Last 6 Months)</CardTitle>
                    <CardDescription>Monthly comparison</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrendChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrencyValue(value, currency)}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrencyValue(value, currency)}
                                cursor={{ fill: "transparent" }}
                                contentStyle={{
                                    backgroundColor: "var(--popover)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    color: "var(--popover-foreground)"
                                }}
                                itemStyle={{ color: "var(--popover-foreground)" }}
                                labelStyle={{ color: "var(--popover-foreground)" }}
                            />
                            <Legend />
                            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
