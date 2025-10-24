# 🎨 Event Alarm System - Visual Summary

## What We Built

A complete alarm/notification system for events with a beautiful UI that supports both **relative** (time before event) and **absolute** (specific datetime) alarms.

---

## 📱 User Journey

### Creating an Event with Alarms

```
1. User clicks FAB (+)
   ↓
2. Selects "Event"
   ↓
3. Fills in event details:
   • Title: "Visit parent's house"
   • Date: Tomorrow
   • Time: 6:00 PM
   • Location: "123 Main St"
   ↓
4. Scrolls to "🔔 ALARMS" section
   ↓
5. Chooses alarm method:
   
   Option A: Quick Preset
   ┌─────────────────────────────────────┐
   │ [Standard] [Important] [Minimal]    │
   └─────────────────────────────────────┘
   Clicks "Standard" → Adds 30 mins + 1 day
   
   Option B: Individual Alarms
   ┌─────────────────────────────────────┐
   │ [+ Add Alarm]                       │
   └─────────────────────────────────────┘
   
   Then configures:
   • Type: Relative ◉  Absolute ○
   • When: ▼ 30 minutes before
   • Channel: ▼ Push Notification
   • Clicks [Add]
   
   Repeats for each alarm
   ↓
6. Sees current alarms:
   ┌────────────────────────────────────┐
   │ 🔔 30 minutes before               │
   │ Push • Triggers at 5:30 PM     [×] │
   ├────────────────────────────────────┤
   │ 🔔 1 day before                    │
   │ Push • Triggers at Jan 19 6:00 PM[×]│
   └────────────────────────────────────┘
   ↓
7. Clicks "Save"
   ↓
8. Event created ✅
   Alarms saved to database ✅
   Ready for notification delivery 🔔
```

---

## 🎨 UI Components

### AlarmPicker Component

```tsx
┌────────────────────────────────────────────────────┐
│ 🔔 ALARMS                                          │
├────────────────────────────────────────────────────┤
│                                                    │
│ Quick Presets:                                     │
│ ┌──────────┬──────────┬──────────┬──────────┐     │
│ │ Standard │Important │ Minimal  │  Daily   │     │
│ │ 30m + 1d │ 4 alarms │ 15m only │ 1d only  │     │
│ └──────────┴──────────┴──────────┴──────────┘     │
│                                                    │
│ Current Alarms (2):                                │
│ ┌──────────────────────────────────────────┐      │
│ │ 🔔 30 minutes before                     │      │
│ │ 📱 Push • Triggers at 5:30 PM        [×] │      │
│ └──────────────────────────────────────────┘      │
│ ┌──────────────────────────────────────────┐      │
│ │ 🔔 1 day before                          │      │
│ │ 📱 Push • Triggers at Jan 19, 6:00 PM[×] │      │
│ └──────────────────────────────────────────┘      │
│                                                    │
│ ┌────────────────────────────────────────────┐    │
│ │             [+ Add Alarm]                  │    │
│ └────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

### Add Alarm Dialog (Relative)

```tsx
┌─────────────────────────────────────┐
│ Add Alarm                           │
├─────────────────────────────────────┤
│                                     │
│ Type:                               │
│ ┌──────────┬──────────┐             │
│ │ Relative │ Absolute │             │
│ │    ◉     │    ○     │             │
│ └──────────┴──────────┘             │
│                                     │
│ When:                               │
│ ┌─────────────────────────────────┐ │
│ │ ▼ 30 minutes before             │ │
│ │   • At time of event            │ │
│ │   • 5 minutes before            │ │
│ │   • 15 minutes before           │ │
│ │   • 30 minutes before    ✓      │ │
│ │   • 1 hour before               │ │
│ │   • 2 hours before              │ │
│ │   • 1 day before                │ │
│ │   • 2 days before               │ │
│ │   • 1 week before               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Channel:                            │
│ ┌─────────────────────────────────┐ │
│ │ ▼ Push Notification             │ │
│ │   • 📱 Push Notification   ✓    │ │
│ │   • 📧 Email                    │ │
│ │   • 📱 SMS                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│        ┌──────────────┐             │
│        │     Add      │             │
│        └──────────────┘             │
└─────────────────────────────────────┘
```

### Add Alarm Dialog (Absolute)

```tsx
┌─────────────────────────────────────┐
│ Add Alarm                           │
├─────────────────────────────────────┤
│                                     │
│ Type:                               │
│ ┌──────────┬──────────┐             │
│ │ Relative │ Absolute │             │
│ │    ○     │    ◉     │             │
│ └──────────┴──────────┘             │
│                                     │
│ Date & Time:                        │
│ ┌─────────────────────────────────┐ │
│ │ 2025-01-20       09:00       ⌄ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Channel:                            │
│ ┌─────────────────────────────────┐ │
│ │ ▼ Email                         │ │
│ │   • 📱 Push Notification        │ │
│ │   • 📧 Email               ✓    │ │
│ │   • 📱 SMS                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│        ┌──────────────┐             │
│        │     Add      │             │
│        └──────────────┘             │
└─────────────────────────────────────┘
```

---

## 🔔 Alarm Types Explained

### Relative Alarms

**Definition:** Alarms that trigger at a specific time *before* the event

**Use Cases:**
- "Remind me 30 minutes before the meeting"
- "Notify me 1 day before the birthday party"
- "Alert me 1 week before the deadline"

**Example:**
```
Event: "Dentist Appointment"
Start Time: Jan 20, 2025 at 2:00 PM
Alarm: 30 minutes before

→ Notification fires: Jan 20, 2025 at 1:30 PM
```

**How it works:**
```javascript
trigger_at = event_start_time - offset_minutes
trigger_at = 2:00 PM - 30 minutes = 1:30 PM
```

### Absolute Alarms

**Definition:** Alarms that trigger at a specific date/time regardless of event time

**Use Cases:**
- "Remind me at 9 AM on the day of the event"
- "Notify me at midnight the night before"
- "Send email at 8 AM sharp"

**Example:**
```
Event: "Flight to Paris"
Start Time: Jan 20, 2025 at 6:30 PM
Alarm: Absolute at Jan 20, 2025 at 9:00 AM

→ Notification fires: Jan 20, 2025 at 9:00 AM
   (9.5 hours before the flight)
```

**How it works:**
```javascript
trigger_at = absolute_time
trigger_at = 9:00 AM (as specified by user)
```

---

## 📊 Comparison Matrix

| Feature | Relative Alarms | Absolute Alarms |
|---------|----------------|-----------------|
| **Set by** | Offset from event | Specific datetime |
| **Updates when event changes** | ✅ Yes | ❌ No |
| **Example** | "30 mins before" | "Jan 20 at 9 AM" |
| **Use case** | Event-dependent | Event-independent |
| **Database field** | `offset_minutes` | `absolute_time` |
| **Kind enum** | `relative` | `absolute` |

---

## 🗂️ Files Created/Modified

### ✨ New Files

1. **`src/components/AlarmPicker.tsx`** (298 lines)
   - Complete alarm picker UI component
   - Quick presets (Standard, Important, Minimal, Daily)
   - Individual alarm configuration
   - Visual display of trigger times
   - Add/remove alarm functionality

2. **`ALARM_UI_GUIDE.md`** (Documentation)
   - Complete usage guide
   - Component architecture
   - Data flow diagrams
   - Troubleshooting tips

3. **`ALARM_VISUAL_SUMMARY.md`** (This file)
   - Visual walkthrough
   - UI mockups
   - Alarm type explanations

### ✏️ Modified Files

1. **`src/components/EditFormNew.tsx`**
   - Added `alarms` state
   - Added `AlarmPicker` component in event section
   - Updated `handleSubmit` to pass alarms
   - Updated interface to accept `AlarmConfig[]`

2. **`src/app/page.tsx`**
   - Added `saveAlarms` import
   - Updated `handleSaveEdit` signature
   - Added alarm saving logic for create/update
   - Calls `saveAlarms()` after event details saved

3. **`src/lib/alertManager.ts`**
   - Added `saveAlarms()` function
   - Handles both relative and absolute alarms
   - Calculates trigger times based on type
   - Deletes old alarms before inserting new

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AlarmPicker Component                      │
│  • User clicks "Standard" preset                                │
│  • OR user clicks "+ Add Alarm"                                 │
│  • Configures type (relative/absolute)                          │
│  • Selects when (offset or datetime)                            │
│  • Chooses channel (push/email/sms)                             │
│  • Clicks "Add"                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                    State: alarms[]
         [{ type: 'relative', offset: 30, channel: 'push' }]
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EditFormNew Component                        │
│  • User fills event details                                     │
│  • Alarms configured via AlarmPicker                            │
│  • User clicks "Save"                                           │
│  • handleSubmit() packages data                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                     onSave(data)
      {
        title: "Visit parent's house",
        type: "event",
        event_details: {...},
        alarms: [...],
        eventStartTime: Date
      }
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   handleSaveEdit (page.tsx)                     │
│  1. Create/update item → get item.id                            │
│  2. Upsert event_details                                        │
│  3. Call saveAlarms(item.id, eventStartTime, alarms)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│             saveAlarms() (alertManager.ts)                      │
│  1. Delete existing alarms for item                             │
│  2. For each alarm:                                             │
│     • If relative: trigger = eventStart - offset                │
│     • If absolute: trigger = absolute_time                      │
│  3. Insert alarms into database                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                          │
│                       alerts table                              │
│  {                                                              │
│    id: uuid,                                                    │
│    item_id: uuid,                                               │
│    kind: 'relative',                                            │
│    trigger_at: '2025-01-19T18:00:00Z',                          │
│    offset_minutes: 1440,                                        │
│    channel: 'push',                                             │
│    active: true                                                 │
│  }                                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                  ⏰ Ready for Notification
               (When trigger_at is reached)
```

---

## 🎯 Example Scenarios

### Scenario 1: Standard Meeting Reminder

```
Event: "Team Standup"
Date: Jan 22, 2025
Time: 10:00 AM
Location: Conference Room A

Alarms (Using "Standard" Preset):
1. 30 minutes before
   → Triggers: 9:30 AM on Jan 22
   → Channel: Push
   
2. 1 day before
   → Triggers: 10:00 AM on Jan 21
   → Channel: Push

User Journey:
1. User creates event
2. Clicks "Standard" quick preset
3. Sees 2 alarms added automatically
4. Clicks Save
5. ✅ Done!
```

### Scenario 2: Important Doctor's Appointment

```
Event: "Annual Checkup"
Date: Jan 25, 2025
Time: 2:00 PM
Location: City Hospital

Alarms (Using "Important" Preset):
1. 15 minutes before
   → Triggers: 1:45 PM on Jan 25
   
2. 1 hour before
   → Triggers: 1:00 PM on Jan 25
   
3. 1 day before
   → Triggers: 2:00 PM on Jan 24
   
4. 1 week before
   → Triggers: 2:00 PM on Jan 18

All via: Push Notification

User Journey:
1. User creates event
2. Clicks "Important" quick preset
3. Sees 4 alarms added
4. Clicks Save
5. ✅ Gets reminded multiple times!
```

### Scenario 3: Flight with Custom Alarms

```
Event: "Flight to Tokyo"
Date: Feb 10, 2025
Time: 11:30 PM
Location: JFK Airport

Custom Alarms:
1. Absolute: Feb 10 at 9:00 AM
   → "Start packing reminder"
   → Channel: Push
   
2. Relative: 3 hours before (8:30 PM)
   → "Leave for airport"
   → Channel: Push
   
3. Relative: 1 day before (Feb 9 at 11:30 PM)
   → "Confirm flight status"
   → Channel: Email

User Journey:
1. User creates event
2. Clicks "+ Add Alarm" (3 times)
3. Configures each alarm individually:
   - First: Absolute type, 9 AM, Push
   - Second: Relative type, 180 mins, Push
   - Third: Relative type, 1 day, Email
4. Clicks Save
5. ✅ Perfect travel preparation!
```

---

## 🎨 Design Patterns

### Progressive Disclosure

```
Initial View (Collapsed):
┌────────────────────────────┐
│ 🔔 ALARMS                  │
│ [+ Add Alarm]              │
└────────────────────────────┘

After Adding Alarms:
┌────────────────────────────┐
│ 🔔 ALARMS (2)              │
│ • 30 mins before      [×]  │
│ • 1 day before        [×]  │
│ [+ Add Alarm]              │
└────────────────────────────┘

Add Dialog (When + clicked):
┌────────────────────────────┐
│ Choose type, when, channel │
│           [Add]            │
└────────────────────────────┘
```

### Quick Actions

```
One Click = Multiple Alarms
┌────────────────────────────┐
│ [Standard] ← Click once    │
└────────────────────────────┘
       ↓
Instantly adds:
• 30 minutes before (Push)
• 1 day before (Push)
```

### Visual Feedback

```
Before Save:
┌────────────────────────────┐
│ 🔔 30 minutes before       │
│ Push • Will trigger at 5:30│
└────────────────────────────┘

After Save:
Toast: "✅ Event created with 2 alarms"
```

---

## ✅ Testing Checklist

### UI Testing

- [ ] AlarmPicker renders in event form
- [ ] Quick presets add correct alarms
- [ ] Add alarm dialog opens
- [ ] Relative alarm dropdown works
- [ ] Absolute alarm datetime picker works
- [ ] Channel selection works
- [ ] Trigger time displays correctly
- [ ] Remove alarm (×) works
- [ ] Multiple alarms can be added
- [ ] Alarms persist after save

### Functional Testing

- [ ] Create event with relative alarms
- [ ] Create event with absolute alarms
- [ ] Create event with mixed alarms
- [ ] Edit event and update alarms
- [ ] Edit event time → relative alarms update
- [ ] Edit event time → absolute alarms unchanged
- [ ] Delete all alarms
- [ ] Use each quick preset

### Database Testing

- [ ] Alarms saved to `alerts` table
- [ ] `trigger_at` calculated correctly
- [ ] `offset_minutes` stored for relative
- [ ] `kind` is 'relative' or 'absolute'
- [ ] Old alarms deleted on update
- [ ] Alarms deleted when event deleted

---

## 🚀 Status

- ✅ AlarmPicker component created
- ✅ UI integrated into EditFormNew
- ✅ Save logic implemented
- ✅ Both relative & absolute supported
- ✅ Quick presets available
- ✅ All files documented
- ⏳ SQL setup (ALERT_SYSTEM_SETUP.sql) - USER ACTION
- ⏳ Notification delivery - TO BE IMPLEMENTED

**Next Step:** Run `ALERT_SYSTEM_SETUP.sql` in Supabase SQL Editor

---

Made with 💙 for seamless event notifications!
