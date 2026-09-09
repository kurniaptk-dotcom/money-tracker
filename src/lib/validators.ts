import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Password tidak cocok",
  path: ["confirm_password"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(8, "Password minimal 8 karakter"),
  new_password: z.string().min(8, "Password minimal 8 karakter"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Password tidak cocok",
  path: ["confirm_password"],
});

// Account schemas
export const accountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(["bank", "cash", "e-wallet", "credit-card", "investment", "savings", "custom"]),
  initial_balance: z.number().min(0, "Saldo awal tidak boleh negatif"),
  currency: z.string(),
  notes: z.string().optional(),
});

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["income", "expense"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const subcategorySchema = z.object({
  name: z.string().min(1, "Nama subkategori wajib diisi"),
  category_id: z.string().uuid("ID kategori tidak valid"),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Transaction schemas
export const transactionSchema = z.object({
  account_id: z.string().uuid("ID akun tidak valid"),
  category_id: z.string().uuid("ID kategori tidak valid").optional().nullable(),
  subcategory_id: z.string().uuid("ID subkategori tidak valid").optional().nullable(),
  type: z.enum(["income", "expense", "transfer", "investment"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  date: z.string().or(z.date()),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const quickEntrySchema = z.object({
  text: z.string().min(1, "Input wajib diisi"),
});

// Transfer schema
export const transferSchema = z.object({
  source_account_id: z.string().uuid("ID akun sumber tidak valid"),
  destination_account_id: z.string().uuid("ID akun tujuan tidak valid"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  date: z.string().or(z.date()),
  notes: z.string().optional(),
}).refine((data) => data.source_account_id !== data.destination_account_id, {
  message: "Akun sumber dan tujuan harus berbeda",
  path: ["destination_account_id"],
});

// Budget schemas
export const budgetSchema = z.object({
  category_id: z.string().uuid("ID kategori tidak valid"),
  amount: z.number().positive("Anggaran harus lebih dari 0"),
  period: z.enum(["monthly", "yearly"]),
  rollover_enabled: z.boolean(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional().nullable(),
});

// Goal schemas
export const goalSchema = z.object({
  name: z.string().min(1, "Nama tujuan wajib diisi"),
  target_amount: z.number().positive("Target harus lebih dari 0"),
  current_amount: z.number().min(0, "Jumlah saat ini tidak boleh negatif"),
  deadline: z.string().or(z.date()).optional().nullable(),
  linked_account_id: z.string().uuid("ID akun tidak valid").optional().nullable(),
  notes: z.string().optional(),
});

export const goalContributionSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  account_id: z.string().uuid("ID akun tidak valid").optional().nullable(),
  notes: z.string().optional(),
});

// Debt schemas
export const debtSchema = z.object({
  name: z.string().min(1, "Nama hutang wajib diisi"),
  creditor_name: z.string().optional(),
  original_amount: z.number().positive("Jumlah asal harus lebih dari 0"),
  outstanding_amount: z.number().min(0, "Jumlah terutang tidak boleh negatif"),
  interest_rate: z.number().min(0).max(100).default(0),
  tenor_months: z.number().positive().optional().nullable(),
  due_date: z.string().or(z.date()).optional().nullable(),
  payment_amount: z.number().positive().optional().nullable(),
  payment_frequency: z.enum(["weekly", "biweekly", "monthly", "yearly"]).optional().nullable(),
  linked_account_id: z.string().uuid("ID akun tidak valid").optional().nullable(),
  notes: z.string().optional(),
});

export const debtPaymentSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  account_id: z.string().uuid("ID akun tidak valid").optional().nullable(),
  notes: z.string().optional(),
});

// Recurring transaction schemas
export const recurringTransactionSchema = z.object({
  account_id: z.string().uuid("ID akun tidak valid"),
  category_id: z.string().uuid("ID kategori tidak valid").optional().nullable(),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]),
  custom_frequency_days: z.number().positive().optional().nullable(),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional().nullable(),
  reminder_days_before: z.number().min(0),
});

// Profile schemas
export const profileSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  currency: z.string(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  budget_alert_enabled: z.boolean(),
  budget_alert_threshold: z.number().min(1).max(100),
  recurring_reminder_enabled: z.boolean(),
  debt_due_enabled: z.boolean(),
  goal_milestone_enabled: z.boolean(),
  monthly_summary_enabled: z.boolean(),
  unusual_spending_enabled: z.boolean(),
  push_enabled: z.boolean(),
  email_enabled: z.boolean(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SubcategoryInput = z.infer<typeof subcategorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type QuickEntryInput = z.infer<typeof quickEntrySchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
