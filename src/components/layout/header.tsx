"use client";

import { useState } from "react";
import Link from "next/link";
import { UserNav } from "./user-nav";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { QuickEntry } from "@/components/transactions/quick-entry";

export function Header() {
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="flex-1 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsQuickEntryOpen(true)}
        >
          <Zap className="mr-2 h-4 w-4" />
          Quick Entry
        </Button>
        <Button size="sm" render={<Link href="/transactions" />}>
          <Plus className="mr-2 h-4 w-4" />
          Transaksi
        </Button>
        <UserNav />
      </div>
      <QuickEntry open={isQuickEntryOpen} onOpenChange={setIsQuickEntryOpen} />
    </header>
  );
}
