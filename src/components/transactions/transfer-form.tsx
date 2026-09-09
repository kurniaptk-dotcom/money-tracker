"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { transferSchema, type TransferInput } from "@/lib/validators";
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

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferForm({ open, onOpenChange }: TransferFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const watchSourceId = watch("source_account_id");
  const watchDestId = watch("destination_account_id");

  useEffect(() => {
    if (user && open) {
      fetchAccounts();
    }
  }, [user, open]);

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

  const onSubmit = async (data: TransferInput) => {
    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.rpc("create_transfer", {
      p_user_id: user?.id,
      p_source_account_id: data.source_account_id,
      p_destination_account_id: data.destination_account_id,
      p_amount: data.amount,
      p_description: data.description,
      p_date: data.date as string,
      p_notes: data.notes || null,
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
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-500" />
            Transfer Antar Akun
          </DialogTitle>
          <DialogDescription>
            Pindahkan uang dari satu akun ke akun lainnya
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source_account_id">Dari Akun</Label>
            <Select
              value={watchSourceId}
              onValueChange={(value) => { if (value) setValue("source_account_id", value); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun sumber" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(Number(account.current_balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_account_id && (
              <p className="text-sm text-red-500">{errors.source_account_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_account_id">Ke Akun</Label>
            <Select
              value={watchDestId}
              onValueChange={(value) => { if (value) setValue("destination_account_id", value); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== watchSourceId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(Number(account.current_balance))})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.destination_account_id && (
              <p className="text-sm text-red-500">
                {errors.destination_account_id.message}
              </p>
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
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Contoh: Transfer ke GoPay"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea id="notes" {...register("notes")} />
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
              ) : (
                <ArrowRightLeft className="mr-2 h-4 w-4" />
              )}
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
