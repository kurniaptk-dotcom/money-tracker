"use client";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { AccountSummary } from "@/components/dashboard/account-summary";
import { CashFlowChart, ExpenseByCategoryChart } from "@/components/dashboard/charts";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan keuangan Anda</p>
      </div>
      <DashboardOverview />
      <div className="grid gap-6 md:grid-cols-2">
        <CashFlowChart />
        <ExpenseByCategoryChart />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AccountSummary />
        <RecentTransactions />
        <Card>
          <CardHeader>
            <CardTitle>Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada anggaran
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
