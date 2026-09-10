"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Target, CheckCircle2, Calendar, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { goalSchema, goalContributionSchema, type GoalInput, type GoalContributionInput } from "@/lib/validators";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { Goal, Account } from "@/types";
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

export function GoalList() {
  const router = useRouter();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target_amount: 0,
      current_amount: 0,
      notes: "",
    },
  });

  const {
    register: registerContribute,
    handleSubmit: handleSubmitContribute,
    reset: resetContribute,
    formState: { errors: errorsContribute },
  } = useForm<GoalContributionInput>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const supabase = createClient();

    const [goalsRes, accountsRes] = await Promise.all([
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_archived", false),
    ]);

    if (goalsRes.data) setGoals(goalsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    setIsLoading(false);
  };

  const onSubmit = async (data: GoalInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    if (editingGoal) {
      const { error } = await supabase
        .from("goals")
        .update({
          name: data.name,
          target_amount: data.target_amount,
          current_amount: data.current_amount,
          deadline: data.deadline || null,
          linked_account_id: data.linked_account_id || null,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGoal.id);

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        setEditingGoal(null);
        reset();
      }
    } else {
      const { error } = await supabase.from("goals").insert({
        user_id: user?.id,
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount,
        deadline: data.deadline || null,
        linked_account_id: data.linked_account_id || null,
        notes: data.notes,
      });

      if (!error) {
        fetchData();
        setIsDialogOpen(false);
        reset();
      }
    }
    setIsSubmitting(false);
  };

  const onContribute = async (data: GoalContributionInput) => {
    if (!contributingGoal) return;
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.rpc("contribute_to_goal", {
      p_goal_id: contributingGoal.id,
      p_user_id: user?.id,
      p_amount: data.amount,
      p_account_id: data.account_id || null,
      p_notes: data.notes || null,
    });

    if (!error) {
      fetchData();
      setIsContributeOpen(false);
      setContributingGoal(null);
      resetContribute();
    }
    setIsSubmitting(false);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setValue("name", goal.name);
    setValue("target_amount", Number(goal.target_amount));
    setValue("current_amount", Number(goal.current_amount));
    setValue("deadline", goal.deadline || "");
    setValue("linked_account_id", goal.linked_account_id || "");
    setValue("notes", goal.notes || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (!error) {
      fetchData();
      setDeleteConfirmId(null);
    }
  };

  const getMonthlyRequired = (goal: Goal) => {
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    if (remaining <= 0 || !goal.deadline) return null;

    const now = new Date();
    const deadline = new Date(goal.deadline);
    const monthsLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return remaining / monthsLeft;
  };

  const filteredGoals = goals.filter((goal) => {
    if (activeTab === "in-progress") return !goal.is_completed;
    if (activeTab === "completed") return goal.is_completed;
    return true;
  });

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalPercentage = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

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
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-48 animate-pulse" />
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Target Keuangan</h1>
          <p className="text-gray-500 mt-1">Tetapkan dan lacak target tabungan Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null);
            reset();
            setIsDialogOpen(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tujuan
        </Button>
      </div>

      {/* Total Progress Card */}
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
            <p className="text-white/80 text-sm font-medium">Total Progress Semua Tujuan</p>
            <p className="text-2xl md:text-3xl font-bold font-mono mt-1">
              {formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {goals.filter((g) => !g.is_completed).length} tujuan aktif
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: "all", label: "Semua" },
          { value: "in-progress", label: "Dalam Proses" },
          { value: "completed", label: "Tercapai" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as typeof activeTab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Belum ada tujuan</p>
          <p className="text-sm text-gray-500 mt-1">Buat tujuan pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const progress = Math.min(
              (Number(goal.current_amount) / Number(goal.target_amount)) * 100,
              100
            );
            const monthlyRequired = getMonthlyRequired(goal);
            const isCompleted = goal.is_completed;
            const daysLeft = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all ${
                  isCompleted ? "border-green-200 bg-green-50/30" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-100"
                        : "bg-gradient-to-br from-teal-500 to-emerald-500"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Target className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{goal.name}</p>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Tercapai
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(goal.id)}
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
                        isCompleted
                          ? "bg-green-500"
                          : "bg-gradient-to-r from-teal-500 to-emerald-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                  </span>
                  <span className={`text-sm font-semibold ${
                    isCompleted ? "text-green-600" : "text-teal-600"
                  }`}>
                    {progress.toFixed(1)}%
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  {goal.deadline && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysLeft !== null && daysLeft > 0
                          ? `${daysLeft} hari lagi`
                          : daysLeft === 0
                          ? "Hari ini"
                          : "Terlambat"}
                        {" • "}
                        {formatDateShort(goal.deadline)}
                      </span>
                    </div>
                  )}
                  {monthlyRequired && !isCompleted && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <TrendingUp className="h-4 w-4" />
                      <span>Tabung {formatCurrency(monthlyRequired)}/bulan</span>
                    </div>
                  )}
                </div>

                {/* Contribute Button */}
                {!isCompleted && (
                  <Button
                    onClick={() => {
                      setContributingGoal(goal);
                      setIsContributeOpen(true);
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
                  >
                    Kontribusi
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingGoal ? "Edit Tujuan" : "Tambah Tujuan Baru"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Tetapkan target tabungan Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nama Tujuan</Label>
              <Input
                placeholder="Contoh: Dana Darurat, Liburan"
                {...register("name")}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Target Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                {...register("target_amount", { valueAsNumber: true })}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
              {errors.target_amount && (
                <p className="text-sm text-red-500">{errors.target_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jumlah Saat Ini</Label>
              <Input
                type="number"
                placeholder="0"
                {...register("current_amount", { valueAsNumber: true })}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deadline (Opsional)</Label>
              <Input
                type="date"
                {...register("deadline")}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Akun Terkait (Opsional)</Label>
              <Select
                value={watch("linked_account_id") || ""}
                onValueChange={(value) => setValue("linked_account_id", value || null)}
              >
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
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
            </div>

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
                {editingGoal ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Kontribusi ke {contributingGoal?.name}</DialogTitle>
            <DialogDescription className="text-gray-500">
              Tambahkan tabungan ke tujuan Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitContribute(onContribute)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jumlah</Label>
              <Input
                type="number"
                placeholder="0"
                {...registerContribute("amount", { valueAsNumber: true })}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
              />
              {errorsContribute.amount && (
                <p className="text-sm text-red-500">{errorsContribute.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Dari Akun (Opsional)</Label>
              <Select
                onValueChange={(value) => {
                  registerContribute("account_id").onChange({ target: { value } });
                }}
              >
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(Number(account.current_balance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Catatan (Opsional)</Label>
              <Textarea
                {...registerContribute("notes")}
                className="bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributeOpen(false)}
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
                Kontribusi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Hapus Tujuan</DialogTitle>
            <DialogDescription className="text-gray-500">
              Apakah Anda yakin ingin menghapus tujuan ini?
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
