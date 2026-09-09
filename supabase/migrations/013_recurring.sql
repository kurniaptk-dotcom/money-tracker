-- Create recurring transactions table
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

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring transactions" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_due ON public.recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_is_active ON public.recurring_transactions(is_active);

-- Function to calculate next due date
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

-- Function to create recurring transaction
CREATE OR REPLACE FUNCTION public.create_recurring_transaction(
  p_recurring_id UUID
) RETURNS UUID AS $$
DECLARE
  v_recurring RECORD;
  v_transaction_id UUID;
BEGIN
  -- Get recurring transaction details
  SELECT * INTO v_recurring
  FROM public.recurring_transactions
  WHERE id = p_recurring_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Create transaction
  INSERT INTO public.transactions (
    user_id, account_id, category_id, type, amount, description, date, is_recurring, recurring_id
  ) VALUES (
    v_recurring.user_id, v_recurring.account_id, v_recurring.category_id,
    v_recurring.type, v_recurring.amount, v_recurring.description,
    CURRENT_DATE, TRUE, v_recurring.id
  )
  RETURNING id INTO v_transaction_id;
  
  -- Update account balance
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
  
  -- Update recurring transaction
  UPDATE public.recurring_transactions
  SET last_created_date = CURRENT_DATE,
      next_due_date = public.calculate_next_due_date(CURRENT_DATE, frequency, custom_frequency_days),
      updated_at = NOW()
  WHERE id = p_recurring_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
