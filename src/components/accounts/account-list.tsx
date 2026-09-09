"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, Building2, Wallet, Smartphone, CreditCard, TrendingUp, PiggyBank, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountSchema, type AccountInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/hooks/use-auth";

const accountTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bank: Building2,
  cash: Wallet,
  "e-wallet": Smartphone,
  "credit-card": CreditCard,
  investment: TrendingUp,
  savings: PiggyBank,
  custom: MoreHorizontal,
};

const accountTypeLabels: Record<string, string> = {
  bank: "Bank",
  cash: "Tunai",
  "e-wallet": "E-Wallet",
  "credit-card": "Kartu Kredit",
  investment: "Investasi",
  savings: "Tabungan",
  custom: "Lainnya",
};

export function AccountList() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "bank",
      initial_balance: 0,
      currency: "IDR",
      notes: "",
    },
  });

  const watchType = watch("type");

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
      .order("created_at", { ascending: true });

    if (!error && data) {
      setAccounts(data);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: AccountInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingAccount) {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: data.name,
          type: data.type,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingAccount.id);

      if (!error) {
        fetchAccounts();
        setIsDialogOpen(false);
        setEditingAccount(null);
        reset();
      }
    } else {
      const { error } = await supabase.from("accounts").insert({
        user_id: user?.id,
        name: data.name,
        type: data.type,
        initial_balance: data.initial_balance,
        current_balance: data.initial_balance,
        currency: data.currency,
        notes: data.notes,
      });

      if (!error) {
        fetchAccounts();
        setIsDialogOpen(false);
        reset();
      }
    }
    setIsSubmitting(false);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setValue("name", account.name);
    setValue("type", account.type as AccountInput["type"]);
    setValue("notes", account.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (!error) {
      fetchAccounts();
      setDeleteConfirmId(null);
    }
  };

  const handleArchive = async (id: string, is_archived: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("accounts")
      .update({ is_archived: !is_archived, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      fetchAccounts();
    }
  };

  const totalBalance = accounts
    .filter((a) => !a.is_archived)
    .reduce((sum, a) => sum + Number(a.current_balance), 0);

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
          <h1 className="text-2xl font-bold">Akun</h1>
          <p className="text-muted-foreground">Kelola akun dan wallet Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingAccount(null);
            reset();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Akun
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const Icon = accountTypeIcons[account.type] || MoreHorizontal;
          return (
            <Card key={account.id} className={account.is_archived ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteConfirmId(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(account.current_balance))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {accountTypeLabels[account.type]}
                  {account.is_archived && " (Diarsipkan)"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Ubah detail akun Anda"
                : "Tambahkan akun baru untuk mulai melacak keuangan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Akun</Label>
              <Input id="name" placeholder="Contoh: BCA, GoPay" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Akun</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue("type", value as AccountInput["type"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="e-wallet">E-Wallet</SelectItem>
                  <SelectItem value="credit-card">Kartu Kredit</SelectItem>
                  <SelectItem value="investment">Investasi</SelectItem>
                  <SelectItem value="savings">Tabungan</SelectItem>
                  <SelectItem value="custom">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingAccount && (
              <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Awal</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  {...register("initial_balance", { valueAsNumber: true })}
                />
                {errors.initial_balance && (
                  <p className="text-sm text-red-500">
                    {errors.initial_balance.message}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea id="notes" {...register("notes")} />
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
                {editingAccount ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Akun</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat
              dibatalkan.
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
