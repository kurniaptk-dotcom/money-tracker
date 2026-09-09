import {
  AccountType,
  TransactionType,
  BudgetPeriod,
  RecurringFrequency,
} from "@/types";

// Account types with labels and icons
export const ACCOUNT_TYPES: Record<
  AccountType,
  { label: string; icon: string; color: string }
> = {
  bank: { label: "Bank", icon: "building-2", color: "#3b82f6" },
  cash: { label: "Cash", icon: "wallet", color: "#22c55e" },
  "e-wallet": { label: "E-Wallet", icon: "smartphone", color: "#8b5cf6" },
  "credit-card": {
    label: "Credit Card",
    icon: "credit-card",
    color: "#ef4444",
  },
  investment: { label: "Investment", icon: "trending-up", color: "#f59e0b" },
  savings: { label: "Savings", icon: "piggy-bank", color: "#14b8a6" },
  custom: { label: "Custom", icon: "more-horizontal", color: "#6b7280" },
};

// Transaction types with labels and colors
export const TRANSACTION_TYPES: Record<
  TransactionType,
  { label: string; color: string; icon: string }
> = {
  income: { label: "Income", color: "#22c55e", icon: "arrow-down-left" },
  expense: { label: "Expense", color: "#ef4444", icon: "arrow-up-right" },
  transfer: { label: "Transfer", color: "#3b82f6", icon: "arrow-right-left" },
  investment: {
    label: "Investment",
    color: "#f59e0b",
    icon: "trending-up",
  },
};

// Budget periods
export const BUDGET_PERIODS: Record<
  BudgetPeriod,
  { label: string; description: string }
> = {
  monthly: { label: "Monthly", description: "Reset every month" },
  yearly: { label: "Yearly", description: "Reset every year" },
};

// Recurring frequencies
export const RECURRING_FREQUENCIES: Record<
  RecurringFrequency,
  { label: string; description: string }
> = {
  daily: { label: "Daily", description: "Every day" },
  weekly: { label: "Weekly", description: "Every week" },
  monthly: { label: "Monthly", description: "Every month" },
  yearly: { label: "Yearly", description: "Every year" },
  custom: { label: "Custom", description: "Custom interval" },
};

// Default categories
export const DEFAULT_CATEGORIES = [
  // Expense
  { name: "Food", type: "expense" as const, icon: "utensils", color: "#ef4444" },
  {
    name: "Transportation",
    type: "expense" as const,
    icon: "car",
    color: "#f97316",
  },
  {
    name: "Shopping",
    type: "expense" as const,
    icon: "shopping-bag",
    color: "#eab308",
  },
  { name: "Bills", type: "expense" as const, icon: "receipt", color: "#84cc16" },
  {
    name: "Entertainment",
    type: "expense" as const,
    icon: "film",
    color: "#22c55e",
  },
  {
    name: "Health",
    type: "expense" as const,
    icon: "heart-pulse",
    color: "#14b8a6",
  },
  {
    name: "Education",
    type: "expense" as const,
    icon: "graduation-cap",
    color: "#06b6d4",
  },
  {
    name: "Housing",
    type: "expense" as const,
    icon: "home",
    color: "#3b82f6",
  },
  {
    name: "Personal",
    type: "expense" as const,
    icon: "user",
    color: "#8b5cf6",
  },
  {
    name: "Travel",
    type: "expense" as const,
    icon: "plane",
    color: "#ec4899",
  },
  // Income
  {
    name: "Salary",
    type: "income" as const,
    icon: "briefcase",
    color: "#22c55e",
  },
  {
    name: "Freelance",
    type: "income" as const,
    icon: "laptop",
    color: "#14b8a6",
  },
  {
    name: "Business",
    type: "income" as const,
    icon: "building-2",
    color: "#3b82f6",
  },
  {
    name: "Bonus",
    type: "income" as const,
    icon: "gift",
    color: "#8b5cf6",
  },
  {
    name: "Investment",
    type: "income" as const,
    icon: "trending-up",
    color: "#f59e0b",
  },
  {
    name: "Other",
    type: "income" as const,
    icon: "more-horizontal",
    color: "#6b7280",
  },
];

// Navigation items
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { label: "Transactions", href: "/transactions", icon: "arrow-left-right" },
  { label: "Accounts", href: "/accounts", icon: "wallet" },
  { label: "Budget", href: "/budget", icon: "pie-chart" },
  { label: "Goals", href: "/goals", icon: "target" },
  { label: "Debts", href: "/debts", icon: "landmark" },
  { label: "Analytics", href: "/analytics", icon: "bar-chart-3" },
  { label: "Insights", href: "/insights", icon: "lightbulb" },
  { label: "Recurring", href: "/recurring", icon: "repeat" },
  { label: "Import", href: "/import", icon: "upload" },
  { label: "Export", href: "/export", icon: "download" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

// Currency
export const DEFAULT_CURRENCY = "IDR";
export const CURRENCY_SYMBOL = "Rp";
