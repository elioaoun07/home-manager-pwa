-- Check if there are any notes in the database
SELECT 
  id,
  type,
  title,
  status,
  created_at
FROM items
WHERE type = 'note'
  AND archived_at IS NULL
ORDER BY created_at DESC;
