-- =============================================
-- Row Level Security (RLS) Policies
-- Home Manager PWA - Supabase Setup
-- =============================================

-- Enable RLS on all tables
-- =============================================

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snoozes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Items Policies
-- =============================================

CREATE POLICY "Users can view their own items or public items"
  ON public.items FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_public = true
  );

CREATE POLICY "Users can insert their own items"
  ON public.items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND auth.uid() = responsible_user_id
  );

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);

-- Categories Policies
-- =============================================

CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Item Categories (Junction Table) Policies
-- =============================================

CREATE POLICY "Users can view item categories for their items"
  ON public.item_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_categories.item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage item categories for their items"
  ON public.item_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_categories.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete item categories for their items"
  ON public.item_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_categories.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Event Details Policies
-- =============================================

CREATE POLICY "Users can view event details for their items or public items"
  ON public.event_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = event_details.item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage event details for their items"
  ON public.event_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = event_details.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Reminder Details Policies
-- =============================================

CREATE POLICY "Users can view reminder details for their items or public items"
  ON public.reminder_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = reminder_details.item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage reminder details for their items"
  ON public.reminder_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = reminder_details.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Subtasks Policies
-- =============================================

CREATE POLICY "Users can view subtasks for their items or public items"
  ON public.subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = subtasks.parent_item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage subtasks for their items"
  ON public.subtasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = subtasks.parent_item_id
      AND items.user_id = auth.uid()
    )
  );

-- Recurrence Rules Policies
-- =============================================

CREATE POLICY "Users can view recurrence rules for their items or public items"
  ON public.recurrence_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = recurrence_rules.item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage recurrence rules for their items"
  ON public.recurrence_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = recurrence_rules.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Recurrence Exceptions Policies
-- =============================================

CREATE POLICY "Users can view recurrence exceptions for their rules"
  ON public.recurrence_exceptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recurrence_rules
      JOIN public.items ON items.id = recurrence_rules.item_id
      WHERE recurrence_rules.id = recurrence_exceptions.rule_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage recurrence exceptions for their rules"
  ON public.recurrence_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recurrence_rules
      JOIN public.items ON items.id = recurrence_rules.item_id
      WHERE recurrence_rules.id = recurrence_exceptions.rule_id
      AND items.user_id = auth.uid()
    )
  );

-- Alerts Policies
-- =============================================

CREATE POLICY "Users can view alerts for their items"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = alerts.item_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage alerts for their items"
  ON public.alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = alerts.item_id
      AND items.user_id = auth.uid()
    )
  );

-- Snoozes Policies
-- =============================================

CREATE POLICY "Users can view snoozes for their alerts"
  ON public.snoozes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      JOIN public.items ON items.id = alerts.item_id
      WHERE alerts.id = snoozes.alert_id
      AND items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage snoozes for their alerts"
  ON public.snoozes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      JOIN public.items ON items.id = alerts.item_id
      WHERE alerts.id = snoozes.alert_id
      AND items.user_id = auth.uid()
    )
  );

-- Attachments Policies
-- =============================================

CREATE POLICY "Users can view attachments for their items or public items"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = attachments.item_id
      AND (items.user_id = auth.uid() OR items.is_public = true)
    )
  );

CREATE POLICY "Users can manage attachments for their items"
  ON public.attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = attachments.item_id
      AND items.user_id = auth.uid()
    )
  );

-- =============================================
-- Helper Functions
-- =============================================

-- Function to auto-set timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subtasks
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_alerts
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Indexes for Performance
-- =============================================

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_priority ON public.items(priority);
CREATE INDEX IF NOT EXISTS idx_items_archived_at ON public.items(archived_at);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- Item categories indexes
CREATE INDEX IF NOT EXISTS idx_item_categories_item_id ON public.item_categories(item_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_category_id ON public.item_categories(category_id);

-- Event details indexes
CREATE INDEX IF NOT EXISTS idx_event_details_start_at ON public.event_details(start_at);
CREATE INDEX IF NOT EXISTS idx_event_details_end_at ON public.event_details(end_at);

-- Reminder details indexes
CREATE INDEX IF NOT EXISTS idx_reminder_details_due_at ON public.reminder_details(due_at);
CREATE INDEX IF NOT EXISTS idx_reminder_details_completed_at ON public.reminder_details(completed_at);

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_item_id ON public.subtasks(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON public.subtasks(order_index);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_item_id ON public.alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_alerts_trigger_at ON public.alerts(trigger_at);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(active);

-- =============================================
-- Done!
-- =============================================
-- Run this SQL in your Supabase SQL Editor
-- All policies, triggers, and indexes are now set up
