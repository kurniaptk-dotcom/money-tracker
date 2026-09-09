"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";

interface ParsedRow {
  date: string;
  description: string;
  type: string;
  amount: string;
  account: string;
  category: string;
  notes: string;
  raw: Record<string, string>;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function CsvImport() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [defaultAccountId, setDefaultAccountId] = useState<string>("");
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const requiredFields = [
    { key: "date", label: "Tanggal" },
    { key: "description", label: "Deskripsi" },
    { key: "amount", label: "Jumlah" },
  ];

  const optionalFields = [
    { key: "type", label: "Tipe (income/expense)" },
    { key: "account", label: "Akun" },
    { key: "category", label: "Kategori" },
    { key: "notes", label: "Catatan" },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData([]);
    setResult(null);

    const text = await selectedFile.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      alert("Error parsing CSV: " + parsed.errors[0].message);
      return;
    }

    const headers = parsed.meta.fields || [];
    setCsvHeaders(headers);

    const defaultMapping: Record<string, string> = {};
    requiredFields.forEach((field) => {
      const match = headers.find(
        (h) => h.toLowerCase() === field.key.toLowerCase()
      );
      if (match) defaultMapping[field.key] = match;
    });
    optionalFields.forEach((field) => {
      const match = headers.find(
        (h) => h.toLowerCase() === field.key.toLowerCase()
      );
      if (match) defaultMapping[field.key] = match;
    });

    setColumnMapping(defaultMapping);

    const data = (parsed.data as Record<string, string>[])
      .slice(0, 100)
      .map((row) => ({
        date: row[defaultMapping["date"]] || "",
        description: row[defaultMapping["description"]] || "",
        type: row[defaultMapping["type"]] || "",
        amount: row[defaultMapping["amount"]] || "",
        account: row[defaultMapping["account"]] || "",
        category: row[defaultMapping["category"]] || "",
        notes: row[defaultMapping["notes"]] || "",
        raw: row,
      }));

    setParsedData(data);

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
        setDefaultAccountId(accountsRes.data[0].id);
      }
    }
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    const supabase = createClient();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of parsedData) {
      try {
        const amount = parseFloat(row.amount.replace(/[.,\s]/g, ""));
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Baris ${success + failed + 1}: Jumlah tidak valid`);
          failed++;
          continue;
        }

        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push(`Baris ${success + failed + 1}: Tanggal tidak valid`);
          failed++;
          continue;
        }

        const type =
          row.type.toLowerCase() === "income" ||
          row.type.toLowerCase() === "pemasukan"
            ? "income"
            : row.type.toLowerCase() === "transfer"
            ? "transfer"
            : "expense";

        let accountId = defaultAccountId;
        if (row.account) {
          const account = accounts.find(
            (a) => a.name.toLowerCase() === row.account.toLowerCase()
          );
          if (account) accountId = account.id;
        }

        let categoryId = null;
        if (row.category) {
          const category = categories.find(
            (c) => c.name.toLowerCase() === row.category.toLowerCase()
          );
          if (category) categoryId = category.id;
        }

        const { error } = await supabase.from("transactions").insert({
          user_id: user?.id,
          account_id: accountId,
          category_id: categoryId,
          type: type,
          amount: amount,
          description: row.description || "Imported transaction",
          date: date.toISOString().split("T")[0],
          notes: row.notes || null,
        });

        if (error) {
          errors.push(`Baris ${success + failed + 1}: ${error.message}`);
          failed++;
        } else {
          success++;
        }
      } catch (err) {
        errors.push(
          `Baris ${success + failed + 1}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        failed++;
      }
    }

    setResult({ success, failed, errors });
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    const template =
      "Date,Description,Type,Amount,Account,Category,Notes\n2026-01-01,Lunch,Expense,50000,BCA,Food,Business lunch\n2026-01-02,Salary,Income,10000000,BCA,Salary,Monthly salary";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import CSV</h1>
          <p className="text-muted-foreground">
            Import transaksi dari file CSV
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Format: CSV dengan kolom Date, Description, Type, Amount, Account,
            Category, Notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Pilih File
            </Button>
            {file && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <Badge variant="secondary">{parsedData.length} baris</Badge>
              </div>
            )}
          </div>

          {parsedData.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Akun Default</Label>
                  <Select
                    value={defaultAccountId}
                    onValueChange={(value) => { if (value) setDefaultAccountId(value); }}
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
                  <Label>Tipe Default</Label>
                  <Select
                    value={defaultType}
                    onValueChange={(v) => setDefaultType(v as "income" | "expense")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                      <SelectItem value="income">Pemasukan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview (5 baris pertama)</Label>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Tanggal</th>
                        <th className="p-2 text-left">Deskripsi</th>
                        <th className="p-2 text-left">Tipe</th>
                        <th className="p-2 text-left">Jumlah</th>
                        <th className="p-2 text-left">Akun</th>
                        <th className="p-2 text-left">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.date}</td>
                          <td className="p-2">{row.description}</td>
                          <td className="p-2">{row.type}</td>
                          <td className="p-2">{row.amount}</td>
                          <td className="p-2">{row.account || "-"}</td>
                          <td className="p-2">{row.category || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import {parsedData.length} Transaksi
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">{result.success} berhasil</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">{result.failed} gagal</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Error Details</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-500">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setResult(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Import Lagi
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
