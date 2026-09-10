"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, Building2, Wallet, Smartphone, CreditCard, TrendingUp, PiggyBank, MoreHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountSchema, type AccountInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const accountTypeColors: Record<string, string> = {
  bank: "from-blue-500 to-indigo-500",
  cash: "from-green-500 to-emerald-500",
  "e-wallet": "from-purple-500 to-pink-500",
  "credit-card": "from-orange-500 to-red-500",
  investment: "from-teal-500 to-cyan-500",
  savings: "from-yellow-500 to-orange-500",
  custom: "from-gray-500 to-gray-600",
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 h-40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Akun</h1>
          <p className="text-gray-500 mt-1">Kelola akun dan wallet Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingAccount(null);
            reset();
            setIsDialogOpen(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Akun
        </Button>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium mb-2">Total Saldo</p>
          <p className="text-3xl md:text-4xl font-bold font-mono">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-white/60 text-sm mt-2">
            Dari {accounts.filter((a) => !a.is_archived).length} akun aktif
          </p>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const Icon = accountTypeIcons[account.type] || MoreHorizontal;
          const colorClass = accountTypeColors[account.type] || accountTypeColors.custom;
          
          return (
            <div
              key={account.id}
              className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all ${
                account.is_archived ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-500">
                      {accountTypeLabels[account.type]}
                      {account.is_archived && " (Diarsipkan)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(account.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {formatCurrency(Number(account.current_balance))}
              </div>
              
              {account.notes && (
                <p className="text-sm text-gray-500 mt-2 truncate">{account.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingAccount
                ? "Ubah detail akun Anda"
                : "Tambahkan akun baru untuk mulai melacak keuangan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nama Akun</Label>
              <Input
                placeholder="Contoh: BCA, GoPay"
                {...register("name")}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tipe Akun</Label>
              <Select
                value={watchType}
                onValueChange={(value) => setValue("type", value as AccountInput["type"])}
              >
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
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
                <Label className="text-sm font-medium text-gray-700">Saldo Awal</Label>
                <Input
                  type="number"
                  {...register("initial_balance", { valueAsNumber: true })}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                />
                {errors.initial_balance && (
                  <p className="text-sm text-red-500">
                    {errors.initial_balance.message}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Catatan (Opsional)</Label>
              <Textarea
                {...register("notes")}
                className="bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingAccount ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Akun</DialogTitle>
            <DialogDescription className="text-gray-500">
              Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-xl">
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
