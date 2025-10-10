// Seed data for demo purposes
import { Item } from "@/types";

export const seedItems: Item[] = [
  {
    id: crypto.randomUUID(),
    type: "reminder",
    title: "Pay bills",
    notes: "Electric and water bills due",
    categories: ["home", "finance"],
    priority: "high",
    due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    type: "event",
    title: "Standup",
    notes: "Daily team standup meeting",
    categories: ["work"],
    priority: "normal",
    start_at: (() => {
      const d = new Date();
      const nextMonday = new Date(d);
      nextMonday.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday.toISOString();
    })(),
    end_at: (() => {
      const d = new Date();
      const nextMonday = new Date(d);
      nextMonday.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      nextMonday.setHours(9, 30, 0, 0);
      return nextMonday.toISOString();
    })(),
    all_day: false,
    recurrence: {
      preset: "weekly",
      custom: {
        interval: 1,
        byWeekday: ["Mon"],
      },
    },
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    type: "todo",
    title: "Grocery shopping",
    notes: "Milk, eggs, bread",
    categories: ["home"],
    priority: "normal",
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    type: "reminder",
    title: "Call dentist",
    notes: "Schedule annual checkup",
    categories: ["health"],
    priority: "low",
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    type: "event",
    title: "Team lunch",
    notes: "Quarterly team gathering",
    categories: ["work", "social"],
    priority: "normal",
    start_at: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
      return d.toISOString();
    })(),
    end_at: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(13, 30, 0, 0);
      return d.toISOString();
    })(),
    all_day: false,
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    type: "todo",
    title: "Submit report",
    notes: "Q4 financial report",
    categories: ["work"],
    priority: "urgent",
    due_at: (() => {
      const d = new Date();
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    })(),
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
