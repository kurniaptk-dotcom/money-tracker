-- Create budget history table for rollover tracking
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

-- Enable RLS
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own budget history" ON public.budget_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budget history" ON public.budget_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget history" ON public.budget_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_budget_history_budget_id ON public.budget_history(budget_id);
CREATE INDEX idx_budget_history_user_id ON public.budget_history(user_id);
CREATE INDEX idx_budget_history_period ON public.budget_history(period_start, period_end);
