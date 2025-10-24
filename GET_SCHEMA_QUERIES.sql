-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This will export your complete database schema
-- Copy the results and save them to a file
-- ============================================

-- 1. GET ALL TABLE DEFINITIONS
SELECT 
  '-- Table: ' || table_name AS info,
  'CREATE TABLE ' || table_name || ' (' || string_agg(
    '  ' || column_name || ' ' || 
    udt_name || 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE 
      WHEN column_default IS NOT NULL 
      THEN ' DEFAULT ' || column_default 
      ELSE '' 
    END,
    ',' || E'\n'
    ORDER BY ordinal_position
  ) || E'\n);' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================

-- 2. GET ALL CONSTRAINTS
SELECT 
  'ALTER TABLE ' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name ||
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
    WHEN 'FOREIGN KEY' THEN 
      ' FOREIGN KEY (' || string_agg(kcu.column_name, ', ') || ') ' ||
      'REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ')' ||
      ' ON DELETE ' || rc.delete_rule ||
      ' ON UPDATE ' || rc.update_rule
    WHEN 'UNIQUE' THEN ' UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
    ELSE ''
  END || ';' as constraint_statement
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, 
         ccu.table_name, ccu.column_name, rc.delete_rule, rc.update_rule
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================

-- 3. GET ALL INDEXES
SELECT indexdef || ';' as index_statement
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- ============================================

-- 4. GET ALL RLS POLICIES  
SELECT 
  'CREATE POLICY ' || policyname || 
  ' ON ' || tablename ||
  ' FOR ' || cmd ||
  ' TO ' || array_to_string(roles, ', ') ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' as policy_statement
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================

-- 5. GET ALL TRIGGERS
SELECT 
  'CREATE TRIGGER ' || trigger_name ||
  ' ' || action_timing || ' ' || event_manipulation ||
  ' ON ' || event_object_table ||
  ' FOR EACH ' || action_orientation ||
  ' ' || action_statement || ';' as trigger_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================

-- 6. GET ALL FUNCTIONS
SELECT 
  'CREATE OR REPLACE FUNCTION ' || routine_name || '() ' ||
  'RETURNS ' || data_type || ' AS $$' || E'\n' ||
  routine_definition || E'\n' ||
  '$$ LANGUAGE ' || external_language || ';' as function_statement
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
