-- ========================================
-- FIX ALERTS TABLE FOREIGN KEY
-- Run this in Supabase SQL Editor if you're getting alerts schema errors
-- ========================================

-- Check if alerts table exists
DO $$ 
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alerts_item_id_fkey' 
        AND table_name = 'alerts'
    ) THEN
        ALTER TABLE public.alerts 
        ADD CONSTRAINT alerts_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES public.items(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the foreign key exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'alerts';
