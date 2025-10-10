# Usage Guide - Home Manager App

## Quick Start Testing

### 1. Quick Add Examples

Try these commands in the Quick Add bar at the top:

#### Basic Reminders
```
Pay bills tomorrow 9am #home !high /reminder
Call dentist Friday 2pm #health /reminder
Review quarterly goals #work !urgent /reminder
```

#### To-Dos
```
Grocery shopping today 5pm #home /todo
Submit report tomorrow 5pm #work !urgent /todo
Clean garage this weekend #home /todo
```

#### Events
```
Team standup today 9am #work /event
Lunch with Sarah tomorrow 12pm #social /event
Conference call Friday 3pm #work !high /event
```

#### Recurring Items
```
Standup every Mon 9am #work /event
Take vitamins every day 8am #health /reminder
Weekly review every Fri 4pm #work /reminder
Team lunch monthly #work #social /event
```

#### Advanced Examples
```
Project deadline in 2h #work !urgent /todo
Morning workout every Mon Wed Fri 7am #fitness /reminder
Pay rent monthly #finance !high /reminder
Dentist appointment in 3 days 10am #health /event
```

### 2. View Navigation

Use the bottom navigation to switch between views:

- **📋 Today** - See items for today grouped by time of day
- **📅 Upcoming** - Browse next 30 days
- **🗓️ Calendar** - Month view with item counts
- **🏷️ Filters** - Filter by categories and priorities

### 3. Managing Items

#### Complete a Task
- Tap the circle checkbox on any reminder or to-do
- For recurring items, completing generates the next instance

#### Edit an Item
- Tap "Edit" button on any card
- Or tap the FAB (+ button) at bottom right to create new

#### Delete an Item
- Tap "Delete" button on any card
- Or swipe left on mobile to reveal delete

#### Swipe Gestures (Mobile)
- Swipe left: Delete
- Swipe right: Edit

### 4. Filtering (Categories View)

1. Navigate to Filters tab (🏷️)
2. Tap category tags to filter (e.g., #work, #home)
3. Tap priority buttons to filter by urgency
4. Combine multiple filters
5. Tap "Clear filters" to reset

### 5. Calendar View

1. Navigate to Calendar tab (🗓️)
2. Swipe or use arrows to change months
3. Days with items show blue dots
4. Tap a day to see its items below
5. Tap "Edit" or "Delete" on items directly

### 6. Testing Recurrence

**Test recurring reminder:**
1. Add: `Daily standup every day 9am #work /reminder`
2. Navigate to Today or Calendar
3. Mark the item as complete
4. Check that a new instance appears for tomorrow

**Test weekly event:**
1. Add: `Team meeting every Mon 2pm #work /event`
2. Go to Calendar view
3. Check that it appears on Mondays

### 7. Testing Priorities

Create items with different priorities:
```
Low priority task #test !low /todo
Normal task #test /todo
High priority reminder #test !high /reminder
Urgent deadline #test !urgent /todo
```

Then filter by priority in the Filters view.

### 8. Testing Categories

Create items with multiple categories:
```
Team workshop tomorrow 10am #work #learning !high /event
Doctor appointment Friday 3pm #health #appointments /event
Weekend hiking trip #personal #fitness #social /event
```

Filter by categories to see groupings.

### 9. Testing Overdue

To test overdue functionality:
1. Create an item with a past time (edit mode)
2. Or wait for an existing item to become overdue
3. Check Today view - overdue items appear at top with red styling

### 10. Dark Mode

Your system's dark mode preference is automatically respected. Toggle your OS dark mode to test.

## Quick Add Token Reference

| Token | Purpose | Example |
|-------|---------|---------|
| `#tag` | Category/tag | `#work #home #urgent` |
| `!priority` | Set priority | `!low !normal !high !urgent` |
| `/type` | Item type | `/reminder /todo /event` |
| `today` | Today | `today 5pm` |
| `tomorrow` | Tomorrow | `tomorrow 9am` |
| `5pm` / `17:00` | Time | `today 5pm` or `tomorrow 17:00` |
| `in 2h` | Relative time | `in 2h` or `in 30min` |
| `every day` | Daily recurrence | `every day 9am` |
| `every Mon` | Weekly on day | `every Mon 9am` |
| `every week` | Weekly | `every week` |
| `monthly` | Monthly | `monthly` |
| `every 2 weeks` | Custom interval | `every 2 weeks` |

## Feature Checklist

### ✅ Core Features
- [ ] Quick Add creates items instantly
- [ ] Preview shows parsed fields before creating
- [ ] Items appear in appropriate views
- [ ] Completion toggle works
- [ ] Edit form saves changes
- [ ] Delete removes items
- [ ] Filters work correctly
- [ ] Calendar shows correct items
- [ ] Recurring items generate next instance
- [ ] Overdue items highlighted
- [ ] Dark mode switches correctly

### ✅ Mobile Experience
- [ ] Touch targets are large enough
- [ ] Swipe gestures work
- [ ] FAB button accessible
- [ ] Bottom nav easy to use
- [ ] Form scrolls properly on small screens
- [ ] No horizontal scrolling
- [ ] Text is readable

### ✅ Performance
- [ ] Quick Add responds instantly
- [ ] Items appear optimistically
- [ ] No lag when scrolling
- [ ] View switching is smooth
- [ ] Data persists after refresh

## Tips

1. **Rapid Entry**: After adding an item, focus stays in Quick Add for quick successive entries
2. **Keyboard**: Press Enter to submit Quick Add
3. **Empty States**: Each view shows helpful messages when empty
4. **Demo Data**: First load includes sample items to explore
5. **Local Storage**: All data saved in browser - clear browser data to reset

## Troubleshooting

**Items not appearing?**
- Check you're in the correct view (Today/Upcoming/Calendar)
- Verify the item has a date set
- Check filters aren't hiding it

**Recurring items not generating?**
- Mark the item complete (not just delete)
- Check recurrence settings in edit form

**Dark mode not working?**
- Check your OS/browser dark mode setting
- Try toggling system dark mode

## Known Limitations

- Data stored locally only (no cloud sync)
- No notifications/reminders (future feature)
- Time parsing supports common formats only
- Calendar starts on Sunday

---

Enjoy managing your tasks with lightning speed! ⚡
