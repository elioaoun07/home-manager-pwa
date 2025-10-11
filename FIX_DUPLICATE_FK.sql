-- Remove duplicate foreign keys that are causing Supabase query errors

-- Check which foreign keys exist (run this first to see what you have)
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as foreign_table
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('event_details', 'reminder_details')
ORDER BY conrelid::regclass::text;

-- Drop the duplicate foreign keys (keep only the _fkey ones)
ALTER TABLE event_details DROP CONSTRAINT IF EXISTS event_details_item_fk;
ALTER TABLE reminder_details DROP CONSTRAINT IF EXISTS reminder_details_item_fk;

-- If you need to keep the other ones instead, use these:
-- ALTER TABLE event_details DROP CONSTRAINT IF EXISTS event_details_item_id_fkey;
-- ALTER TABLE reminder_details DROP CONSTRAINT IF EXISTS reminder_details_item_id_fkey;
