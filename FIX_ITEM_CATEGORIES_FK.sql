-- ========================================
-- FIX ITEM_CATEGORIES FOREIGN KEY
-- Run this in Supabase SQL Editor
-- ========================================

-- Check if the foreign key constraints exist and add them if missing
DO $$ 
BEGIN
    -- Add foreign key to items if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'item_categories_item_id_fkey' 
        AND table_name = 'item_categories'
    ) THEN
        ALTER TABLE public.item_categories 
        ADD CONSTRAINT item_categories_item_id_fkey 
        FOREIGN KEY (item_id) 
        REFERENCES public.items(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added item_categories_item_id_fkey constraint';
    END IF;
    
    -- Add foreign key to categories if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'item_categories_category_id_fkey' 
        AND table_name = 'item_categories'
    ) THEN
        ALTER TABLE public.item_categories 
        ADD CONSTRAINT item_categories_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES public.categories(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added item_categories_category_id_fkey constraint';
    END IF;
END $$;

-- Verify the foreign keys exist
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
    AND tc.table_name = 'item_categories'
ORDER BY tc.constraint_name;
