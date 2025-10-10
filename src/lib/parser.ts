// Quick Add input parser
import { ParsedInput, ItemType, Priority, Recurrence, RecurrencePreset } from "@/types";

export function parseQuickAdd(input: string): ParsedInput {
  let text = input.trim();
  
  // Extract type
  let type: ItemType = "reminder";
  const typeMatch = text.match(/\/(reminder|todo|event)/i);
  if (typeMatch) {
    type = typeMatch[1].toLowerCase() as ItemType;
    text = text.replace(typeMatch[0], "").trim();
  }
  
  // Extract priority
  let priority: Priority = "normal";
  const priorityMatch = text.match(/!(low|normal|high|urgent)/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as Priority;
    text = text.replace(priorityMatch[0], "").trim();
  }
  
  // Extract categories
  const categories: string[] = [];
  const categoryMatches = text.matchAll(/#(\w+)/g);
  for (const match of categoryMatches) {
    categories.push(match[1]);
    text = text.replace(match[0], "").trim();
  }
  
  // Extract recurrence
  let recurrence: Recurrence | undefined;
  const recurrencePatterns = [
    { pattern: /every\s+day|daily/i, preset: "daily" as RecurrencePreset },
    { pattern: /every\s+week|weekly/i, preset: "weekly" as RecurrencePreset },
    { pattern: /every\s+month|monthly/i, preset: "monthly" as RecurrencePreset },
    { pattern: /every\s+year|yearly/i, preset: "yearly" as RecurrencePreset },
    { pattern: /every\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i, preset: "weekly" as RecurrencePreset, weekday: true },
    { pattern: /every\s+(\d+)\s+(day|week|month|year)s?/i, custom: true },
  ];
  
  for (const { pattern, preset, weekday, custom } of recurrencePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (weekday && match[1]) {
        recurrence = {
          preset: "weekly",
          custom: {
            interval: 1,
            byWeekday: [match[1]],
          },
        };
      } else if (custom && match[1] && match[2]) {
        const interval = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const presetMap: Record<string, RecurrencePreset> = {
          day: "daily",
          week: "weekly",
          month: "monthly",
          year: "yearly",
        };
        recurrence = {
          preset: presetMap[unit] || "daily",
          custom: { interval },
        };
      } else if (preset) {
        recurrence = { preset };
      }
      text = text.replace(match[0], "").trim();
      break;
    }
  }
  
  // Extract time
  let time: Date | undefined;
  let startTime: Date | undefined;
  let endTime: Date | undefined;
  let allDay = false;
  
  const now = new Date();
  
  // Time patterns
  const timePatterns = [
    // Absolute times: "5pm", "09:00", "17:30"
    { pattern: /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i, absolute: true },
    { pattern: /(\d{1,2}):(\d{2})/, absolute: true, is24: true },
    
    // Relative: "in 2h", "in 30min", "in 1 hour"
    { pattern: /in\s+(\d+)\s*(h|hr|hour)s?/i, hours: true },
    { pattern: /in\s+(\d+)\s*(m|min|minute)s?/i, minutes: true },
    
    // Day references: "today", "tomorrow"
    { pattern: /today/i, today: true },
    { pattern: /tomorrow/i, tomorrow: true },
  ];
  
  let foundDay = false;
  let dayOffset = 0;
  
  for (const patternDef of timePatterns) {
    const match = text.match(patternDef.pattern);
    if (match) {
      if (patternDef.today) {
        foundDay = true;
        dayOffset = 0;
      } else if (patternDef.tomorrow) {
        foundDay = true;
        dayOffset = 1;
      } else if (patternDef.absolute) {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        let finalHour = hour;
        
        if (patternDef.is24) {
          finalHour = hour;
        } else if (match[3]) {
          const meridiem = match[3].toLowerCase();
          if (meridiem === "pm" && hour !== 12) finalHour = hour + 12;
          if (meridiem === "am" && hour === 12) finalHour = 0;
        }
        
        time = new Date(now);
        if (foundDay) {
          time.setDate(time.getDate() + dayOffset);
        }
        time.setHours(finalHour, minute, 0, 0);
      } else if (patternDef.hours) {
        const hours = parseInt(match[1]);
        time = new Date(now.getTime() + hours * 60 * 60 * 1000);
      } else if (patternDef.minutes) {
        const minutes = parseInt(match[1]);
        time = new Date(now.getTime() + minutes * 60 * 1000);
      }
      
      text = text.replace(match[0], "").trim();
    }
  }
  
  // For events, assume 1-hour duration if only start time given
  if (type === "event" && time) {
    startTime = time;
    endTime = new Date(time.getTime() + 60 * 60 * 1000);
  }
  
  // Clean up title
  const title = text.trim() || "Untitled";
  
  return {
    title,
    type,
    priority,
    categories,
    time,
    startTime,
    endTime,
    allDay,
    recurrence,
  };
}
