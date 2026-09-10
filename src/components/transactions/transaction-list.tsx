"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction, Account, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Trash2,
  Calendar,
  Building2,
  Tag,
  Filter,
} from "lucide-react";

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

export function TransactionList() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const supabase = createClient();

    const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user?.id},user_id.is.null`),
    ]);

    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setIsLoading(false);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesAccount = filterAccount === "all" || t.account_id === filterAccount;
    const matchesCategory = filterCategory === "all" || t.category_id === filterCategory;
    return matchesSearch && matchesType && matchesAccount && matchesCategory;
  });

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown";

  const getCategoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name || "-" : "-";

  const getCategoryIcon = (id: string | null) => {
    if (!id) return "📌";
    const cat = categories.find((c) => c.id === id);
    return categoryIcons[cat?.name || "Other"] || "📌";
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      router.refresh();
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "income":
        return "from-emerald-500 to-emerald-600";
      case "expense":
        return "from-red-500 to-red-600";
      case "transfer":
        return "from-blue-500 to-blue-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTransactionBg = (type: string) => {
    switch (type) {
      case "income":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "expense":
        return "bg-red-100 dark:bg-red-900/30";
      case "transfer":
        return "bg-blue-100 dark:bg-blue-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case "income":
        return "text-emerald-600 dark:text-emerald-400";
      case "expense":
        return "text-red-600 dark:text-red-400";
      case "transfer":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    },
    {} as Record<string, Transaction[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-gray-500 mt-1">
            {filteredTransactions.length} transaksi ditemukan
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Cari transaksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-12 text-base bg-white border-gray-200 rounded-xl"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: "all", label: "Semua" },
          { value: "income", label: "Pemasukan" },
          { value: "expense", label: "Pengeluaran" },
          { value: "transfer", label: "Transfer" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filterType === tab.value
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3">
        <Select value={filterAccount} onValueChange={(v) => setFilterAccount(v ?? "all")}>
          <SelectTrigger className="w-full md:w-[180px] h-11 bg-white border-gray-200 rounded-xl">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Akun</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-full md:w-[180px] h-11 bg-white border-gray-200 rounded-xl">
            <Tag className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Belum ada transaksi</p>
          <p className="text-sm text-gray-500 mt-1">
            Mulai catat transaksi pertama Anda
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs], groupIndex) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">
                  {formatDateShort(date)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Transactions for this date */}
              <div className="space-y-2">
                {txs.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getTransactionBg(
                          transaction.type
                        )}`}
                      >
                        {getCategoryIcon(transaction.category_id)}
                      </div>

                      {/* Transaction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">
                            {transaction.description}
                          </p>
                          {transaction.notes && (
                            <p className="text-xs text-gray-500 truncate hidden sm:block">
                              • {transaction.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {getCategoryIcon(transaction.category_id)}{" "}
                            {getCategoryName(transaction.category_id)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {getAccountName(transaction.account_id)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold font-mono ${getTransactionText(
                            transaction.type
                          )}`}
                        >
                          {transaction.type === "income"
                            ? "+"
                            : transaction.type === "expense"
                            ? "-"
                            : ""}
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {transaction.type === "income"
                            ? "Pemasukan"
                            : transaction.type === "expense"
                            ? "Pengeluaran"
                            : "Transfer"}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(transaction.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Transaksi</DialogTitle>
            <DialogDescription className="text-gray-500">
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="rounded-xl"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
