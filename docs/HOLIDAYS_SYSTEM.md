# Holiday Calendar System 🎉

A maintainable, sustainable system for displaying public holidays in your calendar application. This system fetches holidays dynamically from ICS calendar feeds and caches them locally for performance.

## 📁 Architecture

```
src/
├── config/
│   └── holidayFeeds.ts          # Configure holiday sources here
├── services/
│   └── holidayService.ts        # Core ICS fetching & parsing logic
├── hooks/
│   └── useHolidays.ts           # React hook for easy integration
└── components/
    └── CalendarViewNew.tsx      # Uses the holiday system
```

## 🚀 Features

### ✅ **Sustainable**
- No hardcoded dates - all holidays are fetched from ICS feeds
- Easy to add/remove holiday sources
- Supports any ICS-compatible calendar

### ✅ **Maintainable**
- Single configuration file for all feeds
- Clear separation of concerns
- Type-safe TypeScript implementation
- Comprehensive error handling

### ✅ **Performant**
- Automatic caching in localStorage (7-day duration)
- Fallback to stale cache if network fails
- Parallel fetching of multiple feeds
- Only refetches when cache expires

### ✅ **Flexible**
- Support for multiple countries/regions
- Custom colors per feed
- Enable/disable feeds individually
- Easy to extend for birthdays, anniversaries, etc.

## 🔧 How to Add New Holiday Feeds

### 1. Open Configuration File
Edit `src/config/holidayFeeds.ts`

### 2. Add Your Feed
```typescript
export const holidayFeeds: HolidayFeed[] = [
  // Existing feeds...
  
  // Add new feed:
  {
    id: 'your-country-holidays',      // Unique ID
    name: 'Your Country Holidays',    // Display name
    url: 'https://example.com/calendar.ics',  // ICS feed URL
    color: '#4A90E2',                 // Hex color code
    enabled: true                      // Enable/disable
  }
];
```

### 3. That's It!
The calendar will automatically fetch and display holidays from your new feed.

## 🌍 Finding ICS Feeds

### Popular Sources

1. **OfficeHolidays.com**
   - Format: `https://www.officeholidays.com/ics/[country]`
   - Example: `https://www.officeholidays.com/ics/lebanon`
   - Covers 200+ countries

2. **Government Websites**
   - Many governments publish official ICS feeds
   - Search: "[Country] public holidays ICS feed"

3. **Google Calendar**
   - Public calendars can be exported as ICS
   - Settings → Import & Export → Export

4. **Microsoft Outlook**
   - Shared calendars provide ICS links
   - Calendar → Share → Get link

## 🎨 Customization

### Change Holiday Colors

Edit `HOLIDAY_COLORS` in `src/config/holidayFeeds.ts`:

```typescript
export const HOLIDAY_COLORS = {
  lebanon: '#FF6B6B',      // Red
  uae: '#00843D',          // Green
  birthday: '#FFB347',     // Orange
  anniversary: '#C589E8'   // Purple
} as const;
```

### Adjust Cache Duration

Edit `CACHE_DURATION_MS` in `src/services/holidayService.ts`:

```typescript
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Manual Cache Refresh

```typescript
import { clearHolidayCache } from '@/services/holidayService';

// Clear all caches
clearHolidayCache();

// Clear specific feed
clearHolidayCache('lebanon-official');
```

## 🔌 Using the Holiday System

### In React Components

```typescript
import { useHolidays } from '@/hooks/useHolidays';

function MyComponent() {
  const { holidays, loading, error, refresh } = useHolidays();

  if (loading) return <div>Loading holidays...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh Holidays</button>
      {holidays.map(holiday => (
        <div key={holiday.id}>{holiday.title}</div>
      ))}
    </div>
  );
}
```

### Utility Functions

```typescript
import {
  getHolidaysForDate,
  getHolidaysInRange,
  isHoliday
} from '@/services/holidayService';

// Check if a date is a holiday
const today = new Date();
if (isHoliday(holidays, today)) {
  console.log('Today is a holiday!');
}

// Get holidays for a specific date
const todayHolidays = getHolidaysForDate(holidays, today);

// Get holidays in a date range
const monthHolidays = getHolidaysInRange(
  holidays,
  startOfMonth,
  endOfMonth
);
```

## 🐛 Troubleshooting

### Holidays Not Loading?

1. **Check Console**: Look for error messages
2. **Verify URL**: Test the ICS feed URL in your browser
3. **CORS Issues**: Some feeds may require a proxy
4. **Clear Cache**: Use `clearHolidayCache()` to force refresh

### Network Errors

The system automatically falls back to cached data if the network fails. Check:
- Internet connection
- ICS feed availability
- Browser console for specific errors

### Cache Issues

If holidays aren't updating:
```typescript
// Clear cache and force refresh
clearHolidayCache();
refresh();
```

## 📦 Dependencies

- **ical.js**: ICS calendar parsing
- Standard Web APIs (fetch, localStorage)

## 🔮 Future Enhancements

- [ ] Support for birthdays (from contacts)
- [ ] Support for anniversaries
- [ ] Multiple feed priorities
- [ ] Custom recurrence rules
- [ ] Export holidays to user's calendar
- [ ] Offline-first with service worker
- [ ] Holiday notifications

## 📝 License

Part of the home-manager-pwa project.

---

**Need help?** Check the code comments or create an issue!
