-- Create transfer view for linked transactions
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

-- Function to create transfer
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
  -- Generate transfer ID
  v_transfer_id := gen_random_uuid();
  
  -- Create source transaction (expense)
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, date, notes, transfer_id
  ) VALUES (
    p_user_id, p_source_account_id, 'expense', p_amount, p_description, p_date, p_notes, v_transfer_id
  );
  
  -- Create destination transaction (income)
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, description, date, notes, transfer_id
  ) VALUES (
    p_user_id, p_destination_account_id, 'income', p_amount, p_description, p_date, p_notes, v_transfer_id
  );
  
  -- Update account balances
  UPDATE public.accounts 
  SET current_balance = current_balance - p_amount, updated_at = NOW()
  WHERE id = p_source_account_id;
  
  UPDATE public.accounts 
  SET current_balance = current_balance + p_amount, updated_at = NOW()
  WHERE id = p_destination_account_id;
  
  RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
