-- Create tags table
CREATE TABLE public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction_tags table (many-to-many)
CREATE TABLE public.transaction_tags (
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- Policies for tags
CREATE POLICY "Users can view own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for transaction_tags
CREATE POLICY "Users can view own transaction_tags" ON public.transaction_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own transaction_tags" ON public.transaction_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transaction_tags" ON public.transaction_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);
