"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Landmark,
  BarChart3,
  Lightbulb,
  Repeat,
  Upload,
  Download,
  Settings,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "arrow-left-right": ArrowLeftRight,
  wallet: Wallet,
  "pie-chart": PieChart,
  target: Target,
  landmark: Landmark,
  "bar-chart-3": BarChart3,
  lightbulb: Lightbulb,
  repeat: Repeat,
  upload: Upload,
  download: Download,
  settings: Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r bg-card">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = iconMap[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
