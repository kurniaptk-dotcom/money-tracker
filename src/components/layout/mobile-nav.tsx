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
  settings: Settings,
};

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5 mb-1",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
