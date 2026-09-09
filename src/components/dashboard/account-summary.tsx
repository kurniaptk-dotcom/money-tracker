"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Wallet, Smartphone, CreditCard, TrendingUp, PiggyBank, MoreHorizontal } from "lucide-react";
import type { Account } from "@/types";

const accountTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bank: Building2,
  cash: Wallet,
  "e-wallet": Smartphone,
  "credit-card": CreditCard,
  investment: TrendingUp,
  savings: PiggyBank,
  custom: MoreHorizontal,
};

export function AccountSummary() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setAccounts(data);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada akun. Buat akun pertama Anda!
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => {
              const Icon = accountTypeIcons[account.type] || MoreHorizontal;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.type.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(Number(account.current_balance))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
