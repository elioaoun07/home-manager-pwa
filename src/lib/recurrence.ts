// Recurrence logic for generating next occurrence
import { Recurrence, Item } from "@/types";

export function getNextOccurrence(item: Item): Date | null {
  if (!item.recurrence || item.recurrence.preset === "none") return null;
  
  const { recurrence } = item;
  let baseDate: Date;
  
  // Determine base date
  if (item.type === "event" && item.end_at) {
    baseDate = new Date(item.end_at);
  } else if (item.due_at) {
    baseDate = new Date(item.due_at);
  } else if (item.start_at) {
    baseDate = new Date(item.start_at);
  } else {
    baseDate = new Date();
  }
  
  const interval = recurrence.custom?.interval || 1;
  const next = new Date(baseDate);
  
  switch (recurrence.preset) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
      
    case "weekly":
      if (recurrence.custom?.byWeekday && recurrence.custom.byWeekday.length > 0) {
        // Find next matching weekday
        const weekdayMap: Record<string, number> = {
          Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
        };
        const targetDays = recurrence.custom.byWeekday.map(d => weekdayMap[d]).sort((a, b) => a - b);
        const currentDay = next.getDay();
        
        let found = false;
        for (const targetDay of targetDays) {
          if (targetDay > currentDay) {
            next.setDate(next.getDate() + (targetDay - currentDay));
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Next week, first target day
          const daysUntilNextWeek = 7 - currentDay + targetDays[0];
          next.setDate(next.getDate() + daysUntilNextWeek);
        }
      } else {
        next.setDate(next.getDate() + 7 * interval);
      }
      break;
      
    case "monthly":
      if (recurrence.custom?.byMonthday && recurrence.custom.byMonthday.length > 0) {
        // Find next matching day of month
        const targetDays = recurrence.custom.byMonthday.sort((a, b) => a - b);
        const currentDayOfMonth = next.getDate();
        
        let found = false;
        for (const targetDay of targetDays) {
          if (targetDay > currentDayOfMonth) {
            next.setDate(targetDay);
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Next month
          next.setMonth(next.getMonth() + interval);
          next.setDate(targetDays[0]);
        }
      } else {
        next.setMonth(next.getMonth() + interval);
      }
      break;
      
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
      
    default:
      return null;
  }
  
  // Check count limit
  if (recurrence.custom?.count) {
    // Would need to track occurrence count in item metadata
    // For simplicity, we'll skip this check here
  }
  
  // Check until limit
  if (recurrence.custom?.until) {
    const until = new Date(recurrence.custom.until);
    if (next > until) return null;
  }
  
  return next;
}

export function generateNextInstance(item: Item): Item | null {
  const nextDate = getNextOccurrence(item);
  if (!nextDate) return null;
  
  const newItem: Item = {
    ...item,
    id: crypto.randomUUID(),
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  if (item.type === "event") {
    if (item.start_at && item.end_at) {
      const duration = new Date(item.end_at).getTime() - new Date(item.start_at).getTime();
      newItem.start_at = nextDate.toISOString();
      newItem.end_at = new Date(nextDate.getTime() + duration).toISOString();
    }
  } else {
    newItem.due_at = nextDate.toISOString();
  }
  
  return newItem;
}
