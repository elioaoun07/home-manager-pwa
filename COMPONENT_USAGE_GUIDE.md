# Quick Reference: Using the New Components

## 1. EditFormNew Component

The new `EditFormNew` component replaces the old `EditForm` and supports all database features.

### Basic Usage

```tsx
import { EditFormNew } from '@/components/EditFormNew';
import { getCategories, createItem } from '@/lib/database';

function MyComponent() {
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState<ItemWithDetails | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Load categories when component mounts
    getCategories().then(setCategories);
  }, []);

  const handleSave = async (data: any) => {
    // Create or update item
    const item = await createItem({
      type: data.type,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      is_public: data.is_public,
    });

    // Handle type-specific details
    if (data.type === 'event' && data.event_details) {
      await upsertEventDetails({
        item_id: item.id,
        ...data.event_details,
      });
    }

    if (data.type === 'reminder' && data.reminder_details) {
      await upsertReminderDetails({
        item_id: item.id,
        ...data.reminder_details,
      });
    }

    // Handle categories
    if (data.categories) {
      await setItemCategories(item.id, data.categories);
    }

    // Handle subtasks
    if (data.subtasks) {
      for (const subtask of data.subtasks) {
        await createSubtask({
          parent_item_id: item.id,
          ...subtask,
        });
      }
    }

    setShowForm(false);
  };

  return (
    <>
      <button onClick={() => setShowForm(true)}>
        Add Item
      </button>

      {showForm && (
        <EditFormNew
          item={editingItem}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </>
  );
}
```

## 2. AuthWrapper Component

Wrap your entire app to require authentication.

```tsx
// app/page.tsx
import { AuthWrapper } from '@/components/AuthWrapper';

export default function HomePage() {
  return (
    <AuthWrapper>
      {(user) => (
        <div>
          <h1>Welcome, {user.email}!</h1>
          <YourAppContent />
        </div>
      )}
    </AuthWrapper>
  );
}
```

## 3. Database Functions Quick Reference

### Items

```tsx
// Get all items with filters
const items = await getItems({
  types: ['reminder', 'event'],
  priorities: ['high', 'urgent'],
  statuses: ['pending'],
  isArchived: false,
});

// Get single item with all details
const item = await getItemById('uuid');

// Create item
const newItem = await createItem({
  type: 'reminder',
  title: 'Task',
  priority: 'normal',
  status: 'pending',
  is_public: false,
});

// Update item
await updateItem('uuid', {
  title: 'Updated Title',
  status: 'done',
});

// Archive/Unarchive
await archiveItem('uuid');
await unarchiveItem('uuid');

// Delete permanently
await deleteItem('uuid');
```

### Categories

```tsx
// Get all categories
const categories = await getCategories();

// Create category
const category = await createCategory('Work', '#3B82F6');

// Update category
await updateCategory('uuid', { name: 'Work Projects' });

// Delete category
await deleteCategory('uuid');

// Assign categories to item
await setItemCategories('item-uuid', ['cat-uuid-1', 'cat-uuid-2']);
```

### Subtasks

```tsx
// Create subtask
const subtask = await createSubtask({
  parent_item_id: 'item-uuid',
  title: 'Step 1',
  order_index: 0,
});

// Toggle completion
await toggleSubtask('subtask-uuid', true); // Mark done
await toggleSubtask('subtask-uuid', false); // Mark undone

// Delete subtask
await deleteSubtask('subtask-uuid');
```

### Event Details

```tsx
await upsertEventDetails({
  item_id: 'item-uuid',
  start_at: new Date('2025-01-15T14:00:00').toISOString(),
  end_at: new Date('2025-01-15T15:00:00').toISOString(),
  all_day: false,
  location_text: 'Office',
});
```

### Reminder Details

```tsx
await upsertReminderDetails({
  item_id: 'item-uuid',
  due_at: new Date('2025-01-15T10:00:00').toISOString(),
  estimate_minutes: 30,
  has_checklist: true,
});
```

### Alerts

```tsx
// Create an alert 30 minutes before due time
await createAlert({
  item_id: 'item-uuid',
  kind: 'relative',
  offset_minutes: -30,
  relative_to: 'due',
  channel: 'push',
  active: true,
});

// Create absolute alert
await createAlert({
  item_id: 'item-uuid',
  kind: 'absolute',
  trigger_at: new Date('2025-01-15T09:30:00').toISOString(),
  channel: 'email',
  active: true,
});

// Create nag alert (repeating)
await createAlert({
  item_id: 'item-uuid',
  kind: 'nag',
  repeat_every_minutes: 15,
  max_repeats: 5,
  channel: 'system',
  active: true,
});
```

## 4. Complete Example: Creating a Complex Item

```tsx
async function createMeeting() {
  // 1. Create the event item
  const event = await createItem({
    type: 'event',
    title: 'Quarterly Review',
    description: 'Review Q4 performance and plan Q1',
    priority: 'high',
    status: 'confirmed',
    is_public: false,
  });

  // 2. Add event details
  await upsertEventDetails({
    item_id: event.id,
    start_at: new Date('2025-01-15T14:00:00').toISOString(),
    end_at: new Date('2025-01-15T16:00:00').toISOString(),
    all_day: false,
    location_text: 'Conference Room A',
  });

  // 3. Get or create categories
  const categories = await getCategories();
  const workCat = categories.find(c => c.name === 'Work') 
    || await createCategory('Work', '#3B82F6');
  const meetingsCat = categories.find(c => c.name === 'Meetings')
    || await createCategory('Meetings', '#10B981');

  await setItemCategories(event.id, [workCat.id, meetingsCat.id]);

  // 4. Add alerts
  // Alert 1 day before
  await createAlert({
    item_id: event.id,
    kind: 'relative',
    offset_minutes: -1440, // 24 hours
    relative_to: 'start',
    channel: 'email',
    active: true,
  });

  // Alert 15 minutes before
  await createAlert({
    item_id: event.id,
    kind: 'relative',
    offset_minutes: -15,
    relative_to: 'start',
    channel: 'push',
    active: true,
  });

  return event;
}
```

## 5. Real-time Updates (Optional)

Add real-time subscriptions to get live updates:

```tsx
import { supabase } from '@/lib/supabase';

useEffect(() => {
  // Subscribe to changes
  const channel = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        console.log('Change received!', payload);
        // Refresh your data
        refreshItems();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);
```

## 6. Error Handling

Always wrap database calls in try-catch:

```tsx
async function handleCreateItem(data: any) {
  try {
    const item = await createItem(data);
    toast.success('Item created!');
    return item;
  } catch (error) {
    console.error('Error creating item:', error);
    toast.error('Failed to create item');
    throw error;
  }
}
```

## 7. Field Mapping Reference

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `notes` | `description` | Renamed |
| `completed` | `status: 'done'` | Now uses status enum |
| `categories` (array) | Categories via `item_categories` table | Many-to-many |
| `due_at` | In `reminder_details` table | Separate table |
| `start_at`, `end_at` | In `event_details` table | Separate table |
| N/A | `is_public` | New visibility field |
| N/A | `responsible_user_id` | New assignment field |
| N/A | `archived_at` | Soft delete support |

That's it! You're ready to use the new Supabase-powered system. 🚀
