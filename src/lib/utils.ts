// Utility functions
import { Item, ItemWithDetails } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);
  const weeks = Math.floor(absDiff / (86400000 * 7));
  
  // Check if it's today
  const isToday = now.getDate() === date.getDate() &&
                  now.getMonth() === date.getMonth() &&
                  now.getFullYear() === date.getFullYear();
  
  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.getDate() === date.getDate() &&
                      tomorrow.getMonth() === date.getMonth() &&
                      tomorrow.getFullYear() === date.getFullYear();
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.getDate() === date.getDate() &&
                       yesterday.getMonth() === date.getMonth() &&
                       yesterday.getFullYear() === date.getFullYear();
  
  if (isToday) {
    return "Today";
  } else if (isTomorrow) {
    return "Tomorrow";
  } else if (isYesterday) {
    return "Yesterday";
  } else if (diff > 0 && weeks >= 2) {
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (diff > 0 && days >= 2) {
    return `In ${days} day${days > 1 ? 's' : ''}`;
  } else if (diff < 0 && weeks >= 2) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diff < 0 && days >= 2) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(date: Date): string {
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  const timeStr = formatTime(date);
  return `${dateStr} at ${timeStr}`;
}

export function isOverdue(item: Item | ItemWithDetails): boolean {
  if ('status' in item && item.status === 'done') return false;
  
  const now = new Date();
  const itemDate = getItemDate(item);
  
  if (itemDate) {
    return itemDate < now;
  }
  
  return false;
}

export function getItemDate(item: Item | ItemWithDetails): Date | null {
  // Check if it's ItemWithDetails with nested details
  if ('event_details' in item && item.event_details?.start_at) {
    return new Date(item.event_details.start_at);
  } else if ('reminder_details' in item && item.reminder_details?.due_at) {
    return new Date(item.reminder_details.due_at);
  }
  return null;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getTimeOfDay(date: Date): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthData(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const days: Date[] = [];
  
  // Previous month padding
  for (let i = 0; i < startDayOfWeek; i++) {
    const date = new Date(year, month, -startDayOfWeek + i + 1);
    days.push(date);
  }
  
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Next month padding
  const remainingDays = 42 - days.length; // 6 weeks
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
