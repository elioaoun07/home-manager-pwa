-- Update existing reminders without a due_at to be of type 'note'
-- This must be in a separate migration because PostgreSQL requires
-- enum values to be committed before they can be used
UPDATE items 
SET type = 'note'
WHERE type = 'reminder' 
AND id IN (
  SELECT item_id 
  FROM reminder_details 
  WHERE due_at IS NULL
);

-- Optional: Clean up reminder_details for items that are now notes
-- (since notes don't have due dates or reminder-specific fields)
-- Uncomment if you want to clean up the reminder_details table
-- DELETE FROM reminder_details 
-- WHERE item_id IN (
--   SELECT id FROM items WHERE type = 'note'
-- );
