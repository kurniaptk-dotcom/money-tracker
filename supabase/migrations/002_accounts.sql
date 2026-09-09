-- Create accounts table
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

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
