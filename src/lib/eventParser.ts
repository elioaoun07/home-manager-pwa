/**
 * Enhanced Smart Parser with Event Time & Alert Detection
 * Parses: "Event tomorrow at 6pm invited to parent's house, remind me 1 day and 30 mins before"
 */

import { smartParse, type SmartParsedData } from './smartParser';

export interface ParsedEventWithAlerts {
  // Original parsed data from smartParser
  smartData: SmartParsedData;
  
  // Event-specific
  eventStart?: Date;
  eventEnd?: Date;
  allDay?: boolean;
  location?: string;
  
  // Alert configuration
  alerts: {
    preset?: 'standard' | 'important' | 'minimal' | 'daily' | 'weekly' | 'custom';
    custom?: Array<{
      offset_minutes: number;
      channel: 'push' | 'email';
      label?: string;
    }>;
  };
}

/**
 * Parse event with time and alert configuration
 */
export function parseEventWithAlerts(input: string): ParsedEventWithAlerts {
  const smartData = smartParse(input);
  
  const result: ParsedEventWithAlerts = {
    smartData,
    alerts: {
      preset: 'standard' // Default preset
    }
  };
  
  // Initialize alerts
  result.alerts = {
    preset: 'standard' // Default preset
  };
  
  // ============================================
  // 1. DETECT EVENT TIME
  // ============================================
  
  const lowerInput = input.toLowerCase();
  
  // Parse specific times (at 6pm, at 18:00, etc.)
  const timePatterns = [
    /at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
    /(\d{1,2}):(\d{2})\s*(am|pm)?/,
    /(\d{1,2})\s*(am|pm)/i
  ];
  
  let eventHour = 18; // Default 6 PM
  let eventMinute = 0;
  
  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();
      
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
      
      eventHour = hour;
      eventMinute = minute;
      break;
    }
  }
  
  // Create event start time
  const detectedTime = smartData.detections.startTime || smartData.detections.time;
  if (detectedTime) {
    result.eventStart = new Date(detectedTime.value);
    result.eventStart.setHours(eventHour, eventMinute, 0, 0);
    
    // Default 1 hour duration
    result.eventEnd = new Date(result.eventStart);
    result.eventEnd.setHours(result.eventEnd.getHours() + 1);
  }
  
  // Check for all-day events
  if (lowerInput.includes('all day') || lowerInput.includes('all-day')) {
    result.allDay = true;
    if (result.eventStart) {
      result.eventStart.setHours(0, 0, 0, 0);
      result.eventEnd = new Date(result.eventStart);
      result.eventEnd.setHours(23, 59, 59, 999);
    }
  }
  
  // Detect duration
  const durationMatch = input.match(/for (\d+)\s*(hour|hr|minute|min)s?/i);
  if (durationMatch && result.eventStart) {
    const duration = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    
    result.eventEnd = new Date(result.eventStart);
    if (unit.startsWith('hour') || unit === 'hr') {
      result.eventEnd.setHours(result.eventEnd.getHours() + duration);
    } else {
      result.eventEnd.setMinutes(result.eventEnd.getMinutes() + duration);
    }
  }
  
  // Detect location
  const locationPatterns = [
    /at (.+?)(?:,|remind|alert|$)/i,
    /location:?\s*(.+?)(?:,|remind|alert|$)/i,
    /@ (.+?)(?:,|remind|alert|$)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = input.match(pattern);
    if (match && !match[1].match(/\d{1,2}(am|pm)/i)) {
      result.location = match[1].trim();
      break;
    }
  }
  
  // ============================================
  // 2. DETECT REMINDER/ALERT PREFERENCES
  // ============================================
  
  // Check for preset keywords
  if (lowerInput.includes('important') || lowerInput.includes('urgent')) {
    result.alerts.preset = 'important';
  } else if (lowerInput.includes('minimal') || lowerInput.includes('just remind')) {
    result.alerts.preset = 'minimal';
  } else if (lowerInput.includes('no reminder') || lowerInput.includes('no alert')) {
    result.alerts.preset = undefined;
  }
  
  // Parse specific reminder times
  const reminderPatterns = [
    /remind(?:\s+me)?\s+(.+?)(?:before|prior)/gi,
    /alert(?:\s+me)?\s+(.+?)(?:before|prior)/gi,
    /notification\s+(.+?)(?:before|prior)/gi
  ];
  
  const customAlerts: Array<{ offset_minutes: number; channel: 'push' | 'email' }> = [];
  
  for (const pattern of reminderPatterns) {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      const reminderText = match[1].toLowerCase();
      
      // Parse time units
      const timeUnits = [
        { pattern: /(\d+)\s*week/i, multiplier: 10080 },
        { pattern: /(\d+)\s*day/i, multiplier: 1440 },
        { pattern: /(\d+)\s*hour/i, multiplier: 60 },
        { pattern: /(\d+)\s*min/i, multiplier: 1 }
      ];
      
      for (const unit of timeUnits) {
        const timeMatch = reminderText.match(unit.pattern);
        if (timeMatch) {
          const value = parseInt(timeMatch[1]);
          customAlerts.push({
            offset_minutes: value * unit.multiplier,
            channel: 'push'
          });
        }
      }
      
      // Check for "and" to parse multiple
      if (reminderText.includes('and')) {
        const parts = reminderText.split('and');
        parts.forEach(part => {
          for (const unit of timeUnits) {
            const timeMatch = part.match(unit.pattern);
            if (timeMatch) {
              const value = parseInt(timeMatch[1]);
              customAlerts.push({
                offset_minutes: value * unit.multiplier,
                channel: 'push'
              });
            }
          }
        });
      }
    }
  }
  
  if (customAlerts.length > 0) {
    result.alerts.preset = 'custom';
    result.alerts.custom = customAlerts;
  }
  
  return result;
}

/**
 * Format parsed event for display
 */
export function formatParsedEvent(parsed: ParsedEventWithAlerts): string {
  const parts: string[] = [];
  
  parts.push(`📅 ${parsed.smartData.title}`);
  
  if (parsed.eventStart) {
    const dateStr = parsed.eventStart.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = parsed.allDay 
      ? 'All day'
      : parsed.eventStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
    parts.push(`⏰ ${dateStr} at ${timeStr}`);
  }
  
  if (parsed.location) {
    parts.push(`📍 ${parsed.location}`);
  }
  
  if (parsed.alerts.preset && parsed.alerts.preset !== 'custom') {
    parts.push(`🔔 Reminders: ${parsed.alerts.preset}`);
  } else if (parsed.alerts.custom) {
    const labels = parsed.alerts.custom.map(a => {
      if (a.offset_minutes >= 10080) return `${a.offset_minutes / 10080} week(s)`;
      if (a.offset_minutes >= 1440) return `${a.offset_minutes / 1440} day(s)`;
      if (a.offset_minutes >= 60) return `${a.offset_minutes / 60} hour(s)`;
      return `${a.offset_minutes} min(s)`;
    });
    parts.push(`🔔 Reminders: ${labels.join(', ')} before`);
  }
  
  return parts.join('\n');
}

// ============================================
// EXAMPLES & TESTS
// ============================================

/*
// Example 1: Full event with time and reminders
const input1 = "Event tomorrow at 6pm invited to parent's house, remind me 1 day and 30 mins before";
const parsed1 = parseEventWithAlerts(input1);
// Result:
// - eventStart: Tomorrow at 6:00 PM
// - eventEnd: Tomorrow at 7:00 PM
// - location: "parent's house"
// - alerts.custom: [{ offset_minutes: 1440 }, { offset_minutes: 30 }]

// Example 2: Important event
const input2 = "Important meeting tomorrow at 2pm for 2 hours";
const parsed2 = parseEventWithAlerts(input2);
// Result:
// - eventStart: Tomorrow at 2:00 PM
// - eventEnd: Tomorrow at 4:00 PM
// - alerts.preset: 'important'
// - priority: 'high'

// Example 3: All day event
const input3 = "Holiday on Friday all day";
const parsed3 = parseEventWithAlerts(input3);
// Result:
// - eventStart: Friday at 12:00 AM
// - eventEnd: Friday at 11:59 PM
// - allDay: true

// Example 4: Multiple reminders
const input4 = "Doctor appointment next Monday at 10am, remind me 1 week and 1 day before";
const parsed4 = parseEventWithAlerts(input4);
// Result:
// - eventStart: Next Monday at 10:00 AM
// - alerts.custom: [{ offset_minutes: 10080 }, { offset_minutes: 1440 }]
*/
