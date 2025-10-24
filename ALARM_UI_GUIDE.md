# 🔔 Event Alarm System - Complete UI Integration Guide

## Overview

The alarm system is now fully integrated into the event creation/editing UI. Users can set **both relative and absolute alarms** for events.

---

## 🎯 Features

### ✨ Alarm Types

1. **Relative Alarms** (time before event)
   - At time of event (0 minutes)
   - 5, 15, 30 minutes before
   - 1, 2 hours before
   - 1, 2 days before
   - 1 week before

2. **Absolute Alarms** (specific datetime)
   - Set exact date and time for notification
   - Independent of event start time
   - Useful for "notify me at 9am regardless of event time"

### 📬 Notification Channels

- **Push** - Browser/mobile push notifications
- **Email** - Email notifications
- **SMS** - Text message notifications

### ⚡ Quick Presets

- **Standard** - 30 mins + 1 day before
- **Important** - 15 mins, 1 hour, 1 day, 1 week before
- **Minimal** - 15 mins before
- **Daily** - 1 day before

---

## 🎨 UI Location

The alarm picker is located in the **Event Details** section of the `EditFormNew` component:

```
Event Details
├── All-Day Toggle
├── Start Date & Time
├── End Date & Time  
├── Location
└── 🔔 ALARMS ← NEW!
```

---

## 🔧 How to Use

### Creating an Event with Alarms

1. Click **+ FAB** button
2. Select **Event** type
3. Fill in event details (title, dates, location)
4. Scroll to **🔔 ALARMS** section
5. Choose one of:
   - **Quick Preset** - Click a preset button (Standard/Important/etc.)
   - **Individual Alarm** - Click "+" → Select relative/absolute → Configure
6. Click **Save**

### Relative Alarms

```tsx
// User clicks "+" → "Relative" → Selects "30 minutes before" → Chooses "push"
→ Alarm will trigger 30 minutes before event start time
```

**When alarm triggers:**
- If event starts at `2025-01-20 18:00`
- Alarm set to `30 minutes before`
- Notification fires at `2025-01-20 17:30`

### Absolute Alarms

```tsx
// User clicks "+" → "Absolute" → Selects datetime → Chooses "email"
→ Alarm will trigger at specific datetime regardless of event time
```

**When alarm triggers:**
- Event starts at `2025-01-20 18:00`
- Alarm set to `2025-01-20 09:00` (absolute)
- Notification fires at `2025-01-20 09:00`

---

## 📋 Component Architecture

### Files Modified/Created

1. **`src/components/AlarmPicker.tsx`** ⭐ NEW
   - Main UI component for alarm management
   - Handles both relative and absolute alarms
   - Displays current alarms with trigger times
   - Add/remove alarm functionality

2. **`src/components/EditFormNew.tsx`** ✏️ UPDATED
   - Added `alarms` state: `useState<AlarmConfig[]>([])`
   - Added `AlarmPicker` component in event section
   - Passes alarms through `onSave` callback

3. **`src/app/page.tsx`** ✏️ UPDATED
   - Updated `handleSaveEdit` to accept `alarms` and `eventStartTime`
   - Calls `saveAlarms()` after creating/updating event
   - Handles both new events and updates

4. **`src/lib/alertManager.ts`** ✏️ UPDATED
   - Added `saveAlarms()` function
   - Handles both relative and absolute alarm types
   - Deletes existing alarms before inserting new ones
   - Calculates trigger times based on alarm type

---

## 🔍 Data Flow

```
User creates event
    ↓
EditFormNew component
    ├── User fills in event details
    ├── User configures alarms via AlarmPicker
    ├── AlarmPicker updates alarms state
    └── User clicks Save
         ↓
handleSubmit in EditFormNew
    ├── Packages event_details
    ├── Packages alarms array
    ├── Packages eventStartTime
    └── Calls onSave(data)
         ↓
handleSaveEdit in page.tsx
    ├── Creates/updates item
    ├── Creates/updates event_details
    └── Calls saveAlarms(itemId, eventStartTime, alarms)
         ↓
saveAlarms in alertManager.ts
    ├── Deletes existing alarms for item
    ├── For each alarm:
    │   ├── If relative: calculates trigger_at = eventStart - offset
    │   └── If absolute: uses absolute_time as trigger_at
    └── Inserts alarms into database
         ↓
Database alerts table
    └── Alarms stored and ready for notification system
```

---

## 🗄️ Database Schema

### Alerts Table

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  kind alert_kind_enum,  -- 'relative' | 'absolute' | 'recurring'
  trigger_at TIMESTAMPTZ NOT NULL,
  offset_minutes INTEGER,  -- For relative alarms
  relative_to alert_relative_to_enum,  -- 'event_start', 'event_end', etc.
  channel alert_channel_enum,  -- 'push' | 'email' | 'sms' | 'in_app'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example Records

**Relative Alarm:**
```json
{
  "id": "abc123",
  "item_id": "item456",
  "kind": "relative",
  "trigger_at": "2025-01-20T17:30:00Z",
  "offset_minutes": 30,
  "relative_to": "event_start",
  "channel": "push",
  "active": true
}
```

**Absolute Alarm:**
```json
{
  "id": "def789",
  "item_id": "item456",
  "kind": "absolute",
  "trigger_at": "2025-01-20T09:00:00Z",
  "offset_minutes": null,
  "relative_to": null,
  "channel": "email",
  "active": true
}
```

---

## ⚙️ Configuration

### Alarm Picker Props

```tsx
interface AlarmPickerProps {
  eventStartTime: Date | null;  // Required for relative alarms
  existingAlarms?: AlarmConfig[];  // Pre-populate for editing
  onChange: (alarms: AlarmConfig[]) => void;  // Callback with updated alarms
}
```

### Alarm Config Type

```tsx
interface AlarmConfig {
  id: string;  // Unique ID (UUID)
  type: 'relative' | 'absolute';
  offset_minutes?: number;  // For relative (0-10080)
  absolute_time?: string;  // ISO string for absolute
  channel: 'push' | 'email' | 'sms';
}
```

---

## 🚀 Next Steps

### 1. Run SQL Setup (REQUIRED)

```bash
# Execute in Supabase SQL Editor
# File: ALERT_SYSTEM_SETUP.sql
```

This creates:
- Database functions for alarm management
- Triggers for auto-updating alarms when event times change
- Views for querying upcoming alarms

### 2. Test the UI

1. Create a new event
2. Add alarms using:
   - Quick presets
   - Individual relative alarms
   - Individual absolute alarms
3. Save and verify alarms in database
4. Edit event and change time → alarms auto-update

### 3. Implement Notification Delivery

Currently alarms are **stored** but not **delivered**. You need:

- **Supabase Edge Function** to check for due alarms
- **Cron job** to run every minute
- **Integration** with:
  - Firebase Cloud Messaging (push)
  - SendGrid/Resend (email)
  - Twilio (SMS)

See `ALERT_SYSTEM_GUIDE.md` for notification setup details.

---

## 🎨 UI Preview

### Alarm Picker Component

```
🔔 ALARMS
┌──────────────────────────────────────────┐
│  Quick Presets:                          │
│  [Standard] [Important] [Minimal] [Daily]│
│                                          │
│  Current Alarms:                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔔 30 minutes before            │    │
│  │ Push • Triggers at 17:30        │ ❌  │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🔔 1 day before                 │    │
│  │ Push • Triggers at Jan 19 18:00 │ ❌  │
│  └─────────────────────────────────┘    │
│                                          │
│  [+ Add Alarm]                           │
└──────────────────────────────────────────┘
```

### Add Alarm Menu

```
┌─────────────────────────────┐
│ Add Alarm                   │
├─────────────────────────────┤
│ Type:                       │
│ ◉ Relative  ○ Absolute      │
│                             │
│ When:                       │
│ ▼ 30 minutes before         │
│                             │
│ Channel:                    │
│ ▼ Push Notification         │
│                             │
│         [Add]               │
└─────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Alarms not showing in picker

**Issue:** After saving, alarms don't appear when editing event

**Solution:** 
- Ensure `existingAlarms` is passed to `AlarmPicker`
- Load alarms when loading event details
- Check database for alarm records

### Trigger times incorrect

**Issue:** Relative alarms trigger at wrong time

**Solution:**
- Verify `eventStartTime` is correct in `AlarmPicker`
- Check timezone handling in `Date` objects
- Ensure `trigger_at` calculation in `saveAlarms()` is correct

### Alarms not saving

**Issue:** Alarms don't persist to database

**Solution:**
- Run `ALERT_SYSTEM_SETUP.sql` in Supabase
- Check RLS policies on `alerts` table
- Verify `saveAlarms()` function doesn't error
- Check browser console for errors

---

## 📚 Related Documentation

- **ALERT_SYSTEM_SETUP.sql** - SQL setup script
- **ALERT_SYSTEM_GUIDE.md** - Complete alarm system documentation
- **EVENT_AND_REMINDER_GUIDE.md** - Event/reminder system guide
- **src/components/AlarmPicker.tsx** - Component source code
- **src/lib/alertManager.ts** - Alarm management functions

---

## ✅ Completion Checklist

- [x] AlarmPicker component created
- [x] EditFormNew updated with alarm state
- [x] page.tsx handles alarm saving
- [x] alertManager.saveAlarms() implemented
- [x] Both relative and absolute alarms supported
- [x] Quick presets available
- [x] UI integrated into event form
- [ ] SQL setup run in Supabase (USER ACTION REQUIRED)
- [ ] Notification delivery system implemented
- [ ] Tested with real events

---

**Status:** ✅ UI Integration Complete - Ready for Testing

**Next Action:** Run `ALERT_SYSTEM_SETUP.sql` in Supabase SQL Editor
