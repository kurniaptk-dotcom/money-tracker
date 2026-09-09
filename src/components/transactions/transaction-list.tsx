"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Transaction, Account, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Search,
  Filter,
  Trash2,
  Loader2,
} from "lucide-react";

const typeColors: Record<string, string> = {
  income: "bg-green-100 text-green-700",
  expense: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowRightLeft,
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

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground">
            {filteredTransactions.length} transaksi ditemukan
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={(v) => setFilterAccount(v ?? "all")}>
              <SelectTrigger className="w-full md:w-[150px]">
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
              <SelectTrigger className="w-full md:w-[150px]">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada transaksi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const Icon = typeIcons[transaction.type] || ArrowUpRight;
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {formatDateShort(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1 rounded-full ${
                              transaction.type === "income"
                                ? "bg-green-100"
                                : transaction.type === "expense"
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <Icon
                              className={`h-3 w-3 ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : transaction.type === "expense"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryName(transaction.category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getAccountName(transaction.account_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
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
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteConfirmId(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {deleteConfirmId && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">
                Hapus transaksi ini? Tindakan tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
