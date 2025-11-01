# Note Type - Visual Guide

## 📝 Note Type Overview

The Note type provides a quick, lightweight way to capture information without the overhead of dates and times.

## 🎨 Visual Design

### Type Selection in Create Form
```
┌─────────────────────────────────────────────────────┐
│              Choose Type                            │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   🔔     │  │   📅     │  │   📒     │         │
│  │          │  │          │  │          │         │
│  │Reminder  │  │  Event   │  │  Note    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│   Blue         Green/Teal    Orange ✨             │
└─────────────────────────────────────────────────────┘
```

### Note Form (Simplified)
```
┌─────────────────────────────────────────────────────┐
│  1️⃣  Choose Type: [Note - Orange] ✓                │
│                                                     │
│  2️⃣  What's it about?                               │
│     ┌─────────────────────────────────────────┐   │
│     │ Title: Quick shopping list              │   │
│     ├─────────────────────────────────────────┤   │
│     │ Description:                            │   │
│     │ - Milk                                  │   │
│     │ - Bread                                 │   │
│     │ - Eggs                                  │   │
│     └─────────────────────────────────────────┘   │
│                                                     │
│  ⏭️  (Step 3: When is it due? - HIDDEN for Notes)  │
│                                                     │
│  3️⃣  How important is it?                           │
│     Priority: [Normal] ✓                           │
│     Categories: #Shopping ✓                        │
│                                                     │
│  [Cancel]  [Create Item] 💾                        │
└─────────────────────────────────────────────────────┘
```

### Reminder/Event Form (Full)
```
┌─────────────────────────────────────────────────────┐
│  1️⃣  Choose Type: [Reminder - Blue] ✓               │
│                                                     │
│  2️⃣  What's it about?                               │
│     [Title & Description fields]                   │
│                                                     │
│  3️⃣  When is it due? ⏰                              │
│     📅 Date: Tomorrow                              │
│     🕐 Time: 2:00 PM                               │
│     ⏱️  Estimate: 30 minutes                        │
│                                                     │
│  4️⃣  How important is it?                           │
│     Priority: [High] ✓                             │
│     Categories: #Work ✓                            │
│                                                     │
│  5️⃣  Break it down (subtasks)                       │
│     [Subtask input...]                             │
│                                                     │
│  [Cancel]  [Create Item] 💾                        │
└─────────────────────────────────────────────────────┘
```

## 📱 Note in List View

### Compact View
```
┌─────────────────────────────────────────────────────┐
│ ○  Quick shopping list              🔥              │
│     #Shopping                       🗑️              │
└─────────────────────────────────────────────────────┘
     Orange sticky note icon would appear here
```

### Comfy View
```
┌─────────────────────────────────────────────────────┐
│  📒  Quick shopping list                            │
│      Orange bg                                      │
│                                                     │
│      - Milk, Bread, Eggs                           │
│                                                     │
│      📍 #Shopping    🔥 Normal                      │
│                                                     │
│      [✓ Complete]  [✏️ Edit]  [🗑️ Delete]          │
└─────────────────────────────────────────────────────┘
```

## 🔍 Note Details View

```
┌─────────────────────────────────────────────────────┐
│                                              ✕      │
│  📒  Quick shopping list                            │
│     [○ Mark Complete]  🔒 Private                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ - Milk                                      │   │
│  │ - Bread                                     │   │
│  │ - Eggs                                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ╔═══════════════════════════════════════════╗     │
│  ║  📅 When is it due?                       ║     │
│  ║  Convert this note to a reminder          ║     │
│  ║                                           ║     │
│  ║  [⏰ When is it due?]                     ║     │
│  ╚═══════════════════════════════════════════╝     │
│      Orange gradient button                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🔥  Priority: Normal                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🏷️  Categories: Shopping                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│     [✏️ Edit]        [🗑️ Delete]                   │
└─────────────────────────────────────────────────────┘
```

## 🔄 Note → Reminder Conversion Flow

```
Step 1: Click Note
┌─────────────┐
│ 📒 Note     │  →  View Details opens
└─────────────┘

Step 2: See "When is it due?" button
┌──────────────────────────┐
│ 📅 When is it due?       │  →  Click button
│ Convert to reminder      │
└──────────────────────────┘

Step 3: Edit form opens
┌──────────────────────────┐
│ Type: [Note]  ↓          │  →  Change to [Reminder]
└──────────────────────────┘

Step 4: Set due date (now visible)
┌──────────────────────────┐
│ 3️⃣  When is it due?      │
│ 📅 Date: Tomorrow        │  →  Set date & time
│ 🕐 Time: 2:00 PM         │
└──────────────────────────┘

Step 5: Save
┌──────────────────────────┐
│ [Create Item] 💾         │  →  Now a Reminder!
└──────────────────────────┘
```

## 🎯 Use Cases

### Perfect for Notes:
- ✅ Shopping lists
- ✅ Random ideas
- ✅ Quick thoughts
- ✅ Reference information
- ✅ Bucket list items
- ✅ Someday/maybe tasks

### Should be Reminders:
- ❌ Tasks with deadlines
- ❌ Time-sensitive items
- ❌ Appointments
- ❌ Scheduled activities

### Should be Events:
- ❌ Meetings
- ❌ Calendar events
- ❌ Appointments with duration
- ❌ Time-blocked activities

## 🎨 Color Coding Reference

| Type     | Icon        | Gradient                  | Use Case            |
|----------|-------------|---------------------------|---------------------|
| Reminder | 🔔 Bell     | Blue (from-blue-500)      | Tasks with due date |
| Event    | 📅 Calendar | Green (from-emerald-500)  | Scheduled events    |
| Note     | 📒 Sticky   | Orange (from-amber-500)   | Quick notes         |

## ⌨️ Quick Actions

### Create Note:
1. Open app
2. Click FAB (+)
3. Select "Note" type (orange)
4. Fill title
5. Save

### Convert to Reminder:
1. Open note
2. Click "When is it due?"
3. Change type to Reminder
4. Set date/time
5. Save
