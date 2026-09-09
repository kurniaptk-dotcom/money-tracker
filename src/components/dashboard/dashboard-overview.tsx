"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PiggyBank,
  CreditCard,
  Activity,
} from "lucide-react";

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const supabase = createClient();

    const { data: accounts } = await supabase
      .from("accounts")
      .select("current_balance")
      .eq("user_id", user?.id)
      .eq("is_archived", false);

    const totalBalance =
      accounts?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user?.id)
      .gte("date", firstDayOfMonth)
      .lte("date", lastDayOfMonth);

    let totalIncome = 0;
    let totalExpense = 0;

    transactions?.forEach((t) => {
      if (t.type === "income") {
        totalIncome += Number(t.amount);
      } else if (t.type === "expense") {
        totalExpense += Number(t.amount);
      }
    });

    setData({
      totalBalance,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero Balance Skeleton */}
        <div className="card-gradient p-6 md:p-8 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-32 mb-4" />
          <div className="h-10 bg-white/20 rounded w-48 mb-2" />
          <div className="h-3 bg-white/20 rounded w-24" />
        </div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-modern p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-3" />
              <div className="h-7 bg-muted rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const savingsRate =
    data.totalIncome > 0
      ? Math.round(((data.totalIncome - data.totalExpense) / data.totalIncome) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Balance Card */}
      <div className="card-gradient p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-white/80" />
          <span className="text-white/80 text-sm font-medium">Total Saldo</span>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-white mb-2 font-mono tracking-tight">
          {formatCurrency(data.totalBalance)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Arus kas bulan ini:</span>
          <span
            className={`text-sm font-semibold ${
              data.netCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {data.netCashFlow >= 0 ? "+" : ""}
            {formatCurrency(data.netCashFlow)}
          </span>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-4 right-12 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <div className="card-modern p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Pemasukan</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(data.totalIncome)}
          </div>
        </div>

        {/* Expense */}
        <div className="card-modern p-5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Pengeluaran</span>
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {formatCurrency(data.totalExpense)}
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="card-modern p-5 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Bersih</span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                data.netCashFlow >= 0
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-orange-100 dark:bg-orange-900/30"
              }`}
            >
              {data.netCashFlow >= 0 ? (
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
          <div
            className={`text-xl md:text-2xl font-bold font-mono ${
              data.netCashFlow >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {data.netCashFlow >= 0 ? "+" : ""}
            {formatCurrency(data.netCashFlow)}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="card-modern p-5 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">Tingkat Tabungan</span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                savingsRate >= 20
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : savingsRate >= 10
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <PiggyBank
                className={`h-5 w-5 ${
                  savingsRate >= 20
                    ? "text-emerald-600 dark:text-emerald-400"
                    : savingsRate >= 10
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            </div>
          </div>
          <div
            className={`text-xl md:text-2xl font-bold font-mono ${
              savingsRate >= 20
                ? "text-emerald-600 dark:text-emerald-400"
                : savingsRate >= 10
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {savingsRate}%
          </div>
        </div>
      </div>
    </div>
  );
}
