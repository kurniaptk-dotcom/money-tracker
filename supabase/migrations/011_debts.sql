-- Create debts table
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

-- Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own debts" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_debts_due_date ON public.debts(due_date);
CREATE INDEX idx_debts_is_completed ON public.debts(is_completed);
