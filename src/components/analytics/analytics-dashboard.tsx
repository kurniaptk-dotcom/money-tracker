"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#f43f5e",
];

interface AnalyticsData {
  transactions: any[];
  accounts: any[];
  categories: any[];
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({ transactions: [], accounts: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "year">("month");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    const supabase = createClient();
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", sixMonthsAgo.toISOString().split("T")[0])
        .order("date", { ascending: true }),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_archived", false),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user?.id},user_id.is.null`),
    ]);

    setData({
      transactions: transactionsRes.data || [],
      accounts: accountsRes.data || [],
      categories: categoriesRes.data || [],
    });
    setIsLoading(false);
  };

  const getExpenseByCategory = () => {
    const expenses = data.transactions.filter((t) => t.type === "expense");
    const categoryMap = new Map<string, number>();

    expenses.forEach((t) => {
      const cat = data.categories.find((c) => c.id === t.category_id);
      const name = cat?.name || "Lainnya";
      categoryMap.set(name, (categoryMap.get(name) || 0) + Number(t.amount));
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getCashFlowByMonth = () => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    data.transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthMap.get(key) || { income: 0, expense: 0 };

      if (t.type === "income") {
        current.income += Number(t.amount);
      } else if (t.type === "expense") {
        current.expense += Number(t.amount);
      }
      monthMap.set(key, current);
    });

    return Array.from(monthMap.entries())
      .map(([month, { income, expense }]) => ({
        month,
        income,
        expense,
        net: income - expense,
      }))
      .slice(-6);
  };

  const getIncomeByCategory = () => {
    const incomes = data.transactions.filter((t) => t.type === "income");
    const categoryMap = new Map<string, number>();

    incomes.forEach((t) => {
      const cat = data.categories.find((c) => c.id === t.category_id);
      const name = cat?.name || "Lainnya";
      categoryMap.set(name, (categoryMap.get(name) || 0) + Number(t.amount));
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getAccountDistribution = () => {
    return data.accounts.map((account) => ({
      name: account.name,
      value: Number(account.current_balance),
    })).filter((a) => a.value > 0);
  };

  const getTotalIncome = () =>
    data.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const getTotalExpense = () =>
    data.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const getTopCategories = () => {
    const expenseByCategory = getExpenseByCategory();
    const total = expenseByCategory.reduce((sum, c) => sum + c.value, 0);

    return expenseByCategory.map((cat) => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.value / total) * 100) : 0,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const expenseByCategory = getExpenseByCategory();
  const cashFlowByMonth = getCashFlowByMonth();
  const incomeByCategory = getIncomeByCategory();
  const accountDistribution = getAccountDistribution();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const topCategories = getTopCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Analisis keuangan Anda</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1 rounded-md text-sm ${
              period === "month" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-3 py-1 rounded-md text-sm ${
              period === "year" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arus Kas Bersih</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arus Kas Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            {cashFlowByMonth.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#22c55e" />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Akun</CardTitle>
          </CardHeader>
          <CardContent>
            {accountDistribution.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accountDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accountDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Kategori Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-8">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(cat.value)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
