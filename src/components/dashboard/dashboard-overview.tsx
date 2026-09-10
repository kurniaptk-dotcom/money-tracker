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
  Eye,
  EyeOff,
  Target,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  previousMonthIncome: number;
  previousMonthExpense: number;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  category_name: string;
  account_name: string;
  category_icon: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

const categoryIcons: Record<string, string> = {
  Food: "🍔",
  Transportation: "🚗",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Health: "💊",
  Education: "📚",
  Housing: "🏠",
  Personal: "👤",
  Travel: "✈️",
  Salary: "💰",
  Freelance: "💻",
  Business: "🏢",
  Bonus: "🎁",
  Investment: "📈",
  Other: "📌",
};

export function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    previousMonthIncome: 0,
    previousMonthExpense: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    const now = new Date();

    // Get total balance from accounts
    const { data: accounts } = await supabase
      .from("accounts")
      .select("current_balance")
      .eq("user_id", user?.id)
      .eq("is_archived", false);

    const totalBalance =
      accounts?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;

    // Get current month transactions
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data: currentTransactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user?.id)
      .gte("date", firstDayOfMonth)
      .lte("date", lastDayOfMonth);

    let totalIncome = 0;
    let totalExpense = 0;

    currentTransactions?.forEach((t) => {
      if (t.type === "income") totalIncome += Number(t.amount);
      else if (t.type === "expense") totalExpense += Number(t.amount);
    });

    // Get previous month for comparison
    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];

    const { data: prevTransactions } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user?.id)
      .gte("date", firstDayOfPrevMonth)
      .lte("date", lastDayOfPrevMonth);

    let previousMonthIncome = 0;
    let previousMonthExpense = 0;

    prevTransactions?.forEach((t) => {
      if (t.type === "income") previousMonthIncome += Number(t.amount);
      else if (t.type === "expense") previousMonthExpense += Number(t.amount);
    });

    // Get recent transactions
    const { data: recentTx } = await supabase
      .from("transactions")
      .select("*, categories(name), accounts(name)")
      .eq("user_id", user?.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    const enrichedRecent = (recentTx || []).map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      date: t.date,
      category_name: t.categories?.name || "Lainnya",
      account_name: t.accounts?.name || "-",
      category_icon: categoryIcons[t.categories?.name || "Other"] || "📌",
    }));

    // Get goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_completed", false)
      .order("deadline", { ascending: true })
      .limit(3);

    setData({
      totalBalance,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      previousMonthIncome,
      previousMonthExpense,
    });
    setRecentTransactions(enrichedRecent);
    setGoals(goalsData || []);
    setIsLoading(false);
  };

  const calculateIncomeChange = () => {
    if (data.previousMonthIncome === 0) return 0;
    return Math.round(((data.totalIncome - data.previousMonthIncome) / data.previousMonthIncome) * 100);
  };

  const calculateExpenseChange = () => {
    if (data.previousMonthExpense === 0) return 0;
    return Math.round(((data.totalExpense - data.previousMonthExpense) / data.previousMonthExpense) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 h-40 animate-pulse" />
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 h-80 animate-pulse" />
          <div className="bg-white rounded-2xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  const incomeChange = calculateIncomeChange();
  const expenseChange = calculateExpenseChange();

  return (
    <div className="space-y-6">
      {/* Hero Balance Card */}
      <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="text-white/90 text-sm font-medium">Total Saldo</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {showBalance ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="text-3xl md:text-4xl font-bold mb-3 font-mono">
            {showBalance ? formatCurrency(data.totalBalance) : "••••••••"}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">
              ↑ 12% dari bulan lalu
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Pemasukan</span>
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(data.totalIncome)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-500 font-medium">
              {incomeChange > 0 ? `↑ ${incomeChange}%` : "↑ 0%"}
            </span>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Pengeluaran</span>
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(data.totalExpense)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-500 font-medium">
              {expenseChange > 0 ? `↑ ${expenseChange}%` : "↑ 0%"}
            </span>
          </div>
        </div>

        {/* Netto */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Netto</span>
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">
            {formatCurrency(data.netCashFlow)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {data.netCashFlow >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-500 font-medium">↑ 16%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-500 font-medium">↓ 0%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arus Kas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Arus Kas</h3>
              <p className="text-sm text-gray-500">6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-xs text-gray-500">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500">Pengeluaran</span>
              </div>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 px-4">
            {["Apr", "Mei", "Jun", "Jul", "Agu", "Sep"].map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end justify-center h-40">
                  <div
                    className="w-4 bg-teal-500 rounded-t"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                  <div
                    className="w-4 bg-red-400 rounded-t"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pengeluaran per Kategori */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pengeluaran per Kategori</h3>
              <p className="text-sm text-gray-500">Bulan ini</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fee2e2" strokeWidth="20" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20"
                  strokeDasharray="75 251.2" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="20"
                  strokeDasharray="40 251.2" strokeDashoffset="-75" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="20"
                  strokeDasharray="35 251.2" strokeDashoffset="-115" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#84cc16" strokeWidth="20"
                  strokeDasharray="30 251.2" strokeDashoffset="-150" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="20"
                  strokeDasharray="25 251.2" strokeDashoffset="-180" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">Rp 4.250.000</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {[
                { name: "Makanan", percent: "28%", color: "#ef4444" },
                { name: "Transportasi", percent: "16%", color: "#f97316" },
                { name: "Belanja", percent: "14%", color: "#eab308" },
                { name: "Tagihan", percent: "12%", color: "#84cc16" },
                { name: "Hiburan", percent: "10%", color: "#22c55e" },
                { name: "Lainnya", percent: "20%", color: "#94a3b8" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h3>
            <Link
              href="/transactions"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Lihat semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                    {tx.category_icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{tx.category_name}</span>
                      <span>•</span>
                      <span>{tx.account_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold font-mono ${
                        tx.type === "income" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(tx.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Target Keuangan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Target Keuangan</h3>
            <Link
              href="/goals"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              Lihat semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada target</p>
            ) : (
              goals.map((goal) => {
                const progress = Math.min(
                  Math.round((goal.current_amount / goal.target_amount) * 100),
                  100
                );
                const daysLeft = goal.deadline
                  ? Math.ceil(
                      (new Date(goal.deadline).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Target className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{goal.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-teal-600">{progress}%</span>
                    </div>
                    
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    {daysLeft !== null && (
                      <p className="text-xs text-gray-500 mt-2">
                        {daysLeft > 0 ? `${daysLeft} hari lagi` : "Terlambat"}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
