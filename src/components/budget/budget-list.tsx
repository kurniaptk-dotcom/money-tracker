"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { budgetSchema, type BudgetInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Budget, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface BudgetWithCategory extends Budget {
  category_name?: string;
  spent?: number;
}

export function BudgetList() {
  const router = useRouter();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: 0,
      period: "monthly",
      rollover_enabled: false,
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchPeriod = watch("period");
  const watchRollover = watch("rollover_enabled");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const supabase = createClient();

    const [budgetsRes, categoriesRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user?.id},user_id.is.null`),
    ]);

    if (budgetsRes.data && categoriesRes.data) {
      const categoryMap = new Map(categoriesRes.data.map((c) => [c.id, c]));

      // Get current month spending for each budget
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const budgetsWithSpending = await Promise.all(
        budgetsRes.data.map(async (budget) => {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", user?.id)
            .eq("category_id", budget.category_id)
            .eq("type", "expense")
            .gte("date", firstDay)
            .lte("date", lastDay);

          const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const category = categoryMap.get(budget.category_id);

          return {
            ...budget,
            category_name: category?.name || "Unknown",
            spent,
          };
        })
      );

      setBudgets(budgetsWithSpending);
      setCategories(categoriesRes.data);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: BudgetInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingBudget) {
      const { error } = await supabase
        .from("budgets")
        .update({
          category_id: data.category_id,
          amount: data.amount,
          period: data.period,
          rollover_enabled: data.rollover_enabled,
          start_date: data.start_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBudget.id);

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        setEditingBudget(null);
        reset();
      }
    } else {
      const { error } = await supabase.from("budgets").insert({
        user_id: user?.id,
        category_id: data.category_id,
        amount: data.amount,
        period: data.period,
        rollover_enabled: data.rollover_enabled,
        start_date: data.start_date,
      });

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        reset();
      }
    }
    setIsSubmitting(false);
  };

  const handleEdit = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setValue("category_id", budget.category_id);
    setValue("amount", Number(budget.amount));
    setValue("period", budget.period as "monthly" | "yearly");
    setValue("rollover_enabled", budget.rollover_enabled);
    setValue("start_date", budget.start_date);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (!error) {
      fetchData();
      setDeleteConfirmId(null);
    }
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { color: "text-red-500", bg: "bg-red-100", label: "Over Budget" };
    if (percentage >= 80) return { color: "text-yellow-500", bg: "bg-yellow-100", label: "Hampir Habis" };
    return { color: "text-green-500", bg: "bg-green-100", label: "On Track" };
  };

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
            <div key={i} className="bg-white rounded-2xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Anggaran</h1>
          <p className="text-gray-500 mt-1">Kelola anggaran pengeluaran Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            reset();
            setIsDialogOpen(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggaran
        </Button>
      </div>

      {/* Total Anggaran Card */}
      <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />
        
        <div className="relative z-10 flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="white"
                strokeWidth="10"
                strokeDasharray={`${totalPercentage * 2.51} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{Math.round(totalPercentage)}%</span>
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">Total Anggaran Bulanan</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-1">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {totalBudget - totalSpent >= 0
                ? `Sisa ${formatCurrency(totalBudget - totalSpent)}`
                : `Over ${formatCurrency(Math.abs(totalBudget - totalSpent))}`}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Belum ada anggaran</p>
          <p className="text-sm text-gray-500 mt-1">Buat anggaran pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const percentage = Math.min(((budget.spent || 0) / Number(budget.amount)) * 100, 100);
            const status = getBudgetStatus(budget.spent || 0, Number(budget.amount));
            const remaining = Number(budget.amount) - (budget.spent || 0);

            return (
              <div
                key={budget.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{budget.category_name}</p>
                      <p className="text-sm text-gray-500">
                        {budget.period === "monthly" ? "Bulanan" : "Tahunan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(budget.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        percentage >= 100
                          ? "bg-red-500"
                          : percentage >= 80
                          ? "bg-yellow-500"
                          : "bg-gradient-to-r from-teal-500 to-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(budget.spent || 0)} / {formatCurrency(Number(budget.amount))}
                  </span>
                  <span className={`text-sm font-semibold ${status.color}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                  {budget.rollover_enabled && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      Rollover
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingBudget ? "Edit Anggaran" : "Tambah Anggaran Baru"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Tetapkan batas pengeluaran untuk setiap kategori
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Kategori</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(value) => { if (value) setValue("category_id", value); }}
              >
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jumlah Anggaran</Label>
              <Input
                type="number"
                placeholder="0"
                {...register("amount", { valueAsNumber: true })}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Periode</Label>
              <Select
                value={watchPeriod}
                onValueChange={(value) => setValue("period", value as "monthly" | "yearly")}
              >
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">Rollover</Label>
                <p className="text-xs text-gray-500">
                  Sisa anggaran ditambahkan ke periode berikutnya
                </p>
              </div>
              <Switch
                checked={watchRollover}
                onCheckedChange={(checked) => setValue("rollover_enabled", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
              <Input
                type="date"
                {...register("start_date")}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
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
                {editingBudget ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Anggaran</DialogTitle>
            <DialogDescription className="text-gray-500">
              Apakah Anda yakin ingin menghapus anggaran ini?
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
