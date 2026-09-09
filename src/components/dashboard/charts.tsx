"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

export function CashFlowChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMonthlyData();
    }
  }, [user]);

  const fetchMonthlyData = async () => {
    const supabase = createClient();
    const now = new Date();
    const months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const firstDay = date.toISOString().split("T")[0];
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user?.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .neq("type", "transfer");

      let income = 0;
      let expense = 0;
      transactions?.forEach((t) => {
        if (t.type === "income") income += Number(t.amount);
        else if (t.type === "expense") expense += Number(t.amount);
      });

      months.push({
        month: date.toLocaleDateString("id-ID", { month: "short" }),
        income,
        expense,
      });
    }

    setData(months);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Arus Kas 6 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arus Kas 6 Bulan Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => `Bulan: ${label}`}
            />
            <Legend />
            <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ExpenseByCategoryChart() {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCategoryData();
    }
  }, [user]);

  const fetchCategoryData = async () => {
    const supabase = createClient();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data: transactions } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("date", firstDay)
      .lte("date", lastDay);

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, color")
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    const categoryMap = new Map(categories?.map((c) => [c.id, c]) || []);
    const aggregated = new Map<string, number>();

    transactions?.forEach((t) => {
      if (t.category_id) {
        const current = aggregated.get(t.category_id) || 0;
        aggregated.set(t.category_id, current + Number(t.amount));
      }
    });

    const chartData: CategoryData[] = [];
    let colorIndex = 0;
    aggregated.forEach((value, key) => {
      const category = categoryMap.get(key);
      chartData.push({
        name: category?.name || "Lainnya",
        value,
        color: category?.color || COLORS[colorIndex % COLORS.length],
      });
      colorIndex++;
    });

    chartData.sort((a, b) => b.value - a.value);
    setData(chartData);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Belum ada data pengeluaran bulan ini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengeluaran per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
