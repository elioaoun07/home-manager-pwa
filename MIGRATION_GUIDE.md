# Migration Guide: Local Storage → Supabase

This guide will help you migrate your existing local storage data to Supabase.

## Step 1: Set Up Supabase

1. **Run the RLS policies SQL**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase-rls-policies.sql`
   - Run the entire script

2. **Verify the setup**:
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

## Step 2: Create Migration Script

Create a file `src/lib/migrate.ts`:

```typescript
import { supabase, getCurrentUser } from './supabase';
import { 
  createItem, 
  createCategory, 
  setItemCategories,
  upsertEventDetails,
  upsertReminderDetails,
  createSubtask
} from './database';

// Old storage interface (adjust to match your current implementation)
interface OldItem {
  id: string;
  type: "reminder" | "todo" | "event";
  title: string;
  notes?: string;
  categories: string[];
  priority: string;
  due_at?: string;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function migrateLocalStorageToSupabase() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🚀 Starting migration...');

    // 1. Get all items from localStorage
    const itemsJson = localStorage.getItem('home-manager-items');
    if (!itemsJson) {
      console.log('No items found in localStorage');
      return { success: true, itemCount: 0 };
    }

    const oldItems: OldItem[] = JSON.parse(itemsJson);
    console.log(`📦 Found ${oldItems.length} items to migrate`);

    // 2. Get/Create categories mapping
    const categoryMap = new Map<string, string>(); // old name -> new id
    const uniqueCategories = new Set<string>();
    
    oldItems.forEach(item => {
      item.categories?.forEach(cat => uniqueCategories.add(cat));
    });

    console.log(`🏷️  Creating ${uniqueCategories.size} categories...`);
    
    for (const categoryName of uniqueCategories) {
      try {
        const category = await createCategory(categoryName);
        categoryMap.set(categoryName, category.id);
        console.log(`  ✓ Created category: ${categoryName}`);
      } catch (error) {
        console.error(`  ✗ Failed to create category: ${categoryName}`, error);
      }
    }

    // 3. Migrate each item
    let successCount = 0;
    let failCount = 0;

    for (const oldItem of oldItems) {
      try {
        // Convert type (todo -> reminder)
        const type = oldItem.type === 'todo' ? 'reminder' : oldItem.type;
        
        // Create base item
        const newItem = await createItem({
          type,
          title: oldItem.title,
          description: oldItem.notes,
          priority: oldItem.priority as any,
          status: oldItem.completed ? 'done' : 'pending',
          is_public: false,
        });

        // Add type-specific details
        if (type === 'event' && oldItem.start_at && oldItem.end_at) {
          await upsertEventDetails({
            item_id: newItem.id,
            start_at: oldItem.start_at,
            end_at: oldItem.end_at,
            all_day: oldItem.all_day || false,
          });
        } else if (type === 'reminder' && oldItem.due_at) {
          await upsertReminderDetails({
            item_id: newItem.id,
            due_at: oldItem.due_at,
            completed_at: oldItem.completed ? oldItem.updated_at : undefined,
            has_checklist: false,
          });
        }

        // Add categories
        if (oldItem.categories && oldItem.categories.length > 0) {
          const categoryIds = oldItem.categories
            .map(cat => categoryMap.get(cat))
            .filter(Boolean) as string[];
          
          if (categoryIds.length > 0) {
            await setItemCategories(newItem.id, categoryIds);
          }
        }

        successCount++;
        console.log(`  ✓ Migrated: ${oldItem.title}`);

      } catch (error) {
        failCount++;
        console.error(`  ✗ Failed to migrate: ${oldItem.title}`, error);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);

    // 4. Backup old data before clearing
    const backup = {
      timestamp: new Date().toISOString(),
      items: oldItems,
    };
    localStorage.setItem('home-manager-backup', JSON.stringify(backup));
    console.log('💾 Backup saved to localStorage as "home-manager-backup"');

    return {
      success: true,
      itemCount: successCount,
      failCount,
      backup,
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

export function clearLocalStorage() {
  const confirmed = confirm(
    'Are you sure you want to clear local storage? ' +
    'Make sure migration was successful first!'
  );
  
  if (confirmed) {
    localStorage.removeItem('home-manager-items');
    console.log('🗑️  Local storage cleared');
  }
}

export function restoreFromBackup() {
  const backupJson = localStorage.getItem('home-manager-backup');
  if (!backupJson) {
    console.log('No backup found');
    return null;
  }

  const backup = JSON.parse(backupJson);
  localStorage.setItem('home-manager-items', JSON.stringify(backup.items));
  console.log('♻️  Restored from backup');
  return backup;
}
```

## Step 3: Create Migration UI

Add a migration button to your settings or admin page:

```tsx
// src/components/MigrationPanel.tsx
"use client";

import { useState } from 'react';
import { 
  migrateLocalStorageToSupabase, 
  clearLocalStorage, 
  restoreFromBackup 
} from '@/lib/migrate';
import { Database, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function MigrationPanel() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const res = await migrateLocalStorageToSupabase();
      setResult(res);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console for details.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-6 glass rounded-2xl border border-white/20">
      <h2 className="text-xl font-bold gradient-text mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Data Migration
      </h2>

      <p className="text-muted-foreground mb-6">
        Migrate your local storage data to Supabase. This will:
      </p>

      <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-1">
        <li>Create all your items in Supabase</li>
        <li>Preserve categories and assignments</li>
        <li>Convert todos to reminders</li>
        <li>Backup existing data</li>
      </ul>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMigrate}
          disabled={migrating}
          className="w-full px-6 py-3 rounded-xl gradient-primary text-white shadow-elevated glow-primary font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {migrating ? (
            <>
              <Database className="w-4 h-4 animate-pulse" />
              Migrating...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Migrate to Supabase
            </>
          )}
        </motion.button>

        {result && (
          <div className="p-4 bg-success/20 text-success rounded-xl">
            <p className="font-medium">✅ Migration Complete!</p>
            <p className="text-sm mt-1">
              Migrated {result.itemCount} items
              {result.failCount > 0 && ` (${result.failCount} failed)`}
            </p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={restoreFromBackup}
          className="w-full px-6 py-3 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Restore from Backup
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearLocalStorage}
          className="w-full px-6 py-3 rounded-xl bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Local Storage
        </motion.button>
      </div>

      <div className="mt-6 p-4 bg-warning/10 rounded-xl">
        <p className="text-sm text-warning font-medium">⚠️ Important:</p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>• Run migration only once</li>
          <li>• Verify data in Supabase before clearing local storage</li>
          <li>• A backup will be saved automatically</li>
          <li>• You can restore from backup if needed</li>
        </ul>
      </div>
    </div>
  );
}
```

## Step 4: Run Migration

1. **Add the migration panel to your app**:
   ```tsx
   // Add to your settings page or create a /migrate page
   import { MigrationPanel } from '@/components/MigrationPanel';
   
   export default function MigratePage() {
     return (
       <div className="max-w-2xl mx-auto p-6">
         <MigrationPanel />
       </div>
     );
   }
   ```

2. **Sign in to your account**

3. **Click "Migrate to Supabase"**

4. **Wait for completion**

5. **Verify your data** in Supabase dashboard

6. **Test the app** to make sure everything works

7. **Clear local storage** (only after verifying!)

## Step 5: Verification Checklist

After migration, verify:

- [ ] All items appear in the app
- [ ] Categories are correct
- [ ] Events have proper start/end times
- [ ] Reminders have due dates
- [ ] Completed items show as "done"
- [ ] Priority levels are preserved
- [ ] Can create new items
- [ ] Can edit existing items
- [ ] Can delete items
- [ ] Categories work correctly

## Rollback Plan

If something goes wrong:

1. **Restore from backup**:
   ```typescript
   restoreFromBackup();
   ```

2. **Delete migrated data from Supabase** (if needed):
   ```sql
   -- In Supabase SQL Editor
   -- ⚠️ CAREFUL: This deletes everything!
   DELETE FROM public.item_categories;
   DELETE FROM public.event_details;
   DELETE FROM public.reminder_details;
   DELETE FROM public.items;
   DELETE FROM public.categories;
   ```

3. **Restart the app** and you'll be back to local storage

## Alternative: Manual Migration

If automated migration doesn't work:

1. **Export your data**:
   ```javascript
   const items = localStorage.getItem('home-manager-items');
   console.log(JSON.parse(items));
   // Copy and save this to a file
   ```

2. **Manually create items** using the new form

3. **Keep local storage** as a backup for a while

## After Successful Migration

1. Remove the migration code (optional)
2. Update your code to only use Supabase
3. Remove localStorage references
4. Celebrate! 🎉

## Troubleshooting

### "User not authenticated"
- Make sure you're signed in
- Check that `getCurrentUser()` works
- Verify Supabase keys in `.env`

### "RLS policy violation"
- Run the RLS policies SQL script
- Check that policies are enabled
- Verify you're the owner of the data

### Items not showing up
- Check browser console for errors
- Verify data in Supabase dashboard
- Check that `getItems()` returns data

### Categories not linking
- Make sure categories were created first
- Check `item_categories` table
- Verify foreign key relationships

---

Need help? Check the console logs - the migration script provides detailed feedback at each step!
