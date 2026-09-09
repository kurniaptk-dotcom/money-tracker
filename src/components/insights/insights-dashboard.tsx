"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Lightbulb,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Insight {
  id: string;
  type: "info" | "warning" | "success" | "tip";
  title: string;
  description: string;
  icon: any;
}

export function InsightsDashboard() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateInsights();
    }
  }, [user]);

  const generateInsights = async () => {
    const supabase = createClient();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const startOfLastMonth = new Date(lastMonthYear, lastMonth, 1).toISOString().split("T")[0];
    const endOfLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];

    const [currentMonthRes, lastMonthRes, budgetsRes, goalsRes, debtsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", startOfCurrentMonth)
        .lte("date", now.toISOString().split("T")[0]),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", startOfLastMonth)
        .lte("date", endOfLastMonth),
      supabase
        .from("budgets")
        .select("*, categories(name)")
        .eq("user_id", user?.id)
        .eq("is_active", true),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_achieved", false),
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_paid_off", false),
    ]);

    const currentTransactions = currentMonthRes.data || [];
    const lastTransactions = lastMonthRes.data || [];
    const budgets = budgetsRes.data || [];
    const goals = goalsRes.data || [];
    const debts = debtsRes.data || [];

    const generatedInsights: Insight[] = [];

    const currentExpense = currentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastExpense = lastTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentIncome = currentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (lastExpense > 0) {
      const change = ((currentExpense - lastExpense) / lastExpense) * 100;
      if (change > 20) {
        generatedInsights.push({
          id: "expense-increase",
          type: "warning",
          title: `Pengeluaran naik ${Math.round(change)}%`,
          description: `Pengeluaran bulan ini naik ${Math.round(change)}% dibanding bulan lalu. Pertimbangkan untuk mengurangi pengeluaran yang tidak perlu.`,
          icon: TrendingUp,
        });
      } else if (change < -20) {
        generatedInsights.push({
          id: "expense-decrease",
          type: "success",
          title: `Pengeluaran turun ${Math.round(Math.abs(change))}%`,
          description: `Pengeluaran bulan ini turun ${Math.round(Math.abs(change))}% dibanding bulan lalu. Pertahankan pola ini!`,
          icon: TrendingDown,
        });
      }
    }

    budgets.forEach((budget) => {
      const spent = currentTransactions
        .filter((t) => t.type === "expense" && t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = (spent / Number(budget.amount)) * 100;

      if (percentage >= 100) {
        generatedInsights.push({
          id: `budget-exceeded-${budget.category_id}`,
          type: "warning",
          title: `Budget ${budget.categories?.name || "Kategori"} terlampaui`,
          description: `Anda sudah menggunakan ${Math.round(percentage)}% budget ${budget.categories?.name || "kategori"} bulan ini.`,
          icon: AlertTriangle,
        });
      } else if (percentage >= 80) {
        generatedInsights.push({
          id: `budget-warning-${budget.category_id}`,
          type: "warning",
          title: `Budget ${budget.categories?.name || "Kategori"} hampir habis`,
          description: `Anda sudah menggunakan ${Math.round(percentage)}% budget ${budget.categories?.name || "kategori"} bulan ini.`,
          icon: AlertTriangle,
        });
      }
    });

    goals.forEach((goal) => {
      const remaining = Number(goal.target_amount) - Number(goal.current_amount);
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const monthsLeft = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
        if (monthsLeft > 0) {
          const monthlyNeeded = remaining / monthsLeft;
          generatedInsights.push({
            id: `goal-${goal.id}`,
            type: "info",
            title: `Target: ${goal.name}`,
            description: `Untuk mencapai ${formatCurrency(Number(goal.target_amount))} sebelum ${deadline.toLocaleDateString("id-ID")}, Anda perlu menabung ${formatCurrency(monthlyNeeded)} per bulan.`,
            icon: Target,
          });
        }
      }
    });

    debts.forEach((debt) => {
      if (debt.due_date) {
        const dueDate = new Date(debt.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          generatedInsights.push({
            id: `debt-due-${debt.id}`,
            type: "warning",
            title: `Cicilan "${debt.name}" jatuh tempo`,
            description: `Cicilan ${formatCurrency(Number(debt.outstanding_amount))} jatuh tempo dalam ${daysUntilDue} hari.`,
            icon: AlertTriangle,
          });
        }
      }
    });

    if (currentIncome > 0) {
      const savingsRate = ((currentIncome - currentExpense) / currentIncome) * 100;
      if (savingsRate >= 20) {
        generatedInsights.push({
          id: "savings-good",
          type: "success",
          title: "Tingkat tabungan sehat",
          description: `Tingkat tabungan Anda ${Math.round(savingsRate)}% bulan ini. Pertahankan!`,
          icon: TrendingUp,
        });
      } else if (savingsRate < 10) {
        generatedInsights.push({
          id: "savings-low",
          type: "warning",
          title: "Tingkat tabungan rendah",
          description: `Tingkat tabungan Anda ${Math.round(savingsRate)}% bulan ini. Cobalah untuk menabung minimal 20% dari pendapatan.`,
          icon: AlertTriangle,
        });
      }
    }

    const categoryExpense = new Map<string, number>();
    currentTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryExpense.set(t.category_id, (categoryExpense.get(t.category_id) || 0) + Number(t.amount));
      });

    const topCategory = Array.from(categoryExpense.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (topCategory) {
      const category = currentTransactions.find((t) => t.category_id === topCategory[0]);
      const percentage = currentExpense > 0 ? Math.round((topCategory[1] / currentExpense) * 100) : 0;
      generatedInsights.push({
        id: "top-spending",
        type: "tip",
        title: `Pengeluaran terbesar: ${percentage}%`,
        description: `Pengeluaran terbesar Anda adalah ${percentage}% dari total pengeluaran bulan ini.`,
        icon: Lightbulb,
      });
    }

    if (generatedInsights.length === 0) {
      generatedInsights.push({
        id: "no-insights",
        type: "info",
        title: "Belum ada insight",
        description: "Mulai catat transaksi untuk mendapatkan insight keuangan.",
        icon: Lightbulb,
      });
    }

    setInsights(generatedInsights);
    setIsLoading(false);
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "destructive";
      case "success":
        return "default";
      case "tip":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insight Keuangan</h1>
        <p className="text-muted-foreground">Analisis otomatis dari transaksi Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <Card key={insight.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {insight.title}
                </CardTitle>
                <Badge variant={getBadgeVariant(insight.type)}>
                  {insight.type === "warning" ? "Peringatan" :
                   insight.type === "success" ? "Bagus" :
                   insight.type === "tip" ? "Tips" : "Info"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
