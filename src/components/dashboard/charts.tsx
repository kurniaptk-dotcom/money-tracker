"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
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

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-border">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-semibold font-mono">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-border">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-semibold text-foreground">{data.name}</span>
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

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
      <div className="card-modern p-6">
        <div className="h-6 w-48 skeleton mb-6" />
        <div className="h-[300px] skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="card-modern p-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Arus Kas</h3>
          <p className="text-sm text-muted-foreground">6 bulan terakhir</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Pemasukan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Pengeluaran</span>
          </div>
        </div>
      </div>

      {data.length === 0 ||
      data.every((d) => d.income === 0 && d.expense === 0) ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Belum ada data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) =>
                value >= 1000000
                  ? `${(value / 1000000).toFixed(0)}M`
                  : value >= 1000
                  ? `${(value / 1000).toFixed(0)}K`
                  : value
              }
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="income"
              name="Pemasukan"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expense"
              name="Pengeluaran"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
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
      <div className="card-modern p-6">
        <div className="h-6 w-48 skeleton mb-6" />
        <div className="h-[300px] skeleton rounded-xl" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-modern p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Pengeluaran per Kategori</h3>
          <p className="text-sm text-muted-foreground">Bulan ini</p>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Belum ada data pengeluaran</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="card-modern p-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Pengeluaran per Kategori</h3>
        <p className="text-sm text-muted-foreground">Bulan ini</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-3">
          {data.slice(0, 6).map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    <span className="text-sm font-mono text-muted-foreground ml-2">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold ml-2">
                  {formatCurrency(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
