# 🔒 Complete RLS Fix Guide

## Problem
You're experiencing RLS (Row Level Security) errors preventing items from being created, updated, or viewed:
```
Failed to load resource: the server responded with a status of 400
Error saving item
```

## Solution Steps

### Step 1: Run the Complete RLS Policy Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `FINAL_RLS_FIX.sql` from your project root
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

This script will:
- ✅ Enable RLS on all 9 tables
- ✅ Drop any existing conflicting policies
- ✅ Create comprehensive policies for SELECT, INSERT, UPDATE, DELETE operations
- ✅ Ensure users can only access their own data OR public items

### Step 2: Verify Policies Are Active

Run this query in Supabase SQL Editor:

```sql
SELECT 
  tablename, 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;
```

You should see 4 policies per table (SELECT, INSERT, UPDATE, DELETE).

### Step 3: Test Your Application

1. Clear your browser cache and cookies
2. Log out and log back in
3. Try creating a new event or reminder
4. Verify items appear in your views

## What the RLS Policies Do

### Items Table
- **SELECT**: Users can see their own items OR public items
- **INSERT**: Users can only create items for themselves
- **UPDATE/DELETE**: Users can only modify their own items

### Related Tables (event_details, reminder_details, subtasks, etc.)
- **SELECT**: Users can see details for items they have access to
- **INSERT/UPDATE/DELETE**: Users can only modify details for their own items

### Categories Table
- Users can only see and manage their own categories

## Common Issues & Fixes

### Issue 1: "new row violates row-level security policy"
**Cause**: Trying to insert data that doesn't match the policy
**Fix**: Ensure `user_id` is set to the authenticated user's ID

### Issue 2: "No rows returned" when fetching items
**Cause**: Policies might not be allowing SELECT
**Fix**: Re-run the FINAL_RLS_FIX.sql script

### Issue 3: Can't see categories
**Cause**: Category policies might be missing
**Fix**: The script includes comprehensive category policies

## Testing Checklist

After running the script, test these operations:

- [ ] Create a new reminder
- [ ] Create a new event with location
- [ ] Edit an existing item
- [ ] Delete an item
- [ ] Mark a reminder as complete
- [ ] Add categories to an item
- [ ] View items in Today view
- [ ] View items in Upcoming view
- [ ] View items in Calendar view
- [ ] Create a public item and verify it's visible to others

## Database Security Notes

1. **RLS is REQUIRED** - Never disable RLS in production
2. **User Authentication** - All policies require `auth.uid()` to be present
3. **Public Items** - Items marked as `is_public = true` are visible to all authenticated users
4. **Private Data** - All other data is strictly user-scoped

## Support

If you still encounter issues after running the script:

1. Check the browser console for specific error messages
2. Check Supabase logs: Dashboard → Logs → API
3. Verify your `.env.local` file has correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Additional Notes

- The script is idempotent - you can run it multiple times safely
- All existing data will remain intact
- Policies use EXISTS clauses for efficient permission checks
- The script includes policies for all 9 tables in your schema

---

**Last Updated**: October 11, 2025
**Status**: Production Ready ✅
