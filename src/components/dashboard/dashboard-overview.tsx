"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

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

    // Get total balance from accounts
    const { data: accounts } = await supabase
      .from("accounts")
      .select("current_balance")
      .eq("user_id", user?.id)
      .eq("is_archived", false);

    const totalBalance =
      accounts?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;

    // Get current month transactions
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-muted animate-pulse rounded w-20 mb-2" />
              <div className="h-8 bg-muted animate-pulse rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalBalance)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(data.totalIncome)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(data.totalExpense)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arus Kas Bersih</CardTitle>
          {data.netCashFlow >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              data.netCashFlow >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatCurrency(data.netCashFlow)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
