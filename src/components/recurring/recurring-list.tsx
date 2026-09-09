"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Repeat, Pause, Play, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recurringTransactionSchema, type RecurringTransactionInput } from "@/lib/validators";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { RecurringTransaction, Account, Category } from "@/types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const frequencyLabels: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
  custom: "Kustom",
};

export function RecurringList() {
  const router = useRouter();
  const { user } = useAuth();
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      description: "",
      frequency: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      reminder_days_before: 1,
    },
  });

  const watchType = watch("type");
  const watchFrequency = watch("frequency");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const supabase = createClient();

    const [recurringRes, accountsRes, categoriesRes] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_archived", false),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user?.id},user_id.is.null`),
    ]);

    if (recurringRes.data) setRecurring(recurringRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setIsLoading(false);
  };

  const onSubmit = async (data: RecurringTransactionInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingRecurring) {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          account_id: data.account_id,
          category_id: data.category_id || null,
          type: data.type,
          amount: data.amount,
          description: data.description,
          frequency: data.frequency,
          custom_frequency_days: data.custom_frequency_days || null,
          start_date: data.start_date,
          end_date: data.end_date || null,
          reminder_days_before: data.reminder_days_before,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRecurring.id);

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        setEditingRecurring(null);
        reset();
      }
    } else {
      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: user?.id,
        account_id: data.account_id,
        category_id: data.category_id || null,
        type: data.type,
        amount: data.amount,
        description: data.description,
        frequency: data.frequency,
        custom_frequency_days: data.custom_frequency_days || null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        reminder_days_before: data.reminder_days_before,
        next_due_date: data.start_date,
      });

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        reset();
      }
    }
    setIsSubmitting(false);
  };

  const handleEdit = (item: RecurringTransaction) => {
    setEditingRecurring(item);
    setValue("account_id", item.account_id);
    setValue("category_id", item.category_id || "");
    setValue("type", item.type as "income" | "expense");
    setValue("amount", Number(item.amount));
    setValue("description", item.description);
    setValue("frequency", item.frequency as RecurringTransactionInput["frequency"]);
    setValue("start_date", item.start_date);
    setValue("end_date", item.end_date || "");
    setValue("reminder_days_before", item.reminder_days_before);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);

    if (!error) {
      fetchData();
      setDeleteConfirmId(null);
    }
  };

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown";

  const getCategoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name || "-" : "-";

  const filteredCategories = categories.filter((c) => c.type === watchType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaksi Berulang</h1>
          <p className="text-muted-foreground">Kelola transaksi otomatis Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecurring(null);
            reset();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Berulang
        </Button>
      </div>

      {recurring.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Belum ada transaksi berulang. Buat yang pertama!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recurring.map((item) => (
            <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  {item.description}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Aktif" : "Jeda"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                  >
                    {item.is_active ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteConfirmId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <span className={`font-medium ${item.type === "income" ? "text-green-500" : "text-red-500"}`}>
                    {item.type === "income" ? "+" : "-"}{formatCurrency(Number(item.amount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Frekuensi</span>
                  <span className="text-sm">{frequencyLabels[item.frequency]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Akun</span>
                  <span className="text-sm">{getAccountName(item.account_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kategori</span>
                  <span className="text-sm">{getCategoryName(item.category_id)}</span>
                </div>
                {item.next_due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Berikutnya</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateShort(item.next_due_date)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRecurring ? "Edit Transaksi Berulang" : "Tambah Transaksi Berulang"}
            </DialogTitle>
            <DialogDescription>
              Buat transaksi yang otomatis terulang
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue("type", value as "income" | "expense")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                placeholder="Contoh: Netflix, Gaji"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Akun</Label>
              <Select
                value={watch("account_id")}
                onValueChange={(value) => { if (value) setValue("account_id", value); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_id && (
                <p className="text-sm text-red-500">{errors.account_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <Select
                value={watch("category_id") || ""}
                onValueChange={(value) => setValue("category_id", value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frekuensi</Label>
              <Select
                value={watchFrequency}
                onValueChange={(value) => setValue("frequency", value as RecurringTransactionInput["frequency"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Selesai (Opsional)</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingRecurring ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi Berulang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi berulang ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
