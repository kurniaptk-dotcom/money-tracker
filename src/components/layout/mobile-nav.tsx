"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart2,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/analytics", label: "Analitik", icon: BarChart2 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 text-xs font-medium transition-all duration-200 rounded-xl",
                isActive
                  ? "text-teal-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all duration-200",
                isActive
                  ? "bg-teal-100"
                  : ""
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-teal-600" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "text-xs",
                isActive ? "text-teal-600 font-semibold" : ""
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
