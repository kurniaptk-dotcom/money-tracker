-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subcategories" ON public.subcategories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own subcategories" ON public.subcategories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories" ON public.subcategories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories" ON public.subcategories
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX idx_subcategories_user_id ON public.subcategories(user_id);

-- Insert default subcategories for Food
INSERT INTO public.subcategories (category_id, name, icon, sort_order)
SELECT id, 'Restaurant', 'utensils', 1 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Coffee', 'coffee', 2 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Groceries', 'shopping-cart', 3 FROM public.categories WHERE name = 'Food' AND is_default = TRUE
UNION ALL
SELECT id, 'Delivery', 'truck', 4 FROM public.categories WHERE name = 'Food' AND is_default = TRUE;
