"use client";

import { useState } from "react";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { QuickEntry } from "@/components/transactions/quick-entry";
import { TransferForm } from "@/components/transactions/transfer-form";
import { Button } from "@/components/ui/button";
import { Plus, Zap, ArrowRightLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense" | "transfer">("expense");

  const handleAddTransaction = (type: "income" | "expense") => {
    setFormType(type);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsQuickEntryOpen(true)}>
          <Zap className="mr-2 h-4 w-4" />
          Quick Entry
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(true)}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transfer
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddTransaction("expense")}>
              Pengeluaran
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTransaction("income")}>
              Pemasukan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionList />

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialType={formType}
      />
      <QuickEntry open={isQuickEntryOpen} onOpenChange={setIsQuickEntryOpen} />
      <TransferForm open={isTransferOpen} onOpenChange={setIsTransferOpen} />
    </div>
  );
}
