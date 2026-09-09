"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Target, CheckCircle2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { goalSchema, goalContributionSchema, type GoalInput, type GoalContributionInput } from "@/lib/validators";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { Goal, Account } from "@/types";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export function GoalList() {
  const router = useRouter();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          <h1 className="text-2xl font-bold">Tujuan Keuangan</h1>
          <p className="text-muted-foreground">Tetapkan dan lacak target tabungan Anda</p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null);
            reset();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tujuan
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Belum ada tujuan keuangan. Buat tujuan pertama Anda!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            const monthlyRequired = getMonthlyRequired(goal);
            const isCompleted = goal.is_completed;

            return (
              <Card key={goal.id} className={isCompleted ? "border-green-200 bg-green-50/50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {goal.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Selesai
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(goal)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteConfirmId(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateShort(goal.deadline)}
                      </span>
                    )}
                  </div>
                  {monthlyRequired && !isCompleted && (
                    <p className="text-xs text-muted-foreground">
                      Tabung {formatCurrency(monthlyRequired)}/bulan untuk mencapai target
                    </p>
                  )}
                  {!isCompleted && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setContributingGoal(goal);
                        setIsContributeOpen(true);
                      }}
                    >
                      Kontribusi
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Tujuan" : "Tambah Tujuan Baru"}
            </DialogTitle>
            <DialogDescription>
              Tetapkan target tabungan Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Tujuan</Label>
              <Input
                id="name"
                placeholder="Contoh: Dana Darurat, Liburan"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Jumlah</Label>
              <Input
                id="target_amount"
                type="number"
                placeholder="0"
                {...register("target_amount", { valueAsNumber: true })}
              />
              {errors.target_amount && (
                <p className="text-sm text-red-500">{errors.target_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_amount">Jumlah Saat Ini</Label>
              <Input
                id="current_amount"
                type="number"
                placeholder="0"
                {...register("current_amount", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Opsional)</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linked_account_id">Akun Terkait (Opsional)</Label>
              <Select
                value={watch("linked_account_id") || ""}
                onValueChange={(value) => setValue("linked_account_id", value || null)}
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
            </div>

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
                {editingGoal ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kontribusi ke {contributingGoal?.name}</DialogTitle>
            <DialogDescription>
              Tambahkan tabungan ke tujuan Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitContribute(onContribute)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...registerContribute("amount", { valueAsNumber: true })}
              />
              {errorsContribute.amount && (
                <p className="text-sm text-red-500">{errorsContribute.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Dari Akun (Opsional)</Label>
              <Select
                onValueChange={(value) => {
                  registerContribute("account_id").onChange({ target: { value } });
                }}
              >
                <SelectTrigger>
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
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea id="notes" {...registerContribute("notes")} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributeOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tujuan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tujuan ini?
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
