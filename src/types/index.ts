// Core data types matching Supabase schema

export type ItemType = "reminder" | "event";

export type Priority = "low" | "normal" | "high" | "urgent";

export type ItemStatus = "pending" | "done" | "cancelled" | "confirmed" | "tentative";

export type AlertKind = "absolute" | "relative" | "nag";

export type AlertRelativeTo = "start" | "end" | "due";

export type AlertChannel = "push" | "email" | "system";

// Database types
export interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color_hex?: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  description?: string;
  priority: Priority;
  status?: ItemStatus;
  metadata_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  is_public: boolean;
  responsible_user_id: string;
}

export interface EventDetails {
  item_id: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location_text?: string;
}

export interface ReminderDetails {
  item_id: string;
  due_at?: string;
  completed_at?: string;
  estimate_minutes?: number;
  has_checklist: boolean;
}

export interface Subtask {
  id: string;
  parent_item_id: string;
  title: string;
  done_at?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  id: string;
  item_id: string;
  rrule: string;
  start_anchor: string;
  end_until?: string;
  count?: number;
}

export interface RecurrenceException {
  id: string;
  rule_id: string;
  exdate: string;
  override_payload_json?: Record<string, any>;
}

export interface Alert {
  id: string;
  item_id: string;
  kind: AlertKind;
  trigger_at?: string;
  offset_minutes?: number;
  relative_to?: AlertRelativeTo;
  repeat_every_minutes?: number;
  max_repeats?: number;
  channel: AlertChannel;
  active: boolean;
  last_fired_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  item_id: string;
  storage_key?: string;
  file_url?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at: string;
}

// Extended types for UI
export interface ItemWithDetails extends Item {
  categories?: Category[];
  event_details?: EventDetails;
  reminder_details?: ReminderDetails;
  subtasks?: Subtask[];
  recurrence_rule?: RecurrenceRule;
  alerts?: Alert[];
  attachments?: Attachment[];
}

export interface ParsedInput {
  title: string;
  type: ItemType;
  priority: Priority;
  categories: string[];
  time?: Date;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  recurrence?: string; // RRULE string
  isPublic?: boolean;
}

export type ViewType = "today" | "upcoming" | "calendar" | "categories";

export interface FilterState {
  categories: string[];
  priorities: Priority[];
  types: ItemType[];
  statuses?: ItemStatus[];
}
