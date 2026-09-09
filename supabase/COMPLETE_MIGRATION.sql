-- ============================================
-- Personal Money Tracker - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 001: Profiles
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'IDR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================
-- 002: Accounts
-- ============================================
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'e-wallet', 'credit-card', 'investment', 'savings', 'custom')),
  initial_balance NUMERIC(15, 2) DEFAULT 0,
  current_balance NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- ============================================
-- 003: Categories
-- ============================================
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type);

INSERT INTO public.categories (name, type, icon, color, is_default, sort_order) VALUES
('Food', 'expense', 'utensils', '#ef4444', TRUE, 1),
('Transportation', 'expense', 'car', '#f97316', TRUE, 2),
('Shopping', 'expense', 'shopping-bag', '#eab308', TRUE, 3),
('Bills', 'expense', 'receipt', '#84cc16', TRUE, 4),
('Entertainment', 'expense', 'film', '#22c55e', TRUE, 5),
('Health', 'expense', 'heart-pulse', '#14b8a6', TRUE, 6),
('Education', 'expense', 'graduation-cap', '#06b6d4', TRUE, 7),
('Housing', 'expense', 'home', '#3b82f6', TRUE, 8),
('Personal', 'expense', 'user', '#8b5cf6', TRUE, 9),
('Travel', 'expense', 'plane', '#ec4899', TRUE, 10),
('Salary', 'income', 'briefcase', '#22c55e', TRUE, 11),
('Freelance', 'income', 'laptop', '#14b8a6', TRUE, 12),
('Business', 'income', 'building-2', '#3b82f6', TRUE, 13),
('Bonus', 'income', 'gift', '#8b5cf6', TRUE, 14),
('Investment', 'income', 'trending-up', '#f59e0b', TRUE, 15),
('Other', 'income', 'more-horizontal', '#6b7280', TRUE, 16);

-- ============================================
-- 004: Subcategories
-- ============================================
CREATE TABLE public.subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subcategories" ON public.subcategories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own subcategories" ON public.subcategories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories" ON public.subcategories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories" ON public.subcategories
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_subcategories_user_id ON public.subcategories(user_id);

INSERT INTO public.subcategories (category_id, name, icon, sort_order)
SELECT id, 'Restaurant', 'utensils', 1 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Coffee', 'coffee', 2 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Groceries', 'shopping-cart', 3 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Delivery', 'truck', 4 FROM public.categories WHERE name = 'Food' AND is_default = TRUE;

-- ============================================
-- 005: Transactions
-- ============================================
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  tags TEXT[],
  transfer_id UUID,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);

-- ============================================
-- 006: Transfers
-- ============================================
CREATE OR REPLACE VIEW public.transfers AS
SELECT
  t1.id AS source_transaction_id,
  t2.id AS destination_transaction_id,
  t1.user_id,
  t1.transfer_id,
  t1.amount,
  t1.date,
  t1.description,
  t1.notes,
  t1.account_id AS source_account_id,
  t2.account_id AS destination_account_id,
  a1.name AS source_account_name,
  a2.name AS destination_account_name,
  t1.created_at
FROM public.transactions t1
JOIN public.transactions t2 ON t1.transfer_id = t2.transfer_id AND t1.id != t2.id
JOIN public.accounts a1 ON t1.account_id = a1.id
JOIN public.accounts a2 ON t2.account_id = a2.id
WHERE t1.type = 'expense' AND t2.type = 'income'
  AND t1.transfer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_transfer(
  p_user_id UUID,
  p_source_account_id UUID,
  p_destination_account_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_date DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transfer_id UUID;
BEGIN
  v_transfer_id := gen_random_uuid();
  
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, date, notes, transfer_id
  ) VALUES (
    p_user_id, p_source_account_id, 'expense', p_amount, p_description, p_date, p_notes, v_transfer_id
  );
  
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, date, notes, transfer_id
  ) VALUES (
    p_user_id, p_destination_account_id, 'income', p_amount, p_description, p_date, p_notes, v_transfer_id
  );
  
  UPDATE public.accounts 
  SET current_balance = current_balance - p_amount, updated_at = NOW()
  WHERE id = p_source_account_id;
  
  UPDATE public.accounts 
  SET current_balance = current_balance + p_amount, updated_at = NOW()
  WHERE id = p_destination_account_id;
  
  RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 007: Budgets
-- ============================================
CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
  rollover_enabled BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX idx_budgets_period ON public.budgets(period);

-- ============================================
-- 008: Budget History
-- ============================================
CREATE TABLE public.budget_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocated_amount NUMERIC(15, 2) NOT NULL,
  spent_amount NUMERIC(15, 2) DEFAULT 0,
  rollover_amount NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget history" ON public.budget_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budget history" ON public.budget_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget history" ON public.budget_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_budget_history_budget_id ON public.budget_history(budget_id);
CREATE INDEX idx_budget_history_user_id ON public.budget_history(user_id);
CREATE INDEX idx_budget_history_period ON public.budget_history(period_start, period_end);

-- ============================================
-- 009: Goals
-- ============================================
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15, 2) DEFAULT 0,
  deadline DATE,
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_deadline ON public.goals(deadline);
CREATE INDEX idx_goals_is_completed ON public.goals(is_completed);

-- ============================================
-- 010: Goal Contributions
-- ============================================
CREATE TABLE public.goal_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes TEXT,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal contributions" ON public.goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal contributions" ON public.goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions" ON public.goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_user_id ON public.goal_contributions(user_id);

CREATE OR REPLACE FUNCTION public.contribute_to_goal(
  p_goal_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_account_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_contribution_id UUID;
  v_new_current_amount NUMERIC;
BEGIN
  INSERT INTO public.goal_contributions (goal_id, user_id, amount, account_id, notes)
  VALUES (p_goal_id, p_user_id, p_amount, p_account_id, p_notes)
  RETURNING id INTO v_contribution_id;
  
  UPDATE public.goals
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_goal_id
  RETURNING current_amount INTO v_new_current_amount;
  
  UPDATE public.goals
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = p_goal_id 
    AND v_new_current_amount >= target_amount
    AND is_completed = FALSE;
  
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET current_balance = current_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_account_id;
  END IF;
  
  RETURN v_contribution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 011: Debts
-- ============================================
CREATE TABLE public.debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  creditor_name TEXT,
  original_amount NUMERIC(15, 2) NOT NULL CHECK (original_amount > 0),
  outstanding_amount NUMERIC(15, 2) NOT NULL CHECK (outstanding_amount >= 0),
  interest_rate NUMERIC(5, 2) DEFAULT 0,
  tenor_months INTEGER,
  due_date DATE,
  payment_amount NUMERIC(15, 2),
  payment_frequency TEXT CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debts" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_due_date ON public.debts(due_date);
CREATE INDEX idx_debts_is_completed ON public.debts(is_completed);

-- ============================================
-- 012: Debt Payments
-- ============================================
CREATE TABLE public.debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debt payments" ON public.debt_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debt payments" ON public.debt_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt payments" ON public.debt_payments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);

CREATE OR REPLACE FUNCTION public.record_debt_payment(
  p_debt_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_account_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_new_outstanding NUMERIC;
BEGIN
  INSERT INTO public.debt_payments (debt_id, user_id, amount, account_id, notes)
  VALUES (p_debt_id, p_user_id, p_amount, p_account_id, p_notes)
  RETURNING id INTO v_payment_id;
  
  UPDATE public.debts
  SET outstanding_amount = outstanding_amount - p_amount,
      updated_at = NOW()
  WHERE id = p_debt_id
  RETURNING outstanding_amount INTO v_new_outstanding;
  
  UPDATE public.debts
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = p_debt_id 
    AND v_new_outstanding <= 0
    AND is_completed = FALSE;
  
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET current_balance = current_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_account_id;
  END IF;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 013: Recurring Transactions
-- ============================================
CREATE TABLE public.recurring_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  custom_frequency_days INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  reminder_days_before INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  last_created_date DATE,
  next_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring transactions" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_due ON public.recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_is_active ON public.recurring_transactions(is_active);

CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  p_current_date DATE,
  p_frequency TEXT,
  p_custom_days INTEGER DEFAULT NULL
) RETURNS DATE AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'daily' THEN p_current_date + INTERVAL '1 day'
    WHEN 'weekly' THEN p_current_date + INTERVAL '1 week'
    WHEN 'monthly' THEN p_current_date + INTERVAL '1 month'
    WHEN 'yearly' THEN p_current_date + INTERVAL '1 year'
    WHEN 'custom' THEN p_current_date + (p_custom_days || ' days')::INTERVAL
    ELSE p_current_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_recurring_transaction(
  p_recurring_id UUID
) RETURNS UUID AS $$
DECLARE
  v_recurring RECORD;
  v_transaction_id UUID;
BEGIN
  SELECT * INTO v_recurring
  FROM public.recurring_transactions
  WHERE id = p_recurring_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.transactions (
    user_id, account_id, category_id, type, amount, description, date, is_recurring, recurring_id
  ) VALUES (
    v_recurring.user_id, v_recurring.account_id, v_recurring.category_id,
    v_recurring.type, v_recurring.amount, v_recurring.description,
    CURRENT_DATE, TRUE, v_recurring.id
  )
  RETURNING id INTO v_transaction_id;
  
  IF v_recurring.type = 'income' THEN
    UPDATE public.accounts
    SET current_balance = current_balance + v_recurring.amount,
        updated_at = NOW()
    WHERE id = v_recurring.account_id;
  ELSE
    UPDATE public.accounts
    SET current_balance = current_balance - v_recurring.amount,
        updated_at = NOW()
    WHERE id = v_recurring.account_id;
  END IF;
  
  UPDATE public.recurring_transactions
  SET last_created_date = CURRENT_DATE,
      next_due_date = public.calculate_next_due_date(CURRENT_DATE, frequency, custom_frequency_days),
      updated_at = NOW()
  WHERE id = p_recurring_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 014: Tags
-- ============================================
CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.transaction_tags (
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (transaction_id, tag_id)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction_tags" ON public.transaction_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own transaction_tags" ON public.transaction_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transaction_tags" ON public.transaction_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);

-- ============================================
-- 015: Notifications
-- ============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_alert', 'recurring_reminder', 'debt_due', 'goal_milestone', 'monthly_summary', 'unusual_spending', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.notification_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  budget_alert_enabled BOOLEAN DEFAULT TRUE,
  budget_alert_threshold NUMERIC(5, 2) DEFAULT 80,
  recurring_reminder_enabled BOOLEAN DEFAULT TRUE,
  debt_due_enabled BOOLEAN DEFAULT TRUE,
  goal_milestone_enabled BOOLEAN DEFAULT TRUE,
  monthly_summary_enabled BOOLEAN DEFAULT TRUE,
  unusual_spending_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- 016: Audit Log
-- ============================================
CREATE TABLE public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'export', 'import')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_data, p_new_data)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
    
    IF NEW.type = 'income' THEN
      UPDATE public.accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();
