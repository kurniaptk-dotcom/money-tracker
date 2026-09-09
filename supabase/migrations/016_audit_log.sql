-- Create audit_log table
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

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies (users can only view their own audit logs)
CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (TRUE);

-- Indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Function to log audit events
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

-- Function to update account balance on transaction
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
    -- Reverse old transaction
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
    
    -- Apply new transaction
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

-- Trigger to update account balance on transaction
CREATE OR REPLACE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();
