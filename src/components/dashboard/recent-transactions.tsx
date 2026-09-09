"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowRightLeft,
};

export function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentTransactions();
    }
  }, [user]);

  const fetchRecentTransactions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setTransactions(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaksi Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada transaksi
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const Icon = typeIcons[transaction.type] || ArrowUpRight;
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-100"
                          : transaction.type === "expense"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : transaction.type === "expense"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      transaction.type === "income"
                        ? "text-green-600"
                        : transaction.type === "expense"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                    {formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
