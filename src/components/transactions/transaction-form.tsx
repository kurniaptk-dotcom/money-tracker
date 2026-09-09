"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { transactionSchema, type TransactionInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Account, Category } from "@/types";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: "income" | "expense" | "transfer";
}

export function TransactionForm({ open, onOpenChange, initialType = "expense" }: TransactionFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "transfer">(initialType);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialType,
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const watchAccountId = watch("account_id");
  const watchCategoryId = watch("category_id");

  useEffect(() => {
    if (user && open) {
      fetchAccounts();
      fetchCategories();
    }
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setValue("type", transactionType);
    }
  }, [transactionType, open, setValue]);

  const fetchAccounts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_archived", false)
      .order("name");

    if (data) setAccounts(data);
  };

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user?.id},user_id.is.null`)
      .order("sort_order");

    if (data) setCategories(data);
  };

  const filteredCategories = categories.filter(
    (c) => c.type === transactionType
  );

  const onSubmit = async (data: TransactionInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("transactions").insert({
      user_id: user?.id,
      account_id: data.account_id,
      category_id: data.category_id || null,
      subcategory_id: data.subcategory_id || null,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date as string,
      notes: data.notes,
      tags: data.tags,
    });

    if (!error) {
      reset();
      onOpenChange(false);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi</DialogTitle>
          <DialogDescription>
            Catat pemasukan atau pengeluaran Anda
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={transactionType}
            onValueChange={(v) => setTransactionType(v as typeof transactionType)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Pemasukan
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Contoh: Makan siang"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_id">Akun</Label>
            <Select
              value={watchAccountId}
              onValueChange={(value) => { if (value) setValue("account_id", value); }}
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
            {errors.account_id && (
              <p className="text-sm text-red-500">{errors.account_id.message}</p>
            )}
          </div>

          {transactionType !== "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="category_id">Kategori</Label>
              <Select
                value={watchCategoryId || ""}
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
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea id="notes" placeholder="Tambahkan catatan..." {...register("notes")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
