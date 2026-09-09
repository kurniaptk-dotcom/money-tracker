import type { Database } from "./database";

// Simplified types for easier use
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Subcategory = Database["public"]["Tables"]["subcategories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type RecurringTransaction = Database["public"]["Tables"]["recurring_transactions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Insert types
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type DebtInsert = Database["public"]["Tables"]["debts"]["Insert"];
export type RecurringTransactionInsert = Database["public"]["Tables"]["recurring_transactions"]["Insert"];

// Update types
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"];
export type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];
export type DebtUpdate = Database["public"]["Tables"]["debts"]["Update"];

// Transfer type
export type Transfer = Database["public"]["Views"]["transfers"]["Row"];

// Enums
export type AccountType = "bank" | "cash" | "e-wallet" | "credit-card" | "investment" | "savings" | "custom";
export type TransactionType = "income" | "expense" | "transfer" | "investment";
export type BudgetPeriod = "monthly" | "yearly";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";
export type NotificationType = "budget_alert" | "recurring_reminder" | "debt_due" | "goal_milestone" | "monthly_summary" | "unusual_spending" | "info";
