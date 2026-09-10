"use client";

import { useState } from "react";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { QuickEntry } from "@/components/transactions/quick-entry";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Halo, Kurnia 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola keuanganmu dengan lebih baik hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardOverview />

      {/* FAB Button */}
      <button
        onClick={() => setIsQuickEntryOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Quick Entry Modal */}
      <QuickEntry
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
      />
    </div>
  );
}
