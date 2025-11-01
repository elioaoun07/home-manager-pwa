import { supabase, getCurrentUser } from './supabase';
import type { 
  Item, 
  ItemWithDetails, 
  Category, 
  Subtask,
  EventDetails,
  ReminderDetails,
  Alert,
  RecurrenceRule
} from '@/types';

// Items
export async function createItem(itemData: Partial<Item>): Promise<Item> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Remove fields that don't belong to the items table
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories, subtasks, event_details, reminder_details, alarms, eventStartTime, alerts, recurrence_rule, attachments, ...itemFields } = itemData as Partial<ItemWithDetails> & { alarms?: unknown; eventStartTime?: unknown };

  const { data, error } = await supabase
    .from('items')
    .insert({
      ...itemFields,
      user_id: user.id,
      responsible_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getItems(filters?: {
  types?: string[];
  priorities?: string[];
  statuses?: string[];
  categoryIds?: string[];
  isArchived?: boolean | 'all';
}): Promise<ItemWithDetails[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('items')
    .select(`
      *,
      event_details!event_details_item_id_fkey (*),
      reminder_details!reminder_details_item_id_fkey (*),
      subtasks (*),
      recurrence_rules (*),
      alerts (*)
    `);

  // Apply filters
  if (filters?.types && filters.types.length > 0) {
    query = query.in('type', filters.types);
  }
  if (filters?.priorities && filters.priorities.length > 0) {
    query = query.in('priority', filters.priorities);
  }
  if (filters?.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }
  
  // Handle archived filter
  // 'all' = show both archived and non-archived
  // true = show only archived
  // false = show only non-archived
  // undefined = default to non-archived only
  if (filters?.isArchived === 'all') {
    // Don't filter by archived_at - show everything
  } else if (filters?.isArchived === true) {
    query = query.not('archived_at', 'is', null);
  } else {
    // false or undefined - exclude archived items
    query = query.is('archived_at', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch categories separately for each item
  const itemIds = (data || []).map(item => item.id);
  
  const itemCategoriesMap: Record<string, Category[]> = {};
  
  if (itemIds.length > 0) {
    const { data: itemCategoriesData } = await supabase
      .from('item_categories')
      .select(`
        item_id,
        category:categories (*)
      `)
      .in('item_id', itemIds);
    
    // Build a map of item_id -> categories[]
    if (itemCategoriesData) {
      itemCategoriesData.forEach((ic: { item_id: string; category: Category | Category[] }) => {
        if (!itemCategoriesMap[ic.item_id]) {
          itemCategoriesMap[ic.item_id] = [];
        }
        // category comes as an array from the join, get first element
        const category = Array.isArray(ic.category) ? ic.category[0] : ic.category;
        if (category) {
          itemCategoriesMap[ic.item_id].push(category);
        }
      });
    }
  }

  // Transform the data
  const transformed = (data || []).map((item) => {
    return {
      ...item,
      categories: itemCategoriesMap[item.id] || [],
      event_details: item.event_details || undefined,
      reminder_details: item.reminder_details || undefined,
      recurrence_rule: item.recurrence_rules?.[0] || undefined,
    };
  });
  
  return transformed;
}

export async function getItemById(id: string): Promise<ItemWithDetails | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      event_details!event_details_item_id_fkey (*),
      reminder_details!reminder_details_item_id_fkey (*),
      subtasks (*),
      recurrence_rules (*),
      attachments (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Fetch categories separately
  const { data: itemCategoriesData } = await supabase
    .from('item_categories')
    .select(`
      category:categories (*)
    `)
    .eq('item_id', id);

  const categories: Category[] = [];
  if (itemCategoriesData) {
    itemCategoriesData.forEach((ic: { category: Category | Category[] }) => {
      const category = Array.isArray(ic.category) ? ic.category[0] : ic.category;
      if (category) {
        categories.push(category);
      }
    });
  }

  // Transform the data (explicit FK returns objects, not arrays)
  return {
    ...data,
    categories,
    event_details: data.event_details || undefined,
    reminder_details: data.reminder_details || undefined,
    recurrence_rule: data.recurrence_rules?.[0] || undefined,
  };
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Remove fields that don't belong to the items table
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { categories, subtasks, event_details, reminder_details, recurrence_rule, alarms, eventStartTime, alerts, attachments, ...itemFields } = updates as Partial<ItemWithDetails> & { alarms?: unknown; eventStartTime?: unknown };

  // Only include valid Item table fields
  const validItemFields: Partial<Item> = {};
  const validKeys: (keyof Item)[] = [
    'type', 'title', 'description', 'priority', 'status', 
    'metadata_json', 'is_public', 'archived_at'
  ];

  validKeys.forEach(key => {
    if (key in itemFields && itemFields[key as keyof typeof itemFields] !== undefined) {
      (validItemFields as Record<string, unknown>)[key] = itemFields[key as keyof typeof itemFields];
    }
  });

  const { data, error } = await supabase
    .from('items')
    .update({
      ...validItemFields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function archiveItem(id: string): Promise<Item> {
  return updateItem(id, { archived_at: new Date().toISOString() });
}

export async function unarchiveItem(id: string): Promise<Item> {
  return updateItem(id, { archived_at: undefined });
}

// Auto-archive completed items based on type-specific rules
export async function autoArchiveOldCompletedItems(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999); // End of yesterday

  // Rule 1: Archive notes completed more than 1 week ago
  const { data: notesToArchive, error: notesError } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'note')
    .eq('status', 'done')
    .is('archived_at', null)
    .lt('updated_at', oneWeekAgo.toISOString());

  if (notesError) throw notesError;

  // Rule 2: Archive events and reminders completed before today (completed yesterday or earlier)
  const { data: eventsRemindersToArchive, error: eventsError } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', user.id)
    .in('type', ['event', 'reminder'])
    .eq('status', 'done')
    .is('archived_at', null)
    .lt('updated_at', yesterday.toISOString());

  if (eventsError) throw eventsError;

  // Combine all items to archive
  const allItemsToArchive = [
    ...(notesToArchive || []),
    ...(eventsRemindersToArchive || [])
  ];

  if (allItemsToArchive.length === 0) return 0;

  const itemIds = allItemsToArchive.map(item => item.id);

  // Archive them
  const { error: updateError } = await supabase
    .from('items')
    .update({ archived_at: new Date().toISOString() })
    .in('id', itemIds);

  if (updateError) throw updateError;
  
  return allItemsToArchive.length;
}

// Event Details
export async function upsertEventDetails(data: Partial<EventDetails> & { item_id: string }): Promise<EventDetails> {
  // Clean the data to only include valid EventDetails fields
  const eventData: Partial<EventDetails> & { item_id: string } = {
    item_id: data.item_id,
    start_at: data.start_at!,
    end_at: data.end_at!,
    all_day: data.all_day ?? false,
    location_text: data.location_text,
  };

  // Remove undefined fields
  Object.keys(eventData).forEach(key => {
    if (eventData[key as keyof typeof eventData] === undefined) {
      delete eventData[key as keyof typeof eventData];
    }
  });

  const { data: result, error } = await supabase
    .from('event_details')
    .upsert(eventData, {
      onConflict: 'item_id'
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Reminder Details
export async function upsertReminderDetails(data: Partial<ReminderDetails> & { item_id: string }): Promise<ReminderDetails> {
  // Clean the data to only include valid ReminderDetails fields
  const reminderData: Partial<ReminderDetails> & { item_id: string } = {
    item_id: data.item_id,
    due_at: data.due_at,
    completed_at: data.completed_at,
    estimate_minutes: data.estimate_minutes,
    has_checklist: data.has_checklist ?? false,
  };

  // Remove undefined fields
  Object.keys(reminderData).forEach(key => {
    if (reminderData[key as keyof typeof reminderData] === undefined) {
      delete reminderData[key as keyof typeof reminderData];
    }
  });

  const { data: result, error } = await supabase
    .from('reminder_details')
    .upsert(reminderData, {
      onConflict: 'item_id'
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Subtasks
export async function createSubtask(subtask: Omit<Subtask, 'id' | 'created_at' | 'updated_at'>): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert(subtask)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleSubtask(id: string, done: boolean): Promise<Subtask> {
  return updateSubtask(id, {
    done_at: done ? new Date().toISOString() : undefined,
  });
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true })
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createCategory(name: string, colorHex?: string, position?: number): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      color_hex: colorHex,
      position,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Item-Category associations
export async function addItemCategory(itemId: string, categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('item_categories')
    .insert({
      item_id: itemId,
      category_id: categoryId,
    });

  if (error) throw error;
}

export async function removeItemCategory(itemId: string, categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('item_categories')
    .delete()
    .eq('item_id', itemId)
    .eq('category_id', categoryId);

  if (error) throw error;
}

export async function setItemCategories(itemId: string, categoryIds: string[]): Promise<void> {
  // Remove existing categories
  await supabase
    .from('item_categories')
    .delete()
    .eq('item_id', itemId);

  // Add new categories
  if (categoryIds.length > 0) {
    const { error } = await supabase
      .from('item_categories')
      .insert(categoryIds.map(categoryId => ({
        item_id: itemId,
        category_id: categoryId,
      })));

    if (error) throw error;
  }
}

// Recurrence Rules
export async function upsertRecurrenceRule(data: Omit<RecurrenceRule, 'id'>): Promise<RecurrenceRule> {
  const { data: result, error } = await supabase
    .from('recurrence_rules')
    .upsert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteRecurrenceRule(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('recurrence_rules')
    .delete()
    .eq('item_id', itemId);

  if (error) throw error;
}

// Alerts
export async function createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
