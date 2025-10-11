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
  const { categories, subtasks, event_details, reminder_details, ...itemFields } = itemData as Partial<ItemWithDetails>;

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
  isArchived?: boolean;
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
      alerts (*),
      item_categories (
        category:categories (*)
      )
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
  if (filters?.isArchived !== undefined) {
    if (filters.isArchived) {
      query = query.not('archived_at', 'is', null);
    } else {
      query = query.is('archived_at', null);
    }
  } else {
    // Default: exclude archived items
    query = query.is('archived_at', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Transform the data to flatten categories
  const transformed = (data || []).map((item) => {
    // With explicit FK relationship, event_details/reminder_details come as objects, not arrays
    return {
      ...item,
      categories: item.item_categories?.map((ic: { category: Category }) => ic.category).filter(Boolean) || [],
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
      alerts (*),
      attachments (*),
      item_categories (
        category:categories (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Transform the data (explicit FK returns objects, not arrays)
  return {
    ...data,
    categories: data.item_categories?.map((ic: { category: unknown }) => ic.category).filter(Boolean) || [],
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
  const { categories, subtasks, event_details, reminder_details, ...itemFields } = updates as Partial<ItemWithDetails>;

  const { data, error } = await supabase
    .from('items')
    .update({
      ...itemFields,
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

// Event Details
export async function upsertEventDetails(data: EventDetails): Promise<EventDetails> {
  const { data: result, error } = await supabase
    .from('event_details')
    .upsert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

// Reminder Details
export async function upsertReminderDetails(data: ReminderDetails): Promise<ReminderDetails> {
  const { data: result, error } = await supabase
    .from('reminder_details')
    .upsert(data)
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
