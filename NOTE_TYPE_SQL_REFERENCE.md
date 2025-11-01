# SQL Commands for Note Type Management

## View Current Item Type Distribution

```sql
-- Count items by type
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'done') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending
FROM items
WHERE archived_at IS NULL
GROUP BY type
ORDER BY count DESC;
```

## Find Notes (Quick View)

```sql
-- List all notes
SELECT 
  id,
  title,
  description,
  priority,
  status,
  created_at
FROM items
WHERE type = 'note'
  AND archived_at IS NULL
ORDER BY created_at DESC;
```

## Find Reminders Without Due Dates (Should Be Notes)

```sql
-- Find reminders that should potentially be notes
SELECT 
  i.id,
  i.title,
  i.type,
  r.due_at
FROM items i
LEFT JOIN reminder_details r ON i.id = r.item_id
WHERE i.type = 'reminder'
  AND (r.due_at IS NULL OR r.item_id IS NULL)
  AND i.archived_at IS NULL;
```

## Manual Conversion: Reminder → Note

```sql
-- Convert specific reminder to note
UPDATE items 
SET type = 'note'
WHERE id = 'YOUR-ITEM-ID-HERE'
  AND type = 'reminder';
```

## Manual Conversion: Note → Reminder

```sql
-- Step 1: Convert note to reminder
UPDATE items 
SET type = 'reminder'
WHERE id = 'YOUR-ITEM-ID-HERE'
  AND type = 'note';

-- Step 2: Add reminder details (with due date)
INSERT INTO reminder_details (item_id, due_at, has_checklist)
VALUES (
  'YOUR-ITEM-ID-HERE',
  '2025-11-15 14:00:00+00',  -- Set your due date/time
  false
)
ON CONFLICT (item_id) 
DO UPDATE SET 
  due_at = EXCLUDED.due_at,
  has_checklist = EXCLUDED.has_checklist;
```

## Bulk Operations

### Convert All Reminders Without Due Dates to Notes

```sql
-- Already executed in migration, but can run again if needed
UPDATE items 
SET type = 'note'
WHERE type = 'reminder' 
AND id IN (
  SELECT item_id 
  FROM reminder_details 
  WHERE due_at IS NULL
)
AND archived_at IS NULL;
```

### Find Notes That Should Be Reminders (Have Due Dates)

```sql
-- This shouldn't happen, but checking for data consistency
SELECT 
  i.id,
  i.title,
  i.type,
  r.due_at
FROM items i
INNER JOIN reminder_details r ON i.id = r.item_id
WHERE i.type = 'note'
  AND r.due_at IS NOT NULL
  AND i.archived_at IS NULL;
```

## Cleanup Operations

### Remove Orphaned Reminder Details for Notes

```sql
-- Delete reminder_details for items that are now notes
-- (These are leftover from conversions)
DELETE FROM reminder_details 
WHERE item_id IN (
  SELECT id FROM items WHERE type = 'note'
);
```

### Archive Old Completed Notes

```sql
-- Archive notes completed more than 30 days ago
UPDATE items
SET archived_at = NOW()
WHERE type = 'note'
  AND status = 'done'
  AND created_at < NOW() - INTERVAL '30 days'
  AND archived_at IS NULL;
```

## Statistics and Reports

### Notes Created This Week

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as notes_created
FROM items
WHERE type = 'note'
  AND created_at >= DATE_TRUNC('week', NOW())
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Most Common Note Categories

```sql
SELECT 
  c.name as category,
  COUNT(*) as note_count
FROM items i
INNER JOIN item_categories ic ON i.id = ic.item_id
INNER JOIN categories c ON ic.category_id = c.id
WHERE i.type = 'note'
  AND i.archived_at IS NULL
GROUP BY c.name
ORDER BY note_count DESC
LIMIT 10;
```

### Notes by Priority

```sql
SELECT 
  priority,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM items
WHERE type = 'note'
  AND archived_at IS NULL
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END;
```

## Validation Queries

### Check Enum Values

```sql
-- View all possible item types
SELECT 
  enumlabel as type
FROM pg_enum
WHERE enumtypid = 'item_type_enum'::regtype
ORDER BY enumsortorder;
```

### Verify Migration Success

```sql
-- Should show 'reminder', 'event', 'note'
SELECT 
  type,
  COUNT(*) as count
FROM items
GROUP BY type
ORDER BY count DESC;
```

### Data Integrity Check

```sql
-- Notes should NOT have reminder_details with due_at
-- This query should return 0 rows
SELECT 
  i.id,
  i.title,
  i.type,
  r.due_at
FROM items i
INNER JOIN reminder_details r ON i.id = r.item_id
WHERE i.type = 'note'
  AND r.due_at IS NOT NULL;

-- Notes should NOT have event_details
-- This query should return 0 rows
SELECT 
  i.id,
  i.title,
  i.type
FROM items i
INNER JOIN event_details e ON i.id = e.item_id
WHERE i.type = 'note';
```

## Performance Queries

### Index Usage for Notes

```sql
-- Check if indexes are being used for note queries
EXPLAIN ANALYZE
SELECT * FROM items 
WHERE type = 'note' 
  AND archived_at IS NULL 
ORDER BY created_at DESC 
LIMIT 50;
```

## Backup Before Operations

```sql
-- Create backup of items before bulk operations
CREATE TABLE items_backup_20251101 AS
SELECT * FROM items WHERE type IN ('reminder', 'note');
```

## Rollback (If Needed)

```sql
-- To undo note conversions (restore from backup)
-- Only if you created a backup first!
UPDATE items i
SET type = b.type
FROM items_backup_20251101 b
WHERE i.id = b.id;
```

## Quick Tips

1. **Always filter by `archived_at IS NULL`** unless you want archived items
2. **Use transactions** for bulk operations:
   ```sql
   BEGIN;
   -- Your operations here
   COMMIT; -- or ROLLBACK if something went wrong
   ```
3. **Check row counts** before bulk updates:
   ```sql
   SELECT COUNT(*) FROM items WHERE type = 'note';
   ```
4. **Use LIMIT** when testing queries:
   ```sql
   UPDATE items SET type = 'note' WHERE ... LIMIT 5;
   ```
