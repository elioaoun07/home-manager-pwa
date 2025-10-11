# Supabase Integration Guide

## Overview
Your Home Manager PWA has been updated to connect to your Supabase database. The app now supports full database persistence with authentication, categories, subtasks, alerts, and more.

## What's Been Updated

### 1. Environment Variables
The `.env` file now uses the correct Next.js prefix:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your public anonymous key

### 2. Type Definitions (`src/types/index.ts`)
Updated to match your Supabase schema:
- `ItemType`: "reminder" | "event" (removed "todo")
- `ItemStatus`: "pending" | "done" | "cancelled" | "confirmed" | "tentative"
- New types: `Category`, `Subtask`, `Alert`, `EventDetails`, `ReminderDetails`, etc.
- `ItemWithDetails`: Extended type that includes all related data

### 3. New Files Created

#### `src/lib/supabase.ts`
Supabase client configuration with helper functions:
- `supabase` - Main client instance
- `getCurrentUser()` - Get authenticated user
- `isAuthenticated()` - Check auth status

#### `src/lib/database.ts`
Complete database service with functions for:
- **Items**: `createItem()`, `getItems()`, `getItemById()`, `updateItem()`, `deleteItem()`, `archiveItem()`
- **Categories**: `getCategories()`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- **Subtasks**: `createSubtask()`, `updateSubtask()`, `deleteSubtask()`, `toggleSubtask()`
- **Event/Reminder Details**: `upsertEventDetails()`, `upsertReminderDetails()`
- **Alerts**: `createAlert()`, `updateAlert()`, `deleteAlert()`
- **Recurrence**: `upsertRecurrenceRule()`, `deleteRecurrenceRule()`

#### `src/components/AuthWrapper.tsx`
Authentication wrapper component that:
- Handles sign-in/sign-up
- Manages session state
- Shows auth UI when not logged in
- Renders children only when authenticated

#### `src/components/EditFormNew.tsx`
Enhanced edit form with support for:
- **All Item Fields**: title, description, priority, status, visibility (public/private)
- **Event Details**: start/end date/time, all-day toggle, location
- **Reminder Details**: due date/time, time estimate
- **Subtasks**: Add, toggle, delete checklist items
- **Categories**: Multi-select from existing categories
- **Visual Enhancements**: Improved UI with proper spacing and animations

## Database Schema Features

Your Supabase database supports:

### Items Table
- `type`: reminder or event
- `title`, `description`: Text fields
- `priority`: low, normal, high, urgent
- `status`: pending, done, cancelled, confirmed, tentative
- `is_public`: Share items publicly
- `responsible_user_id`: Who's responsible
- `archived_at`: Soft delete with archiving

### Event Details
- `start_at`, `end_at`: Date/time range
- `all_day`: Full day events
- `location_text`: Where it happens

### Reminder Details
- `due_at`: When it's due
- `completed_at`: When it was finished
- `estimate_minutes`: How long it takes
- `has_checklist`: Has subtasks

### Subtasks
- Ordered checklist items
- Track completion with `done_at`
- Reorderable with `order_index`

### Categories
- User-specific tags
- Custom colors with `color_hex`
- Many-to-many relationship with items

### Alerts
- Three types: absolute, relative, nag
- Multiple channels: push, email, system
- Repeatable notifications
- Smart triggers (relative to start/end/due)

### Recurrence Rules
- RRULE format support
- Exception dates
- Override specific occurrences

## How to Use

### 1. Install Dependencies
The Supabase client has already been installed:
```bash
pnpm add @supabase/supabase-js
```

### 2. Update Your Main Page
Wrap your app with `AuthWrapper`:

```tsx
import { AuthWrapper } from '@/components/AuthWrapper';
import { getItems, getCategories } from '@/lib/database';

export default function HomePage() {
  return (
    <AuthWrapper>
      {(user) => (
        <YourAppContent user={user} />
      )}
    </AuthWrapper>
  );
}
```

### 3. Fetch Data
```tsx
// Get all items
const items = await getItems({
  types: ['reminder', 'event'],
  priorities: ['high', 'urgent'],
  isArchived: false
});

// Get categories
const categories = await getCategories();

// Get specific item with all details
const item = await getItemById('uuid');
```

### 4. Create Items
```tsx
// Create a reminder
const newItem = await createItem({
  type: 'reminder',
  title: 'Buy groceries',
  description: 'Need milk, bread, eggs',
  priority: 'normal',
  status: 'pending',
  is_public: false
});

// Add reminder details
await upsertReminderDetails({
  item_id: newItem.id,
  due_at: new Date('2025-01-15T10:00:00').toISOString(),
  estimate_minutes: 30
});

// Add subtasks
await createSubtask({
  parent_item_id: newItem.id,
  title: 'Get milk',
  order_index: 0
});
```

### 5. Create Events
```tsx
const event = await createItem({
  type: 'event',
  title: 'Team Meeting',
  description: 'Quarterly review',
  priority: 'high',
  status: 'confirmed',
  is_public: false
});

await upsertEventDetails({
  item_id: event.id,
  start_at: new Date('2025-01-15T14:00:00').toISOString(),
  end_at: new Date('2025-01-15T15:00:00').toISOString(),
  all_day: false,
  location_text: 'Conference Room A'
});
```

### 6. Manage Categories
```tsx
// Create category
const category = await createCategory('Work', '#3B82F6');

// Assign to item
await setItemCategories(itemId, [category.id]);
```

## Row Level Security (RLS)

⚠️ **Important**: You need to set up RLS policies in Supabase!

Add these policies in the Supabase SQL editor:

```sql
-- Items policies
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items"
  ON public.items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);

-- Repeat similar policies for:
-- - categories
-- - subtasks
-- - event_details
-- - reminder_details
-- - alerts
-- - attachments
```

## Next Steps

1. **Add RLS Policies**: Secure your database
2. **Update Your UI**: Use `EditFormNew` instead of `EditForm`
3. **Migrate Data**: If you have existing local storage data, create a migration script
4. **Add Real-time**: Use Supabase real-time subscriptions for live updates
5. **File Uploads**: Use Supabase Storage for attachments
6. **Push Notifications**: Integrate with the alerts system

## Example: Complete Item Creation Flow

```tsx
async function createCompleteReminder(data: {
  title: string;
  description: string;
  dueDate: string;
  categories: string[];
  subtasks: string[];
}) {
  // 1. Create the item
  const item = await createItem({
    type: 'reminder',
    title: data.title,
    description: data.description,
    priority: 'normal',
    status: 'pending',
    is_public: false
  });

  // 2. Add reminder details
  await upsertReminderDetails({
    item_id: item.id,
    due_at: data.dueDate,
    has_checklist: data.subtasks.length > 0
  });

  // 3. Add categories
  await setItemCategories(item.id, data.categories);

  // 4. Add subtasks
  for (let i = 0; i < data.subtasks.length; i++) {
    await createSubtask({
      parent_item_id: item.id,
      title: data.subtasks[i],
      order_index: i
    });
  }

  // 5. Add an alert (optional)
  await createAlert({
    item_id: item.id,
    kind: 'relative',
    offset_minutes: -30, // 30 min before
    relative_to: 'due',
    channel: 'push',
    active: true
  });

  return item;
}
```

## Testing

1. Start your dev server: `pnpm dev`
2. Sign up with a new account
3. Create some categories
4. Create a reminder with subtasks
5. Create an event
6. Check your Supabase dashboard to see the data

## Troubleshooting

- **Auth errors**: Check your Supabase URL and keys
- **RLS errors**: Make sure policies are set up correctly
- **Type errors**: Run `pnpm build` to check TypeScript errors
- **Data not showing**: Check browser console for errors

Your app is now fully connected to Supabase! 🎉
