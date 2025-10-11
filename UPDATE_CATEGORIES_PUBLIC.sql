-- ========================================
-- UPDATE CATEGORIES TO BE PUBLIC
-- Run this in Supabase SQL Editor
-- ========================================

-- First, remove user_id column from categories table if it exists
ALTER TABLE public.categories DROP COLUMN IF EXISTS user_id;

-- Drop existing category policies
DROP POLICY IF EXISTS "categories_sel" ON public.categories;
DROP POLICY IF EXISTS "categories_ins" ON public.categories;
DROP POLICY IF EXISTS "categories_upd" ON public.categories;
DROP POLICY IF EXISTS "categories_del" ON public.categories;

-- Create new PUBLIC category policies
-- All authenticated users can see all categories
CREATE POLICY "categories_sel" ON public.categories
FOR SELECT TO authenticated
USING (true);

-- All authenticated users can create categories
CREATE POLICY "categories_ins" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (true);

-- All authenticated users can update categories
CREATE POLICY "categories_upd" ON public.categories
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- All authenticated users can delete categories
CREATE POLICY "categories_del" ON public.categories
FOR DELETE TO authenticated
USING (true);

-- ========================================
-- UPDATE ITEM_CATEGORIES POLICIES
-- ========================================

-- Drop existing item_categories policies
DROP POLICY IF EXISTS "item_categories_sel" ON public.item_categories;
DROP POLICY IF EXISTS "item_categories_ins" ON public.item_categories;
DROP POLICY IF EXISTS "item_categories_del" ON public.item_categories;

-- SELECT: Can see item-category links for items user has access to
CREATE POLICY "item_categories_sel" ON public.item_categories
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT: User must own the item (categories are public, so no category check needed)
CREATE POLICY "item_categories_ins" ON public.item_categories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE: User must own the item
CREATE POLICY "item_categories_del" ON public.item_categories
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- VERIFICATION
-- ========================================
-- Run this to verify the policies:

SELECT 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'item_categories')
ORDER BY tablename, cmd;
