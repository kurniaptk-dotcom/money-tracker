"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { budgetSchema, type BudgetInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Budget, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anggaran</h1>
          <p className="text-muted-foreground">Kelola anggaran pengeluaran Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            reset();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggaran
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Belum ada anggaran. Buat anggaran pertama Anda!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = Math.min((budget.spent || 0) / Number(budget.amount) * 100, 100);
            const status = getBudgetStatus(budget.spent || 0, Number(budget.amount));
            const remaining = Number(budget.amount) - (budget.spent || 0);

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {budget.category_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={status.bg + " " + status.color}>
                      {status.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(budget)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteConfirmId(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className="font-medium">
                      {formatCurrency(budget.spent || 0)} / {formatCurrency(Number(budget.amount))}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                    <span className={remaining >= 0 ? "text-green-500" : "text-red-500"}>
                      {remaining >= 0 ? `Sisa ${formatCurrency(remaining)}` : `Over ${formatCurrency(Math.abs(remaining))}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{budget.period === "monthly" ? "Bulanan" : "Tahunan"}</span>
                    {budget.rollover_enabled && (
                      <Badge variant="outline" className="text-xs">Rollover</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Anggaran" : "Tambah Anggaran Baru"}
            </DialogTitle>
            <DialogDescription>
              Tetapkan batas pengeluaran untuk setiap kategori
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(value) => { if (value) setValue("category_id", value); }}
              >
                <SelectTrigger>
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
              <Label htmlFor="amount">Jumlah Anggaran</Label>
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
              <Label htmlFor="period">Periode</Label>
              <Select
                value={watchPeriod}
                onValueChange={(value) => setValue("period", value as "monthly" | "yearly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rollover">Rollover</Label>
                <p className="text-xs text-muted-foreground">
                  Sisa anggaran ditambahkan ke periode berikutnya
                </p>
              </div>
              <Switch
                id="rollover"
                checked={watchRollover}
                onCheckedChange={(checked) => setValue("rollover_enabled", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
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
                {editingBudget ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Anggaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggaran ini?
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
