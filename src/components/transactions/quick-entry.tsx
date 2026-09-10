"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickEntryProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categoryChips = [
  { name: "Makan", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Belanja", icon: "🛍️" },
  { name: "Tagihan", icon: "📄" },
  { name: "Hiburan", icon: "🎬" },
];

export function QuickEntry({ isOpen, onClose, open, onOpenChange }: QuickEntryProps) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isModalOpen = isOpen ?? open ?? false;
  const handleClose = onClose ?? (() => onOpenChange?.(false));

  useEffect(() => {
    if (user && isModalOpen) {
      fetchData();
    }
  }, [user, isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      setInput("");
      setAmount(null);
      setDescription("");
      setCategoryId("");
      setAccountId("");
      setDate(new Date().toISOString().split("T")[0]);
      setType("expense");
    }
  }, [isModalOpen]);

  const fetchData = async () => {
    const supabase = createClient();

    const [accountsRes, categoriesRes] = await Promise.all([
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

    if (accountsRes.data) {
      setAccounts(accountsRes.data);
      if (accountsRes.data.length > 0) {
        setAccountId(accountsRes.data[0].id);
      }
    }
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const parseQuickEntry = (text: string) => {
    const lower = text.toLowerCase();

    // Parse amount patterns: 50k, 50rb, 50000, 1.5jt, 1.5m
    let parsedAmount = 0;
    const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|jt|m|juta)?/);
    if (amountMatch) {
      let num = parseFloat(amountMatch[1].replace(",", "."));
      const suffix = amountMatch[2];
      if (suffix === "k" || suffix === "rb") {
        num *= 1000;
      } else if (suffix === "jt" || suffix === "m" || suffix === "juta") {
        num *= 1000000;
      }
      parsedAmount = num;
    }

    // Parse category from keywords
    const categoryKeywords: Record<string, string[]> = {
      Makan: ["makan", "lunch", "dinner", "breakfast", "kopi", "coffee", "food", "restaurant"],
      Transport: ["transport", "gojek", "grab", "bensin", "parkir", "tol", "transportasi"],
      Belanja: ["belanja", "shopping", "toko", "mall"],
      Tagihan: ["tagihan", "listrik", "air", "internet", "pulsa", "bills"],
      Hiburan: ["hiburan", "movie", "film", "netflix", "spotify", "game"],
    };

    let parsedCategory = "";
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        parsedCategory = cat;
        break;
      }
    }

    // Remove amount from description
    let parsedDescription = text.replace(/\d+(?:[.,]\d+)?\s*(k|rb|jt|m|juta)?/gi, "").trim();
    if (!parsedDescription) {
      parsedDescription = text;
    }

    return {
      amount: parsedAmount,
      description: parsedDescription,
      category: parsedCategory,
    };
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = parseQuickEntry(value);
    if (parsed.amount > 0) setAmount(parsed.amount);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.category) {
      const cat = categories.find(
        (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
      );
      if (cat) setCategoryId(cat.id);
    }
  };

  const handleChipClick = (chipName: string) => {
    setInput(`${chipName} `);
    const cat = categories.find(
      (c) => c.name.toLowerCase().includes(chipName.toLowerCase())
    );
    if (cat) setCategoryId(cat.id);
  };

  const handleSubmit = async () => {
    if (!amount || !accountId) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("transactions").insert({
      user_id: user?.id,
      account_id: accountId,
      category_id: categoryId || null,
      type: type,
      amount: amount,
      description: description || input,
      date: date,
    });

    if (!error) {
      handleClose();
    }
    setIsSubmitting(false);
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Tambah Transaksi Cepat
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick Input */}
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500" />
            <Input
              placeholder='Ketik seperti "Makan 50rb", "Gaji 5jt", "Transfer BCA 100k"'
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <p className="text-xs text-gray-500">
            Ketik seperti &quot;Makan 50rb&quot;, &quot;Gaji 5jt&quot;, &quot;Transfer BCA 100k&quot;
          </p>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categoryChips.map((chip) => (
              <button
                key={chip.name}
                onClick={() => handleChipClick(chip.name)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
              >
                {chip.icon} {chip.name}
              </button>
            ))}
          </div>

          {/* Parsed Result */}
          {amount && amount > 0 && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-xl">
                  {categories.find((c) => c.id === categoryId)?.name
                    ? categoryChips.find(
                        (ch) =>
                          ch.name.toLowerCase() ===
                          categories.find((c) => c.id === categoryId)?.name.toLowerCase()
                      )?.icon || "📌"
                    : "📌"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{description || input}</p>
                  <p className="text-sm text-gray-500">
                    {categories.find((c) => c.id === categoryId)?.name || "Lainnya"}
                  </p>
                </div>
                <p className="text-xl font-bold text-red-500 font-mono">
                  -{formatCurrency(amount)}
                </p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Kategori</Label>
              <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Akun</Label>
            <Select value={accountId} onValueChange={(v) => { if (v) setAccountId(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                type === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                type === "income"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={handleSubmit}
            disabled={!amount || !accountId || isSubmitting}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
