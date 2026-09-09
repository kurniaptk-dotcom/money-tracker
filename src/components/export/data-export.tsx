"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, FileText, Table } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function DataExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year" | "all">("all");
  const [exportType, setExportType] = useState<"csv" | "json">("csv");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "month":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0],
          end: now.toISOString().split("T")[0],
        };
      case "quarter":
        const quarterStart = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1
        );
        return {
          start: quarterStart.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0],
        };
      case "year":
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
          end: now.toISOString().split("T")[0],
        };
      default:
        return { start: "2020-01-01", end: now.toISOString().split("T")[0] };
    }
  };

  const exportTransactions = async () => {
    setIsExporting(true);
    const supabase = createClient();
    const { start, end } = getDateRange();

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*, categories(name), accounts(name)")
      .eq("user_id", user?.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      return;
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user?.id},user_id.is.null`);

    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user?.id);

    const enriched = (transactions || []).map((t) => ({
      date: t.date,
      description: t.description,
      type: t.type,
      amount: Number(t.amount),
      category: categories?.find((c) => c.id === t.category_id)?.name || "",
      account: accounts?.find((a) => a.id === t.account_id)?.name || "",
      notes: t.notes || "",
    }));

    if (exportType === "csv") {
      const headers = ["Date", "Description", "Type", "Amount", "Category", "Account", "Notes"];
      const rows = enriched.map((t) =>
        [
          t.date,
          `"${t.description.replace(/"/g, '""')}"`,
          t.type,
          t.amount,
          `"${t.category}"`,
          `"${t.account}"`,
          `"${t.notes.replace(/"/g, '""')}"`,
        ].join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      downloadFile(csv, `transactions-${start}-to-${end}.csv`, "text/csv");
    } else {
      const json = JSON.stringify(enriched, null, 2);
      downloadFile(json, `transactions-${start}-to-${end}.json`, "application/json");
    }

    setIsExporting(false);
  };

  const exportAccounts = async () => {
    setIsExporting(true);
    const supabase = createClient();

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user?.id)
      .order("name");

    if (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      return;
    }

    if (exportType === "csv") {
      const headers = ["Name", "Type", "Initial Balance", "Current Balance", "Currency", "Notes"];
      const rows = (accounts || []).map((a) =>
        [
          `"${a.name}"`,
          a.type,
          Number(a.initial_balance),
          Number(a.current_balance),
          a.currency,
          `"${(a.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      downloadFile(csv, "accounts.csv", "text/csv");
    } else {
      const json = JSON.stringify(accounts, null, 2);
      downloadFile(json, "accounts.json", "application/json");
    }

    setIsExporting(false);
  };

  const exportBudgets = async () => {
    setIsExporting(true);
    const supabase = createClient();

    const { data: budgets, error } = await supabase
      .from("budgets")
      .select("*, categories(name)")
      .eq("user_id", user?.id);

    if (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      return;
    }

    if (exportType === "csv") {
      const headers = ["Category", "Amount", "Period", "Start Date", "End Date", "Rollover"];
      const rows = (budgets || []).map((b) =>
        [
          `"${b.categories?.name || ""}"`,
          Number(b.amount),
          b.period,
          b.start_date,
          b.end_date || "",
          b.rollover_enabled,
        ].join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      downloadFile(csv, "budgets.csv", "text/csv");
    } else {
      const json = JSON.stringify(budgets, null, 2);
      downloadFile(json, "budgets.json", "application/json");
    }

    setIsExporting(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Data</h1>
        <p className="text-muted-foreground">Export data keuangan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Rentang Waktu</Label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="quarter">Kuartal Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
              <SelectItem value="all">Semua</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={exportType} onValueChange={(v) => setExportType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={exportTransactions}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Transaksi
            </CardTitle>
            <CardDescription>Export semua transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={exportAccounts}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Akun
            </CardTitle>
            <CardDescription>Export data akun</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={exportBudgets}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Budget
            </CardTitle>
            <CardDescription>Export data budget</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
