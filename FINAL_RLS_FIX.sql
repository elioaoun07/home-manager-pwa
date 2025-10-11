-- ========================================
-- FINAL COMPLETE RLS POLICIES FIX
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ITEMS TABLE POLICIES
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "items_sel" ON public.items;
DROP POLICY IF EXISTS "items_ins" ON public.items;
DROP POLICY IF EXISTS "items_upd" ON public.items;
DROP POLICY IF EXISTS "items_del" ON public.items;

-- SELECT: Users can see their own items OR public items
CREATE POLICY "items_sel" ON public.items
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_public = true);

-- INSERT: Users can create items for themselves
CREATE POLICY "items_ins" ON public.items
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own items
CREATE POLICY "items_upd" ON public.items
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own items
CREATE POLICY "items_del" ON public.items
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ========================================
-- EVENT_DETAILS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "event_details_sel" ON public.event_details;
DROP POLICY IF EXISTS "event_details_ins" ON public.event_details;
DROP POLICY IF EXISTS "event_details_upd" ON public.event_details;
DROP POLICY IF EXISTS "event_details_del" ON public.event_details;

-- SELECT: Can see event details for items user has access to
CREATE POLICY "event_details_sel" ON public.event_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT: Can create event details for user's own items
CREATE POLICY "event_details_ins" ON public.event_details
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE: Can update event details for user's own items
CREATE POLICY "event_details_upd" ON public.event_details
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE: Can delete event details for user's own items
CREATE POLICY "event_details_del" ON public.event_details
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- REMINDER_DETAILS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "reminder_details_sel" ON public.reminder_details;
DROP POLICY IF EXISTS "reminder_details_ins" ON public.reminder_details;
DROP POLICY IF EXISTS "reminder_details_upd" ON public.reminder_details;
DROP POLICY IF EXISTS "reminder_details_del" ON public.reminder_details;

-- SELECT
CREATE POLICY "reminder_details_sel" ON public.reminder_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT
CREATE POLICY "reminder_details_ins" ON public.reminder_details
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "reminder_details_upd" ON public.reminder_details
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "reminder_details_del" ON public.reminder_details
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- CATEGORIES TABLE POLICIES
-- Categories are PUBLIC for all authenticated users
-- ========================================

DROP POLICY IF EXISTS "categories_sel" ON public.categories;
DROP POLICY IF EXISTS "categories_ins" ON public.categories;
DROP POLICY IF EXISTS "categories_upd" ON public.categories;
DROP POLICY IF EXISTS "categories_del" ON public.categories;

-- SELECT: All authenticated users can see all categories
CREATE POLICY "categories_sel" ON public.categories
FOR SELECT TO authenticated
USING (true);

-- INSERT: All authenticated users can create categories
CREATE POLICY "categories_ins" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE: All authenticated users can update categories
CREATE POLICY "categories_upd" ON public.categories
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: All authenticated users can delete categories
CREATE POLICY "categories_del" ON public.categories
FOR DELETE TO authenticated
USING (true);

-- ========================================
-- ITEM_CATEGORIES TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "item_categories_sel" ON public.item_categories;
DROP POLICY IF EXISTS "item_categories_ins" ON public.item_categories;
DROP POLICY IF EXISTS "item_categories_del" ON public.item_categories;

-- SELECT
CREATE POLICY "item_categories_sel" ON public.item_categories
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT: User must own the item (categories are public)
CREATE POLICY "item_categories_ins" ON public.item_categories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
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
-- SUBTASKS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "subtasks_sel" ON public.subtasks;
DROP POLICY IF EXISTS "subtasks_ins" ON public.subtasks;
DROP POLICY IF EXISTS "subtasks_upd" ON public.subtasks;
DROP POLICY IF EXISTS "subtasks_del" ON public.subtasks;

-- SELECT
CREATE POLICY "subtasks_sel" ON public.subtasks
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT
CREATE POLICY "subtasks_ins" ON public.subtasks
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "subtasks_upd" ON public.subtasks
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "subtasks_del" ON public.subtasks
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- ALERTS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "alerts_sel" ON public.alerts;
DROP POLICY IF EXISTS "alerts_ins" ON public.alerts;
DROP POLICY IF EXISTS "alerts_upd" ON public.alerts;
DROP POLICY IF EXISTS "alerts_del" ON public.alerts;

-- SELECT
CREATE POLICY "alerts_sel" ON public.alerts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT
CREATE POLICY "alerts_ins" ON public.alerts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "alerts_upd" ON public.alerts
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "alerts_del" ON public.alerts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- RECURRENCE_RULES TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "recurrence_rules_sel" ON public.recurrence_rules;
DROP POLICY IF EXISTS "recurrence_rules_ins" ON public.recurrence_rules;
DROP POLICY IF EXISTS "recurrence_rules_upd" ON public.recurrence_rules;
DROP POLICY IF EXISTS "recurrence_rules_del" ON public.recurrence_rules;

-- SELECT
CREATE POLICY "recurrence_rules_sel" ON public.recurrence_rules
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT
CREATE POLICY "recurrence_rules_ins" ON public.recurrence_rules
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "recurrence_rules_upd" ON public.recurrence_rules
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "recurrence_rules_del" ON public.recurrence_rules
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- ATTACHMENTS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "attachments_sel" ON public.attachments;
DROP POLICY IF EXISTS "attachments_ins" ON public.attachments;
DROP POLICY IF EXISTS "attachments_upd" ON public.attachments;
DROP POLICY IF EXISTS "attachments_del" ON public.attachments;

-- SELECT
CREATE POLICY "attachments_sel" ON public.attachments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND (items.user_id = auth.uid() OR items.is_public = true)
  )
);

-- INSERT
CREATE POLICY "attachments_ins" ON public.attachments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND items.user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "attachments_upd" ON public.attachments
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND items.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND items.user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "attachments_del" ON public.attachments
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND items.user_id = auth.uid()
  )
);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify policies are in place:

-- SELECT 
--   schemaname, 
--   tablename, 
--   policyname, 
--   permissive, 
--   roles, 
--   cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, cmd;
