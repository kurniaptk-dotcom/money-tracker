-- Create debt payments table
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

-- Enable RLS
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own debt payments" ON public.debt_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debt payments" ON public.debt_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debt payments" ON public.debt_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);

-- Function to record debt payment
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
  -- Insert payment
  INSERT INTO public.debt_payments (debt_id, user_id, amount, account_id, notes)
  VALUES (p_debt_id, p_user_id, p_amount, p_account_id, p_notes)
  RETURNING id INTO v_payment_id;
  
  -- Update outstanding amount
  UPDATE public.debts
  SET outstanding_amount = outstanding_amount - p_amount,
      updated_at = NOW()
  WHERE id = p_debt_id
  RETURNING outstanding_amount INTO v_new_outstanding;
  
  -- Check if debt is completed
  UPDATE public.debts
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = p_debt_id 
    AND v_new_outstanding <= 0
    AND is_completed = FALSE;
  
  -- Update account balance if linked
  IF p_account_id IS NOT NULL THEN
    UPDATE public.accounts
    SET current_balance = current_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_account_id;
  END IF;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
