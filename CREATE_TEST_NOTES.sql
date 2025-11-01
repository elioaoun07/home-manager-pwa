-- Quick Test: Create a Sample Note
-- Run this in Supabase SQL Editor to create a test note

-- First, get your user ID (copy this for next query)
SELECT id, email FROM auth.users;

-- Then create a test note (replace YOUR_USER_ID with the ID from above)
INSERT INTO items (
  user_id,
  type,
  title,
  description,
  priority,
  status,
  is_public,
  responsible_user_id,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user ID
  'note',
  'Shopping List',
  'Milk, Bread, Eggs, Butter',
  'normal',
  'pending',
  false,
  'YOUR_USER_ID',  -- Replace with your actual user ID
  NOW(),
  NOW()
);

-- Verify it was created
SELECT 
  id,
  type,
  title,
  status,
  created_at
FROM items
WHERE type = 'note'
ORDER BY created_at DESC;

-- If you want to create multiple test notes at once:
INSERT INTO items (
  user_id, type, title, description, priority, status, is_public, responsible_user_id
) VALUES 
  ((SELECT id FROM auth.users LIMIT 1), 'note', 'Grocery List', 'Milk, Bread, Eggs', 'normal', 'pending', false, (SELECT id FROM auth.users LIMIT 1)),
  ((SELECT id FROM auth.users LIMIT 1), 'note', 'Book Ideas', 'Clean Code, Pragmatic Programmer', 'low', 'pending', false, (SELECT id FROM auth.users LIMIT 1)),
  ((SELECT id FROM auth.users LIMIT 1), 'note', 'Gift Ideas', 'Mom - Spa voucher, Dad - Tools', 'normal', 'pending', false, (SELECT id FROM auth.users LIMIT 1)),
  ((SELECT id FROM auth.users LIMIT 1), 'note', 'Random Thoughts', 'Need to organize garage', 'low', 'pending', false, (SELECT id FROM auth.users LIMIT 1)),
  ((SELECT id FROM auth.users LIMIT 1), 'note', 'Urgent Note', 'Call dentist ASAP!', 'urgent', 'pending', false, (SELECT id FROM auth.users LIMIT 1));
