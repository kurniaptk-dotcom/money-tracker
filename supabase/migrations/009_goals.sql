-- Create goals table
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

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_deadline ON public.goals(deadline);
CREATE INDEX idx_goals_is_completed ON public.goals(is_completed);
