-- Fix RLS policies for event_details to allow access to public items
-- Run this in your Supabase SQL Editor

-- Drop and recreate the event_details SELECT policy
DROP POLICY IF EXISTS "event_details_sel" ON "public"."event_details";

CREATE POLICY "event_details_sel" 
ON "public"."event_details"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = event_details.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix reminder_details SELECT policy too
DROP POLICY IF EXISTS "reminder_details_sel" ON "public"."reminder_details";

CREATE POLICY "reminder_details_sel" 
ON "public"."reminder_details"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = reminder_details.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix subtasks SELECT policy
DROP POLICY IF EXISTS "subtasks_sel" ON "public"."subtasks";

CREATE POLICY "subtasks_sel" 
ON "public"."subtasks"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = subtasks.parent_item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix item_categories SELECT policy
DROP POLICY IF EXISTS "item_categories_sel" ON "public"."item_categories";

CREATE POLICY "item_categories_sel" 
ON "public"."item_categories"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = item_categories.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix alerts SELECT policy
DROP POLICY IF EXISTS "alerts_sel" ON "public"."alerts";

CREATE POLICY "alerts_sel" 
ON "public"."alerts"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = alerts.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix recurrence_rules SELECT policy
DROP POLICY IF EXISTS "recurrence_rules_sel" ON "public"."recurrence_rules";

CREATE POLICY "recurrence_rules_sel" 
ON "public"."recurrence_rules"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = recurrence_rules.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);

-- Fix attachments SELECT policy
DROP POLICY IF EXISTS "attachments_sel" ON "public"."attachments";

CREATE POLICY "attachments_sel" 
ON "public"."attachments"
AS PERMISSIVE 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.items 
    WHERE items.id = attachments.item_id 
    AND (items.is_public = true OR items.user_id = auth.uid())
  )
);
