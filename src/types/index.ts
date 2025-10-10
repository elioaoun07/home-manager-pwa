// Core data types

export type ItemType = "reminder" | "todo" | "event";

export type Priority = "low" | "normal" | "high" | "urgent";

export type RecurrencePreset = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CustomRecurrence {
  interval: number;
  byWeekday?: string[]; // ["Mon", "Wed", "Fri"]
  byMonthday?: number[]; // [1, 15]
  count?: number; // number of occurrences
  until?: string; // ISO datetime string
}

export interface Recurrence {
  preset: RecurrencePreset;
  custom?: CustomRecurrence;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  notes?: string;
  categories: string[];
  priority: Priority;
  
  // Time fields
  due_at?: string | null; // ISO datetime for reminders/todos
  start_at?: string; // ISO datetime for events
  end_at?: string; // ISO datetime for events
  all_day?: boolean; // for events
  
  recurrence?: Recurrence | null;
  completed: boolean;
  
  created_at: string;
  updated_at: string;
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
  recurrence?: Recurrence;
}

export type ViewType = "today" | "upcoming" | "calendar" | "categories";

export interface FilterState {
  categories: string[];
  priorities: Priority[];
  types: ItemType[];
}
