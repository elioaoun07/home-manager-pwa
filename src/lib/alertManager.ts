/**
 * Alert Management for Events
 * Use this to add/manage reminders for events
 */

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

export type AlertKind = 'absolute' | 'relative' | 'recurring';
export type AlertRelativeTo = 'event_start' | 'event_end' | 'due_date' | 'created_at';
export type AlertChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface Alert {
  id: string;
  item_id: string;
  kind: AlertKind;
  trigger_at: string;
  offset_minutes: number | null;
  relative_to: AlertRelativeTo | null;
  repeat_every_minutes: number | null;
  max_repeats: number | null;
  channel: AlertChannel;
  active: boolean;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertPreset {
  offset_minutes: number;
  channel: AlertChannel;
  label?: string;
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

export const ALERT_PRESETS: Record<string, AlertPreset[]> = {
  standard: [
    { offset_minutes: 30, channel: 'push', label: '30 minutes before' },
    { offset_minutes: 1440, channel: 'push', label: '1 day before' }
  ],
  important: [
    { offset_minutes: 10080, channel: 'email', label: '1 week before' },
    { offset_minutes: 1440, channel: 'push', label: '1 day before' },
    { offset_minutes: 60, channel: 'push', label: '1 hour before' },
    { offset_minutes: 15, channel: 'push', label: '15 minutes before' }
  ],
  minimal: [
    { offset_minutes: 15, channel: 'push', label: '15 minutes before' }
  ],
  daily: [
    { offset_minutes: 1440, channel: 'push', label: '1 day before' }
  ],
  weekly: [
    { offset_minutes: 10080, channel: 'email', label: '1 week before' }
  ]
};

// Common offset options for UI
export const OFFSET_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' }
];

// ============================================
// ALERT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Add alerts using a preset configuration
 */
export async function addPresetAlerts(
  itemId: string,
  eventStart: Date,
  presetName: keyof typeof ALERT_PRESETS = 'standard'
) {
  const { error } = await supabase.rpc('add_preset_alerts', {
    p_item_id: itemId,
    p_event_start: eventStart.toISOString(),
    p_preset_name: presetName
  });

  if (error) throw error;
}

/**
 * Add a single alert to an event
 */
export async function addSingleAlert(
  itemId: string,
  offsetMinutes: number,
  relativeTo: AlertRelativeTo = 'event_start',
  channel: AlertChannel = 'push'
) {
  const { data, error } = await supabase.rpc('add_single_alert', {
    p_item_id: itemId,
    p_offset_minutes: offsetMinutes,
    p_relative_to: relativeTo,
    p_channel: channel
  });

  if (error) throw error;
  return data;
}

/**
 * Add multiple custom alerts
 */
export async function addMultipleAlerts(
  itemId: string,
  eventStart: Date,
  alerts: AlertPreset[]
) {
  // First, delete existing alerts
  await deleteAllAlerts(itemId);

  // Then add new ones
  const promises = alerts.map(alert => {
    const triggerAt = new Date(eventStart.getTime() - alert.offset_minutes * 60000);
    
    return supabase.from('alerts').insert({
      item_id: itemId,
      kind: 'relative',
      offset_minutes: alert.offset_minutes,
      relative_to: 'event_start',
      trigger_at: triggerAt.toISOString(),
      channel: alert.channel,
      active: true
    });
  });

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw new Error(`Failed to add ${errors.length} alerts`);
  }
}

/**
 * Get all alerts for an item
 */
export async function getItemAlerts(itemId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('item_id', itemId)
    .order('offset_minutes', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete all alerts for an item
 */
export async function deleteAllAlerts(itemId: string) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('item_id', itemId);

  if (error) throw error;
}

/**
 * Delete a specific alert
 */
export async function deleteAlert(alertId: string) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw error;
}

/**
 * Update alert active status
 */
export async function toggleAlert(alertId: string, active: boolean) {
  const { error } = await supabase
    .from('alerts')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) throw error;
}

/**
 * Get upcoming alerts for user
 */
export async function getUpcomingAlerts() {
  const { data, error } = await supabase
    .from('v_upcoming_alerts')
    .select('*')
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Save alarms from AlarmPicker component
 */
export async function saveAlarms(
  itemId: string,
  eventStart: Date,
  alarms: Array<{
    type: 'relative' | 'absolute';
    offset_minutes?: number;
    absolute_time?: string;
    channel: AlertChannel;
  }>
) {
  // Delete existing alerts first
  await deleteAllAlerts(itemId);

  if (alarms.length === 0) return;

  // Insert new alerts
  const alertsToInsert = alarms.map(alarm => {
    if (alarm.type === 'relative' && alarm.offset_minutes !== undefined) {
      // Relative alarm: calculate trigger_at based on offset
      const triggerAt = new Date(eventStart.getTime() - alarm.offset_minutes * 60000);
      return {
        item_id: itemId,
        kind: 'relative' as AlertKind,
        offset_minutes: alarm.offset_minutes,
        relative_to: 'event_start' as AlertRelativeTo,
        trigger_at: triggerAt.toISOString(),
        channel: alarm.channel,
        active: true
      };
    } else if (alarm.type === 'absolute' && alarm.absolute_time) {
      // Absolute alarm: use the specified datetime
      return {
        item_id: itemId,
        kind: 'absolute' as AlertKind,
        offset_minutes: null,
        relative_to: null,
        trigger_at: new Date(alarm.absolute_time).toISOString(),
        channel: alarm.channel,
        active: true
      };
    }
    return null;
  }).filter(Boolean);

  if (alertsToInsert.length > 0) {
    const { error } = await supabase.from('alerts').insert(alertsToInsert);
    if (error) throw error;
  }
}

/**
 * Format offset minutes to human-readable string
 */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return 'At time of event';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} before`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} before`;
  }
  if (minutes < 10080) {
    const days = Math.floor(minutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''} before`;
  }
  const weeks = Math.floor(minutes / 10080);
  return `${weeks} week${weeks !== 1 ? 's' : ''} before`;
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Create event with standard alerts
const item = await createItem({
  title: "Visit parent's house",
  type: 'event',
  // ... other fields
});

const eventDetails = await createEventDetails({
  item_id: item.id,
  start_at: new Date('2025-10-25T18:00:00'),
  end_at: new Date('2025-10-25T21:00:00')
});

// Add standard alerts (30 mins, 1 day before)
await addPresetAlerts(item.id, new Date('2025-10-25T18:00:00'), 'standard');


// Example 2: Add custom alerts
await addMultipleAlerts(item.id, new Date('2025-10-25T18:00:00'), [
  { offset_minutes: 30, channel: 'push' },
  { offset_minutes: 1440, channel: 'email' },
  { offset_minutes: 10080, channel: 'push' }
]);


// Example 3: Get and display alerts
const alerts = await getItemAlerts(item.id);
alerts.forEach(alert => {
  console.log(`Alert: ${formatOffset(alert.offset_minutes)} via ${alert.channel}`);
});


// Example 4: View upcoming alerts
const upcoming = await getUpcomingAlerts();
upcoming.forEach(alert => {
  console.log(`${alert.title}: ${formatOffset(alert.offset_minutes)}`);
});
*/
