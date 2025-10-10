# Testing & Acceptance Criteria

## Functional Requirements Testing

### 1. Quick Add Parsing ✅

**Test Case 1.1: Parse complete reminder**
- Input: `Pay bills tomorrow 9am #home !high /reminder`
- Expected: Creates reminder with:
  - Title: "Pay bills"
  - Type: reminder
  - Priority: high
  - Category: home
  - Due: Tomorrow at 9:00 AM
- Status: [ ]

**Test Case 1.2: Parse recurring event**
- Input: `Standup every Mon 9am #work /event`
- Expected: Creates event with:
  - Title: "Standup"
  - Type: event
  - Recurrence: Weekly on Monday
  - Start: Next Monday at 9:00 AM
  - Category: work
- Status: [ ]

**Test Case 1.3: Parse multiple categories**
- Input: `Team workshop #work #learning #important /event`
- Expected: Creates event with all three categories
- Status: [ ]

**Test Case 1.4: Parse relative time**
- Input: `Follow up in 2h #work /reminder`
- Expected: Creates reminder 2 hours from now
- Status: [ ]

### 2. Item Management ✅

**Test Case 2.1: Mark todo complete**
- Action: Create a to-do, click completion checkbox
- Expected: Item marked complete with strikethrough
- Status: [ ]

**Test Case 2.2: Mark reminder complete**
- Action: Create a reminder, click completion checkbox
- Expected: Item marked complete
- Status: [ ]

**Test Case 2.3: Complete recurring item**
- Action: Create recurring reminder, mark complete
- Expected: Current instance completed, new instance generated for next occurrence
- Status: [ ]

**Test Case 2.4: Edit item**
- Action: Click Edit on any item, modify fields, save
- Expected: Item updates with new data
- Status: [ ]

**Test Case 2.5: Delete item**
- Action: Click Delete on any item
- Expected: Item removed from all views
- Status: [ ]

### 3. Views & Navigation ✅

**Test Case 3.1: Today view groups**
- Setup: Create items at different times today
- Expected: Items grouped by morning/afternoon/evening
- Status: [ ]

**Test Case 3.2: Overdue highlighting**
- Setup: Create item with past due date
- Expected: Item appears at top of Today view with red warning
- Status: [ ]

**Test Case 3.3: Upcoming view**
- Setup: Create items over next 30 days
- Expected: Items sorted by date, grouped by day
- Status: [ ]

**Test Case 3.4: Calendar month view**
- Setup: Create items on various days
- Expected: Days with items show blue dots, count visible
- Status: [ ]

**Test Case 3.5: Calendar day detail**
- Action: Tap a day in calendar with items
- Expected: Items for that day displayed below calendar
- Status: [ ]

### 4. Filtering ✅

**Test Case 4.1: Filter by category**
- Setup: Create items with #work and #home tags
- Action: Select #work filter
- Expected: Only #work items displayed
- Status: [ ]

**Test Case 4.2: Filter by priority**
- Setup: Create items with different priorities
- Action: Select !high priority filter
- Expected: Only high priority items displayed
- Status: [ ]

**Test Case 4.3: Multiple filters**
- Action: Select #work AND !high
- Expected: Only items with both work tag and high priority
- Status: [ ]

**Test Case 4.4: Clear filters**
- Action: Apply filters, then click "Clear filters"
- Expected: All items displayed again
- Status: [ ]

### 5. Recurrence Logic ✅

**Test Case 5.1: Daily recurrence**
- Input: `Daily task every day 9am /reminder`
- Action: Complete the item
- Expected: Next instance created for tomorrow 9am
- Status: [ ]

**Test Case 5.2: Weekly recurrence**
- Input: `Weekly meeting every Mon 2pm /event`
- Expected: Appears on all Mondays in calendar
- Status: [ ]

**Test Case 5.3: Monthly recurrence**
- Input: `Pay rent monthly /reminder`
- Action: Complete item
- Expected: Next instance created for next month
- Status: [ ]

**Test Case 5.4: Custom interval**
- Input: `Review every 2 weeks /reminder`
- Action: Complete item
- Expected: Next instance created 2 weeks from now
- Status: [ ]

### 6. Performance & UX ✅

**Test Case 6.1: Instant creation**
- Action: Enter item in Quick Add, press Enter
- Expected: Item appears in list within 100ms
- Status: [ ]

**Test Case 6.2: Optimistic UI**
- Action: Create item via Quick Add
- Expected: Item visible immediately before save completes
- Status: [ ]

**Test Case 6.3: Focus retention**
- Action: Create item via Quick Add
- Expected: Focus returns to Quick Add for next entry
- Status: [ ]

**Test Case 6.4: Smooth scrolling**
- Setup: Create 50+ items
- Action: Scroll through list
- Expected: No jank, 60fps scrolling
- Status: [ ]

**Test Case 6.5: Large text support**
- Action: Enable large text in browser/OS
- Expected: Text scales appropriately, touch targets remain usable
- Status: [ ]

### 7. Data Persistence ✅

**Test Case 7.1: LocalStorage save**
- Action: Create items, refresh browser
- Expected: All items still present
- Status: [ ]

**Test Case 7.2: Edit persistence**
- Action: Edit item, refresh browser
- Expected: Edited data retained
- Status: [ ]

**Test Case 7.3: Completion persistence**
- Action: Complete items, refresh browser
- Expected: Completion state retained
- Status: [ ]

### 8. Mobile UX ✅

**Test Case 8.1: Touch targets**
- Action: Use on mobile device
- Expected: All buttons easy to tap (minimum 44px)
- Status: [ ]

**Test Case 8.2: Swipe gestures**
- Action: Swipe left on item card
- Expected: Delete action triggered
- Status: [ ]

**Test Case 8.3: Bottom nav usability**
- Action: Navigate between views on mobile
- Expected: Easy thumb access, clear active state
- Status: [ ]

**Test Case 8.4: FAB accessibility**
- Action: Tap floating + button
- Expected: Create form opens, positioned away from nav
- Status: [ ]

**Test Case 8.5: Form on small screens**
- Action: Open edit form on small screen
- Expected: Form scrollable, all fields accessible
- Status: [ ]

### 9. Accessibility ✅

**Test Case 9.1: Keyboard navigation**
- Action: Use Tab to navigate, Enter to submit
- Expected: All interactive elements accessible
- Status: [ ]

**Test Case 9.2: Dark mode**
- Action: Toggle OS dark mode
- Expected: App switches to dark theme automatically
- Status: [ ]

**Test Case 9.3: ARIA labels**
- Action: Use screen reader
- Expected: Buttons have clear labels ("Mark complete", "Delete", etc.)
- Status: [ ]

### 10. Edge Cases ✅

**Test Case 10.1: Empty title**
- Input: Quick Add with only tags/priority, no text
- Expected: Creates item with "Untitled" as title
- Status: [ ]

**Test Case 10.2: No time specified**
- Input: `Task #work /todo` (no time)
- Expected: Creates item with no due date
- Status: [ ]

**Test Case 10.3: Invalid recurrence**
- Setup: Item with recurrence but no time
- Expected: Handles gracefully, no crash
- Status: [ ]

**Test Case 10.4: Past event**
- Setup: Create event with past date
- Expected: Shown in appropriate views, not crashed
- Status: [ ]

**Test Case 10.5: Many items**
- Setup: Create 100+ items
- Expected: App remains responsive
- Status: [ ]

## Acceptance Criteria

### Must Have (All Required) ✅
- [ ] Can create items via Quick Add with inline tokens
- [ ] Parsing works for all token types (#, !, /, time, recurrence)
- [ ] Items appear in correct views
- [ ] Can mark todos/reminders complete from card
- [ ] Completing recurring item generates next instance
- [ ] Calendar shows item badges/counts
- [ ] Filtering by category and priority works
- [ ] Overdue items highlighted at top of Today
- [ ] Data persists across refreshes
- [ ] Mobile-friendly with large touch targets

### Nice to Have (Optional)
- [ ] Swipe gestures work smoothly
- [ ] Dark mode polished
- [ ] Empty states helpful
- [ ] Animations smooth
- [ ] PWA installable

## Browser Testing Matrix

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | Latest | ✅ | ✅ | [ ] |
| Safari | Latest | ✅ | ✅ | [ ] |
| Firefox | Latest | ✅ | ✅ | [ ] |
| Edge | Latest | ✅ | ✅ | [ ] |

## Performance Benchmarks

- [ ] Quick Add to item visible: < 100ms
- [ ] View switch: < 200ms
- [ ] List scroll: 60fps (no dropped frames)
- [ ] Form open: < 150ms
- [ ] LocalStorage save: < 50ms

## Final Sign-Off

- [ ] All core functionality working
- [ ] No critical bugs
- [ ] Mobile experience smooth
- [ ] Data persistence reliable
- [ ] README instructions accurate
- [ ] Code properly structured
- [ ] TypeScript errors resolved

---

**Testing completed on:** _________________

**Tested by:** _________________

**Overall Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Work
