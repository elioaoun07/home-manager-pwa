# Home Manager - Reminders, Tasks & Events

A lightning-fast, mobile-first Progressive Web App for managing reminders, to-dos, and calendar events with natural language input and instant creation.

## Features

✨ **Quick Add Bar** - Parse natural language input with inline tokens:
- Time: `today 5pm`, `tomorrow 09:00`, `in 2h`
- Priority: `!high`, `!urgent`, `!low`
- Categories: `#work`, `#home`
- Type hint: `/event`, `/todo`, `/reminder`
- Recurrence: `every day`, `every Mon`, `monthly`

📋 **Core Views**
- **Today**: Items grouped by time of day (morning/afternoon/evening) with overdue highlighted
- **Upcoming**: Next 30 days in a simple list
- **Calendar**: Month view with item counts and day detail
- **Filters**: Filter by categories and priorities

🎯 **Smart Features**
- Recurring items with automatic next instance generation
- Optimistic UI for instant feedback
- Touch-friendly swipe gestures
- Large tap targets for mobile use
- Dark mode support

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
pnpm build
pnpm start
```

## Usage Examples

### Quick Add Syntax

**Create a reminder:**
```
Pay bills tomorrow 9am #home !high /reminder
```

**Create a recurring event:**
```
Standup every Mon 9am #work /event
```

**Create a to-do:**
```
Grocery shopping today 5pm #home /todo
```

**With multiple categories:**
```
Team presentation Friday 2pm #work #important !urgent /event
```

**Recurring with custom interval:**
```
Review goals every 2 weeks #personal /reminder
```

### Quick Actions

- **Mark complete**: Tap the circle on reminder/to-do cards
- **Edit**: Tap "Edit" button on any card
- **Delete**: Tap "Delete" button or swipe left
- **Quick edit**: Tap the FAB (+ button) to create new items

### Keyboard Shortcuts

- After adding an item via Quick Add, focus stays in the input for rapid entry
- Press Enter to submit Quick Add
- Press Enter in category input to add a tag

## Data Model

### Item Types
1. **Reminder** - One-time or recurring reminders with optional due time
2. **To-Do** - Tasks with completion tracking and optional due date
3. **Event** - Calendar events with start/end times and recurrence

### Fields
- `id`: UUID
- `type`: "reminder" | "todo" | "event"
- `title`: Required string
- `notes`: Optional description
- `categories`: Array of tags
- `priority`: "low" | "normal" | "high" | "urgent"
- `due_at`: DateTime for reminders/todos
- `start_at`, `end_at`, `all_day`: For events
- `recurrence`: Preset or custom recurrence pattern
- `completed`: Boolean for todos/reminders
- `created_at`, `updated_at`: Timestamps

## Architecture

### Tech Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **LocalStorage** - Client-side persistence

### Project Structure
```
src/
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main app component
│   └── globals.css        # Global styles
├── components/
│   ├── QuickAdd.tsx       # Quick Add input bar
│   ├── ItemCard.tsx       # Individual item display
│   ├── TodayView.tsx      # Today view component
│   ├── UpcomingView.tsx   # Upcoming view component
│   ├── CalendarView.tsx   # Calendar view component
│   ├── CategoriesView.tsx # Filter view component
│   ├── EditForm.tsx       # Create/edit modal form
│   ├── BottomNav.tsx      # Bottom navigation
│   └── FAB.tsx            # Floating action button
├── lib/
│   ├── parser.ts          # Quick Add parsing logic
│   ├── recurrence.ts      # Recurrence generation
│   ├── storage.ts         # LocalStorage management
│   ├── utils.ts           # Helper utilities
│   └── seedData.ts        # Demo data
└── types/
    └── index.ts           # TypeScript types
```

## Mobile Optimization

- Mobile-first responsive design
- Large touch targets (minimum 44px)
- Optimistic UI updates
- 60fps smooth scrolling
- Pull-to-refresh ready
- PWA-enabled for installation
- Safe area insets for notched devices

## Browser Support

- Modern browsers (Chrome, Safari, Firefox, Edge)
- Mobile Safari (iOS)
- Chrome Mobile (Android)
- PWA installation supported

## Development

### Code Style
- TypeScript strict mode
- ESLint configured
- Functional React components
- Client-side state management with React hooks

### Performance
- Optimistic UI for instant feedback
- Minimal re-renders with proper key usage
- LocalStorage for persistence (async-safe)
- No external API dependencies

## Testing

### Manual Testing Checklist

✅ Quick Add parsing:
- Enter: `Pay bills tomorrow 9am #home !high /reminder` → Creates reminder with all parsed fields
- Enter: `Standup every Mon 9am #work /event` → Creates recurring Monday event

✅ Mark complete:
- Tap checkbox on todo/reminder → Toggles completion
- Complete recurring item → Generates next instance

✅ Filtering:
- Select #work and !high → Shows only matching items
- Clear filters → Shows all items

✅ Calendar:
- Month view shows item count badges
- Tap a day → Shows items for that day

✅ Overdue:
- Overdue items appear at top of Today view
- Red warning style applied

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

**Start managing your tasks with lightning speed! ⚡**

