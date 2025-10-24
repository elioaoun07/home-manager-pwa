# Alert/Reminder System - Complete Guide

## 🎯 Overview

Your database already has a powerful `alerts` table! I've extended it with:

✅ **Preset configurations** (Standard, Important, Minimal, etc.)  
✅ **Auto-updating alerts** when event times change  
✅ **Multiple reminder options** (30 mins, 1 day, 1 week before, etc.)  
✅ **React component** for easy UI integration  
✅ **TypeScript helpers** for managing alerts  

---

## 📦 Files Created

### 1. **ALERT_SYSTEM_SETUP.sql**
   - SQL functions and triggers
   - **Run this in Supabase SQL Editor first!**

### 2. **src/lib/alertManager.ts**
   - TypeScript functions for managing alerts
   - Preset configurations
   - Helper functions

### 3. **src/components/AlertManager.tsx**
   - React component for alert UI
   - Preset selector and custom alert builder
   - List of active reminders

---

## 🚀 Setup Instructions

### Step 1: Run SQL Setup

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `ALERT_SYSTEM_SETUP.sql`
3. Execute the script
4. This creates:
   - Helper functions (`add_preset_alerts`, `add_single_alert`, etc.)
   - Auto-update trigger for event changes
   - Alert presets table
   - View for upcoming alerts

### Step 2: Integrate Alert Manager Component

In your event creation/edit form, add the AlertManager component:

```tsx
import AlertManager from '@/components/AlertManager';

// In your form component:
<AlertManager 
  itemId={eventId}
  eventStart={eventStartDate}
  onAlertsChange={() => {
    // Optional: refresh your data
  }}
/>
```

---

## 💡 Usage Examples

### Example 1: Create Event with Alerts (Natural Language)

```typescript
import { parseSmartInput } from '@/lib/smartParser';
import { addPresetAlerts } from '@/lib/alertManager';

// User input: "Event tomorrow invited to parent's house"
const parsed = parseSmartInput("Event tomorrow invited to parent's house");

// Create the item
const { data: item } = await supabase
  .from('items')
  .insert({
    user_id: userId,
    type: 'event',
    title: parsed.title,
    responsible_user_id: userId
  })
  .select()
  .single();

// Create event details
const eventStart = new Date(parsed.date);
eventStart.setHours(18, 0); // Default to 6 PM

await supabase.from('event_details').insert({
  item_id: item.id,
  start_at: eventStart.toISOString(),
  end_at: new Date(eventStart.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
  all_day: false
});

// Add standard alerts (30 mins, 1 day before)
await addPresetAlerts(item.id, eventStart, 'standard');
```

### Example 2: Add Custom Alerts

```typescript
import { addMultipleAlerts } from '@/lib/alertManager';

await addMultipleAlerts(itemId, eventStart, [
  { offset_minutes: 30, channel: 'push' },      // 30 mins before
  { offset_minutes: 1440, channel: 'email' },   // 1 day before
  { offset_minutes: 10080, channel: 'push' }    // 1 week before
]);
```

### Example 3: Add Single Alert

```typescript
import { addSingleAlert } from '@/lib/alertManager';

// Add 1 hour before reminder
await addSingleAlert(itemId, 60, 'event_start', 'push');
```

### Example 4: Get Upcoming Alerts

```typescript
import { getUpcomingAlerts } from '@/lib/alertManager';

const alerts = await getUpcomingAlerts();

// Display in UI
alerts.forEach(alert => {
  console.log(`${alert.title}: ${alert.minutes_until_trigger} minutes`);
});
```

---

## 🎨 UI Integration

### Option A: Use the AlertManager Component

```tsx
import AlertManager from '@/components/AlertManager';

function EventForm() {
  const [eventStart, setEventStart] = useState(new Date());
  const [itemId, setItemId] = useState<string | null>(null);

  return (
    <div>
      {/* Your event form fields */}
      <input type="datetime-local" onChange={/* ... */} />
      
      {/* Alert Manager */}
      {itemId && (
        <AlertManager 
          itemId={itemId}
          eventStart={eventStart}
        />
      )}
    </div>
  );
}
```

### Option B: Simple Preset Selector

```tsx
import { ALERT_PRESETS, addPresetAlerts } from '@/lib/alertManager';

function SimpleAlertSelector({ itemId, eventStart }) {
  const [preset, setPreset] = useState('standard');

  const handleApply = async () => {
    await addPresetAlerts(itemId, eventStart, preset);
  };

  return (
    <div>
      <select value={preset} onChange={(e) => setPreset(e.target.value)}>
        <option value="standard">Standard (30 mins, 1 day)</option>
        <option value="important">Important (Multiple)</option>
        <option value="minimal">Minimal (15 mins)</option>
      </select>
      <button onClick={handleApply}>Set Reminders</button>
    </div>
  );
}
```

---

## 🔧 Available Presets

| Preset | Reminders |
|--------|-----------|
| **standard** | 30 mins before, 1 day before |
| **important** | 1 week, 1 day, 1 hour, 15 mins before |
| **minimal** | 15 mins before |
| **daily** | 1 day before |
| **weekly** | 1 week before |

---

## ⚙️ How It Works

### 1. **Alert Table Structure**

```sql
alerts
├── id (uuid)
├── item_id (uuid) → references items(id)
├── kind (enum: 'absolute', 'relative', 'recurring')
├── trigger_at (timestamptz) - When to fire the alert
├── offset_minutes (int) - Minutes before event
├── relative_to (enum: 'event_start', 'event_end', etc.)
├── channel (enum: 'push', 'email', 'sms', 'in_app')
├── active (boolean)
└── last_fired_at (timestamptz)
```

### 2. **Auto-Update Trigger**

When you change an event's start time, all relative alerts automatically recalculate their `trigger_at` times!

```sql
-- Change event time
UPDATE event_details SET start_at = '2025-10-26 18:00:00'
WHERE item_id = '<event_id>';

-- Alerts automatically updated via trigger!
```

### 3. **Offset Minutes Reference**

```typescript
0      = At time of event
5      = 5 minutes before
15     = 15 minutes before
30     = 30 minutes before
60     = 1 hour before
120    = 2 hours before
1440   = 1 day before (24 * 60)
2880   = 2 days before
10080  = 1 week before (7 * 24 * 60)
```

---

## 🔔 Notification Implementation

The alerts table stores WHEN to send notifications. You'll need to implement the actual notification sending separately:

### Option 1: Supabase Edge Functions (Recommended)

Create a scheduled Edge Function that:
1. Queries `v_upcoming_alerts` for alerts due in next 5 minutes
2. Sends push notifications via Firebase/OneSignal/etc.
3. Updates `last_fired_at` timestamp

### Option 2: Client-Side (Simple)

```typescript
// Poll for upcoming alerts
setInterval(async () => {
  const alerts = await getUpcomingAlerts();
  const dueNow = alerts.filter(a => 
    new Date(a.trigger_at) <= new Date()
  );
  
  dueNow.forEach(alert => {
    // Show browser notification
    new Notification(alert.title, {
      body: `Reminder: ${formatOffset(alert.offset_minutes)}`
    });
  });
}, 60000); // Check every minute
```

### Option 3: Supabase Webhooks

Set up a webhook to trigger when `alerts.trigger_at` is reached, then send notifications via your preferred service.

---

## 📊 Query Examples

### Get all alerts for an event

```sql
SELECT * FROM alerts 
WHERE item_id = '<event_id>'
ORDER BY offset_minutes DESC;
```

### Get next 10 upcoming alerts

```sql
SELECT * FROM v_upcoming_alerts
LIMIT 10;
```

### Get alerts firing today

```sql
SELECT * FROM alerts
WHERE DATE(trigger_at) = CURRENT_DATE
AND active = true;
```

---

## 🎯 Next Steps

1. **Run `ALERT_SYSTEM_SETUP.sql`** in Supabase
2. **Integrate AlertManager component** in your event form
3. **Test creating an event** with alerts
4. **Implement notification delivery** (Edge Functions recommended)
5. **Add to your smart parser** (see below)

---

## 🤖 Smart Parser Integration

Update your `smartParser.ts` to automatically add alerts when parsing events:

```typescript
// In parseSmartInput function:
if (result.type === 'event') {
  // After creating event...
  
  // Auto-add standard alerts
  await addPresetAlerts(itemId, eventStart, 'standard');
  
  // Or detect from input
  if (input.toLowerCase().includes('important')) {
    await addPresetAlerts(itemId, eventStart, 'important');
  }
}
```

---

## ❓ FAQ

**Q: Can I add alerts before the event is created?**  
A: No, you need the `item_id` first. Create the item, then add alerts.

**Q: What happens if I change the event time?**  
A: The trigger automatically recalculates all relative alerts! ✨

**Q: Can I have absolute time alerts?**  
A: Yes! Set `kind = 'absolute'` and specify `trigger_at` directly.

**Q: How do I disable an alert without deleting it?**  
A: Set `active = false` or use `toggleAlert(alertId, false)`.

---

## 📝 Summary

You now have a complete alert system:

✅ Multiple reminders per event  
✅ Preset configurations (Standard, Important, etc.)  
✅ Custom alert builder  
✅ Auto-updating when event changes  
✅ React component ready to use  
✅ TypeScript helpers  
✅ SQL functions in database  

**Next:** Run the SQL setup and integrate the AlertManager component!
