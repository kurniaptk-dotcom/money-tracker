-- Create budgets table
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

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX idx_budgets_period ON public.budgets(period);
