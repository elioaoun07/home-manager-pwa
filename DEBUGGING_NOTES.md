# Debugging Notes Not Showing

## Quick Checks

### 1. Check Browser Console
Open your app and navigate to the Notes tab. Open browser DevTools (F12) and look for:
```
NotesView - All items count: X
NotesView - Filtered notes: Y [array of notes]
```

This will tell you:
- **If items are loading at all** (All items count should be > 0)
- **If notes exist** (Filtered notes should show your notes)

### 2. Check Database Directly

Run this query in Supabase SQL Editor:

```sql
-- Check if notes exist
SELECT 
  id,
  user_id,
  type,
  title,
  status,
  created_at,
  archived_at
FROM items
WHERE type = 'note'
ORDER BY created_at DESC;
```

**Expected Result:** You should see notes that were converted from reminders or newly created.

### 3. Check if Migration Ran

```sql
-- Verify the enum has 'note' type
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'item_type_enum'::regtype
ORDER BY enumsortorder;
```

**Expected Result:** Should show 'event', 'reminder', 'note'

### 4. Check Conversion Results

```sql
-- See what was converted
SELECT 
  i.id,
  i.type,
  i.title,
  i.status,
  r.due_at
FROM items i
LEFT JOIN reminder_details r ON i.id = r.item_id
WHERE i.type = 'note'
  AND i.archived_at IS NULL;
```

**Expected Result:** Notes should have `due_at = NULL` or no reminder_details row

## Common Issues & Solutions

### Issue 1: No Notes in Database

**Symptom:** Console shows `Filtered notes: 0`

**Solution:** 
1. Check if the migration actually converted any reminders:
   ```sql
   -- Were there reminders without due_at?
   SELECT COUNT(*) 
   FROM items i
   LEFT JOIN reminder_details r ON i.id = r.item_id
   WHERE i.type = 'reminder'
     AND (r.due_at IS NULL OR r.item_id IS NULL);
   ```

2. If no reminders existed without dates, **create a test note manually**:
   ```sql
   INSERT INTO items (user_id, type, title, description, priority, status, is_public, responsible_user_id)
   VALUES (
     (SELECT id FROM auth.users LIMIT 1),  -- Your user ID
     'note',
     'Test Note',
     'This is a test note to verify the system works',
     'normal',
     'pending',
     false,
     (SELECT id FROM auth.users LIMIT 1)
   );
   ```

### Issue 2: Notes Exist But Not Showing

**Symptom:** SQL shows notes but UI doesn't

**Check:**
1. **User authentication:** Are you logged in as the same user?
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. **RLS Policies:** Make sure RLS allows reading notes
   ```sql
   -- Check RLS policies
   SELECT * FROM items WHERE type = 'note';
   ```
   If this works in SQL editor but not in app, it's an RLS issue.

3. **Archived status:** Notes might be archived
   ```sql
   SELECT COUNT(*) FROM items 
   WHERE type = 'note' AND archived_at IS NOT NULL;
   ```

4. **Status filter:** Check the status
   ```sql
   SELECT status, COUNT(*) 
   FROM items 
   WHERE type = 'note' 
   GROUP BY status;
   ```

### Issue 3: Wrong Status

**Symptom:** Notes exist but have status other than 'pending'

**Solution:**
```sql
-- Update notes to pending status
UPDATE items
SET status = 'pending'
WHERE type = 'note'
  AND status != 'pending';
```

## Create a Test Note via UI

1. Open the app
2. Click the FAB (+) button
3. Select **Note** type (orange gradient)
4. Fill in:
   - Title: "My First Note"
   - Description: "Testing the note system"
   - Priority: Normal
   - Category: Personal
5. Click "Create Item"
6. Navigate to Notes tab
7. You should see your note!

## Verify Note Creation in Code

Add this temporary logging to see what's being created:

In `src/app/page.tsx`, add this after line 290 (after createItem):

```typescript
console.log('Created item:', newItem);
console.log('Item type:', newItem.type);
console.log('Item status:', newItem.status);
```

## Expected Behavior

### What Should Show in Notes View:
- ✅ Items with `type = 'note'`
- ✅ Items with `status = 'pending'` or `status = 'cancelled'`
- ✅ Items NOT archived (`archived_at IS NULL`)
- ✅ Items belonging to current user (RLS handles this)

### What Should NOT Show:
- ❌ Reminders (even without due dates)
- ❌ Events
- ❌ Notes with `status = 'done'` (these go to "Completed" section)
- ❌ Archived notes

## Final Verification Checklist

- [ ] Migration applied (check migrations table)
- [ ] Enum includes 'note' type
- [ ] At least one note exists in database
- [ ] Note has status = 'pending'
- [ ] Note is not archived
- [ ] You're logged in as the correct user
- [ ] Browser console shows filtered notes
- [ ] Notes tab displays the note

## If Still Not Working

1. **Clear browser cache and reload**
2. **Check for JavaScript errors in console**
3. **Verify Supabase connection:**
   ```typescript
   // In browser console
   localStorage.getItem('supabase.auth.token')
   ```
4. **Check network tab** - Are API calls to Supabase succeeding?
5. **Restart development server** (if using local dev)

## Quick Fix: Force Reload Everything

```typescript
// In browser console
window.location.reload(true);
```

Or just hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
