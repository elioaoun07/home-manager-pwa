# Complete Event & Reminder System - User Guide

## 🎯 Overview

Now you can create events with automatic reminders using **natural language**!

Just type: **"Event tomorrow at 6pm invited to parent's house, remind me 1 day and 30 mins before"**

The system automatically:
1. ✅ Parses the event date (tomorrow)
2. ✅ Sets the time (6pm)
3. ✅ Extracts the title (Parent's house)
4. ✅ Creates reminders (1 day before + 30 mins before)

---

## 📦 Complete Setup

### Step 1: Run SQL Setup (REQUIRED)

```sql
-- In Supabase SQL Editor, run ALERT_SYSTEM_SETUP.sql
-- This creates:
-- - add_preset_alerts() function
-- - add_single_alert() function
-- - recalculate_alert_triggers() function
-- - Auto-update trigger
-- - alert_presets table
-- - v_upcoming_alerts view
```

### Step 2: Use the Component

```tsx
import QuickAddWithAlerts from '@/components/QuickAddWithAlerts';

function MyPage() {
  return <QuickAddWithAlerts />;
}
```

---

## 💬 Natural Language Examples

### Example 1: Basic Event with Time
**Input:**
```
Event tomorrow at 6pm invited to parent's house
```

**Result:**
- 📅 Event: "invited to parent's house"
- ⏰ When: Tomorrow at 6:00 PM
- 🔔 Reminders: Standard (30 mins + 1 day before)

---

### Example 2: Event with Custom Reminders
**Input:**
```
Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before
```

**Result:**
- 📅 Event: "parent's house"
- ⏰ When: Tomorrow at 6:00 PM
- 🔔 Reminders:
  - 1 day before (Today at 6:00 PM)
  - 30 mins before (Tomorrow at 5:30 PM)

---

### Example 3: Important Event (Multiple Reminders)
**Input:**
```
Important meeting Monday at 2pm for 2 hours
```

**Result:**
- 📅 Event: "meeting"
- ⏰ When: Monday at 2:00 PM - 4:00 PM
- 🔔 Reminders: Important preset
  - 1 week before
  - 1 day before
  - 1 hour before
  - 15 minutes before

---

### Example 4: Specific Time with Single Reminder
**Input:**
```
Doctor appointment Friday at 10am, remind me 1 week before
```

**Result:**
- 📅 Event: "Doctor appointment"
- ⏰ When: Friday at 10:00 AM
- 🔔 Reminders: 1 week before

---

### Example 5: All Day Event
**Input:**
```
Holiday on Christmas all day
```

**Result:**
- 📅 Event: "Holiday"
- ⏰ When: Dec 25 (All day)
- 🔔 Reminders: Standard

---

### Example 6: No Reminders
**Input:**
```
Meeting tomorrow at 3pm, no reminder
```

**Result:**
- 📅 Event: "Meeting"
- ⏰ When: Tomorrow at 3:00 PM
- 🔔 Reminders: None

---

## 🎨 Parsing Features

### Time Detection

The parser understands:
- ✅ `tomorrow`, `today`, `next Monday`, `Friday`
- ✅ `at 6pm`, `at 18:00`, `at 2:30pm`
- ✅ `all day`, `all-day`
- ✅ `for 2 hours`, `for 30 minutes`

### Reminder Detection

The parser understands:
- ✅ `remind me 30 mins before`
- ✅ `remind me 1 day before`
- ✅ `remind me 1 week before`
- ✅ `remind me 1 day and 30 mins before`
- ✅ `important` → Uses "important" preset
- ✅ `minimal` → Uses "minimal" preset
- ✅ `no reminder` → No alerts

### Location Detection

- ✅ Extracts location from context
- Example: "Event at parent's house" → Location: "parent's house"

---

## 🔔 Available Reminder Presets

| Preset | When Alerts Fire |
|--------|------------------|
| **standard** (default) | 30 mins before, 1 day before |
| **important** | 1 week, 1 day, 1 hour, 15 mins before |
| **minimal** | 15 mins before |
| **daily** | 1 day before |
| **weekly** | 1 week before |

---

## 📝 Input Format Guide

### Basic Structure
```
[Event type] [when] at [time] [description], remind me [reminder times] before
```

### Parts Breakdown

**Event Type:** (optional)
- `Event`, `Meeting`, `Appointment`, etc.

**When:** (required for events)
- `tomorrow`, `today`, `Monday`, `next Friday`, `Dec 25`

**Time:** (optional, defaults to 6pm)
- `at 6pm`, `at 14:00`, `at 2:30pm`

**Description:** (required)
- Everything else becomes the title

**Reminders:** (optional, defaults to standard)
- `remind me 30 mins before`
- `remind me 1 day and 2 hours before`
- `important` (uses important preset)
- `no reminder` (no alerts)

---

## 🚀 How It Works

### 1. User Types Natural Language

```
"Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before"
```

### 2. Parser Extracts Information

```typescript
{
  eventStart: "2025-10-25T18:00:00Z",
  eventEnd: "2025-10-25T19:00:00Z",
  title: "parent's house",
  alerts: {
    custom: [
      { offset_minutes: 1440 },  // 1 day
      { offset_minutes: 30 }      // 30 mins
    ]
  }
}
```

### 3. System Creates:

**A. Item in `items` table**
```sql
INSERT INTO items (type, title, user_id, responsible_user_id)
VALUES ('event', 'parent''s house', user_id, user_id);
```

**B. Event details in `event_details` table**
```sql
INSERT INTO event_details (item_id, start_at, end_at)
VALUES (item_id, '2025-10-25 18:00:00', '2025-10-25 19:00:00');
```

**C. Alerts in `alerts` table**
```sql
INSERT INTO alerts (item_id, offset_minutes, trigger_at)
VALUES 
  (item_id, 1440, '2025-10-24 18:00:00'),  -- 1 day before
  (item_id, 30, '2025-10-25 17:30:00');    -- 30 mins before
```

### 4. Auto-Update Feature

If you later change the event time:

```sql
UPDATE event_details 
SET start_at = '2025-10-26 18:00:00'
WHERE item_id = item_id;
```

**The alerts automatically recalculate!** ✨
- 1 day before → Now triggers on 2025-10-25 18:00:00
- 30 mins before → Now triggers on 2025-10-26 17:30:00

---

## 🎯 Advanced Examples

### Multiple Events in One Day
```
Event tomorrow at 9am dentist, remind me 1 day before
Event tomorrow at 2pm meeting, important
Event tomorrow at 6pm dinner, minimal
```

### Event with Duration
```
Meeting Monday at 10am for 3 hours, remind me 1 day and 1 hour before
```

### Specific Date
```
Event Dec 25 at 8pm Christmas dinner, remind me 1 week and 1 day before
```

### Using Different Reminder Channels
```
// Currently all use 'push', but you can customize:
await addMultipleAlerts(itemId, eventStart, [
  { offset_minutes: 10080, channel: 'email' },  // 1 week via email
  { offset_minutes: 1440, channel: 'push' },    // 1 day via push
  { offset_minutes: 30, channel: 'sms' }        // 30 mins via SMS
]);
```

---

## 🔧 Programmatic Usage

### Create Event Directly

```typescript
import { parseEventWithAlerts } from '@/lib/eventParser';
import { addMultipleAlerts } from '@/lib/alertManager';
import { supabase } from '@/lib/supabase';

// Parse input
const parsed = parseEventWithAlerts(
  "Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before"
);

// Create item
const { data: item } = await supabase.from('items').insert({
  user_id: userId,
  type: 'event',
  title: parsed.smartData.title,
  responsible_user_id: userId
}).select().single();

// Create event details
await supabase.from('event_details').insert({
  item_id: item.id,
  start_at: parsed.eventStart,
  end_at: parsed.eventEnd,
  all_day: parsed.allDay || false
});

// Add reminders
if (parsed.alerts.custom) {
  await addMultipleAlerts(item.id, parsed.eventStart!, parsed.alerts.custom);
} else if (parsed.alerts.preset) {
  await addPresetAlerts(item.id, parsed.eventStart!, parsed.alerts.preset);
}
```

---

## 📊 Database Queries

### View All Upcoming Events with Reminders

```sql
SELECT 
  i.title,
  ed.start_at,
  array_agg(a.offset_minutes) as reminder_offsets,
  array_agg(a.trigger_at) as reminder_times
FROM items i
JOIN event_details ed ON ed.item_id = i.id
LEFT JOIN alerts a ON a.item_id = i.id
WHERE i.user_id = auth.uid()
  AND ed.start_at > now()
GROUP BY i.id, i.title, ed.start_at
ORDER BY ed.start_at;
```

### View Upcoming Alerts (Next 24 hours)

```sql
SELECT * FROM v_upcoming_alerts
WHERE trigger_at BETWEEN now() AND now() + INTERVAL '24 hours'
ORDER BY trigger_at;
```

---

## ✅ Testing Checklist

Test these inputs to verify everything works:

- [ ] `Event tomorrow at 6pm parent's house`
- [ ] `Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before`
- [ ] `Important meeting Monday at 2pm`
- [ ] `Doctor Friday at 10am, remind me 1 week before`
- [ ] `Birthday party Saturday all day`
- [ ] `Meeting at 3pm no reminder`

---

## 🎨 Customization

### Add Your Own Presets

Edit `src/lib/alertManager.ts`:

```typescript
export const ALERT_PRESETS: Record<string, AlertPreset[]> = {
  // ... existing presets ...
  
  // Add custom preset
  early: [
    { offset_minutes: 20160, channel: 'email', label: '2 weeks before' },
    { offset_minutes: 10080, channel: 'email', label: '1 week before' },
    { offset_minutes: 2880, channel: 'push', label: '2 days before' }
  ]
};
```

### Customize Time Parsing

Edit `src/lib/eventParser.ts` to add more patterns:

```typescript
const timePatterns = [
  /at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
  // Add your custom patterns here
];
```

---

## 📱 Next Steps

1. **Run `ALERT_SYSTEM_SETUP.sql`** in Supabase ⭐
2. **Add `<QuickAddWithAlerts />`** to your app
3. **Test with example inputs**
4. **Implement notification delivery** (see ALERT_SYSTEM_GUIDE.md)

---

## 🎉 Summary

You can now create events with reminders using natural language like:

✅ **"Event tomorrow at 6pm parent's house, remind me 1 day and 30 mins before"**

The system:
- Parses the date & time
- Extracts the event title
- Creates the event in database
- Sets up automatic reminders
- Auto-updates reminders if event time changes

**Simple, powerful, and natural!** 🚀
