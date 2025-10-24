-- ============================================
-- SUPABASE DATABASE COMPLETE EXPORT
-- Generated on: 2025-10-24T13:55:30.092Z
-- Project: personalAI
-- Reference ID: kqqdbauojjeatvftxluz
-- ============================================


-- ============================================
-- TABLE: items
-- ============================================

-- Table is empty


-- ============================================
-- TABLE: item_categories
-- ============================================

-- Table is empty


-- ============================================
-- TABLE: categories
-- ============================================

-- Table is empty


-- ============================================
-- TABLE: alerts
-- ============================================

-- Table is empty


-- ============================================
-- TABLE: holidays
-- ============================================

-- Error accessing table holidays: Could not find the table 'public.holidays' in the schema cache

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Note: RLS policies are managed through Supabase dashboard
-- Check the SQL migration files:
--   - supabase-rls-policies.sql
--   - FINAL_RLS_FIX.sql


-- ============================================
-- KNOWN RELATIONSHIPS & CONSTRAINTS
-- ============================================

-- items table:
--   Primary Key: id (uuid)
--   Foreign Key: user_id -> auth.users(id)
--   Columns: id, title, description, date, type, is_recurring, recurrence_rule, 
--            category, completed, created_at, updated_at, user_id, time, notes, priority

-- item_categories table:
--   Primary Key: id (uuid)
--   Foreign Key: item_id -> items(id) ON DELETE CASCADE
--   Foreign Key: category_id -> categories(id) ON DELETE CASCADE
--   Columns: id, item_id, category_id, created_at

-- categories table:
--   Primary Key: id (uuid)
--   Foreign Key: user_id -> auth.users(id)
--   Columns: id, name, color, icon, user_id, created_at, is_public

-- alerts table:
--   Primary Key: id (uuid)
--   Foreign Key: item_id -> items(id) ON DELETE CASCADE
--   Columns: id, item_id, alert_time, created_at

-- holidays table:
--   Primary Key: id (uuid)
--   Foreign Key: user_id -> auth.users(id)
--   Columns: id, user_id, date, title, description, country_code, is_custom, created_at


-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at triggers:
--   Each table with updated_at column has a trigger to automatically update the timestamp


-- ============================================
-- INDEXES (Known)
-- ============================================

-- Performance indexes on:
--   items.user_id
--   items.date
--   categories.user_id
--   alerts.item_id
--   holidays.user_id
--   holidays.date

