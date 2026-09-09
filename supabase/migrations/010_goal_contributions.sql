-- Create goal contributions table
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

-- Enable RLS
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own goal contributions" ON public.goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal contributions" ON public.goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions" ON public.goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_user_id ON public.goal_contributions(user_id);

-- Function to contribute to goal
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
  -- Insert contribution
  INSERT INTO public.goal_contributions (goal_id, user_id, amount, account_id, notes)
  VALUES (p_goal_id, p_user_id, p_amount, p_account_id, p_notes)
  RETURNING id INTO v_contribution_id;
  
  -- Update goal current amount
  UPDATE public.goals
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_goal_id
  RETURNING current_amount INTO v_new_current_amount;
  
  -- Check if goal is completed
  UPDATE public.goals
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = p_goal_id 
    AND v_new_current_amount >= target_amount
    AND is_completed = FALSE;
  
  -- Update account balance if linked
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET current_balance = current_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_account_id;
  END IF;
  
  RETURN v_contribution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
