// Utility functions
import { Item } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);
  
  if (absDiff < 60000) {
    return diff < 0 ? "Just now" : "In a moment";
  } else if (minutes < 60) {
    return diff < 0 ? `${minutes}m ago` : `In ${minutes}m`;
  } else if (hours < 24) {
    return diff < 0 ? `${hours}h ago` : `In ${hours}h`;
  } else if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return diff < 0 ? "Yesterday" : "Tomorrow";
  } else if (days < 7) {
    return diff < 0 ? `${days}d ago` : `In ${days}d`;
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

export function isOverdue(item: Item): boolean {
  if (item.completed) return false;
  
  const now = new Date();
  
  if (item.type === "event" && item.start_at) {
    return new Date(item.start_at) < now;
  } else if (item.due_at) {
    return new Date(item.due_at) < now;
  }
  
  return false;
}

export function getItemDate(item: Item): Date | null {
  if (item.type === "event" && item.start_at) {
    return new Date(item.start_at);
  } else if (item.due_at) {
    return new Date(item.due_at);
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
