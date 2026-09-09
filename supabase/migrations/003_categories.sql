-- Create categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Indexes
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type);

-- Insert default categories
INSERT INTO public.categories (name, type, icon, color, is_default, sort_order) VALUES
-- Expense categories
('Food', 'expense', 'utensils', '#ef4444', TRUE, 1),
('Transportation', 'expense', 'car', '#f97316', TRUE, 2),
('Shopping', 'expense', 'shopping-bag', '#eab308', TRUE, 3),
('Bills', 'expense', 'receipt', '#84cc16', TRUE, 4),
('Entertainment', 'expense', 'film', '#22c55e', TRUE, 5),
('Health', 'expense', 'heart-pulse', '#14b8a6', TRUE, 6),
('Education', 'expense', 'graduation-cap', '#06b6d4', TRUE, 7),
('Housing', 'expense', 'home', '#3b82f6', TRUE, 8),
('Personal', 'expense', 'user', '#8b5cf6', TRUE, 9),
('Travel', 'expense', 'plane', '#ec4899', TRUE, 10),
-- Income categories
('Salary', 'income', 'briefcase', '#22c55e', TRUE, 11),
('Freelance', 'income', 'laptop', '#14b8a6', TRUE, 12),
('Business', 'income', 'building-2', '#3b82f6', TRUE, 13),
('Bonus', 'income', 'gift', '#8b5cf6', TRUE, 14),
('Investment', 'income', 'trending-up', '#f59e0b', TRUE, 15),
('Other', 'income', 'more-horizontal', '#6b7280', TRUE, 16);
