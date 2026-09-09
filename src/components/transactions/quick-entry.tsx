"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { quickEntrySchema, type QuickEntryInput } from "@/lib/validators";
import type { Account, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { formatCurrency } from "@/lib/utils";

interface ParsedTransaction {
  amount: number;
  description: string;
  type: "income" | "expense";
  category_id: string | null;
  account_id: string;
  date: string;
}

function parseQuickEntry(text: string): Partial<ParsedTransaction> {
  const result: Partial<ParsedTransaction> = {};

  // Parse amount: 50k, 10jt, 186000, Rp50.000
  const amountMatch = text.match(/(?:rp\.?\s*)?(\d+(?:\.\d{3})*(?:,\d+)?)\s*(k|jt|m|juta|ribu)?/i);
  if (amountMatch) {
    let amount = parseInt(amountMatch[1].replace(/\./g, ""), 10);
    const suffix = amountMatch[2]?.toLowerCase();
    if (suffix === "k" || suffix === "ribu") amount *= 1000;
    if (suffix === "jt" || suffix === "juta" || suffix === "m") amount *= 1000000;
    result.amount = amount;
  }

  // Parse description (everything except amount)
  let description = text.replace(/(?:rp\.?\s*)?\d+(?:\.\d{3})*(?:,\d+)?\s*(k|jt|m|juta|ribu)?/i, "").trim();
  if (description) {
    result.description = description;
  }

  // Default type is expense
  result.type = "expense";
  result.date = new Date().toISOString().split("T")[0];

  return result;
}

interface QuickEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickEntry({ open, onOpenChange }: QuickEntryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsed, setParsed] = useState<Partial<ParsedTransaction> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickEntryInput>({
    resolver: zodResolver(quickEntrySchema),
  });

  const watchText = watch("text");

  useEffect(() => {
    if (user && open) {
      fetchAccounts();
      fetchCategories();
    }
  }, [user, open]);

  useEffect(() => {
    if (watchText) {
      const result = parseQuickEntry(watchText);
      setParsed(result);
    }
  }, [watchText]);

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
    (c) => c.type === (parsed?.type || "expense")
  );

  const onSubmit = async () => {
    if (!parsed || !parsed.amount || !parsed.description) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const accountId = accounts[0]?.id;
    if (!accountId) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: parsed.category_id || null,
      type: parsed.type || "expense",
      amount: parsed.amount,
      description: parsed.description,
      date: parsed.date || new Date().toISOString().split("T")[0],
    });

    if (!error) {
      reset();
      setParsed(null);
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
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Entry
          </DialogTitle>
          <DialogDescription>
            Ketik transaksi secara cepat. Contoh: &quot;lunch 50k&quot;, &quot;gaji 10jt&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Input Cepat</Label>
            <Input
              id="text"
              placeholder="Contoh: lunch 50k, gaji 10jt"
              {...register("text")}
              autoFocus
            />
            {errors.text && (
              <p className="text-sm text-red-500">{errors.text.message}</p>
            )}
          </div>

          {parsed && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jumlah:</span>
                  <span className="font-medium">
                    {parsed.amount ? formatCurrency(parsed.amount) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deskripsi:</span>
                  <span className="font-medium">{parsed.description || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipe:</span>
                  <span className="font-medium capitalize">{parsed.type || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tanggal:</span>
                  <span className="font-medium">{parsed.date || "-"}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Akun</Label>
                  <Select
                    onValueChange={(value) => {
                      const accountId = String(value ?? "");
                      if (accountId) setParsed({ ...parsed, account_id: accountId });
                    }}
                  >
                    <SelectTrigger className="h-8">
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
                  <Label className="text-xs">Kategori</Label>
                  <Select
                    onValueChange={(value) => {
                      setParsed({ ...parsed, category_id: String(value ?? "") || null });
                    }}
                  >
                    <SelectTrigger className="h-8">
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
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !parsed?.amount || !parsed?.description}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
