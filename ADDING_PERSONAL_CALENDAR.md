# Adding Personal Calendar Holidays

## Why Some Holidays Are Missing

The app currently only fetches from **Lebanon Official Public Holidays** calendar, which includes:
- New Year, Independence Day, Liberation Day
- Religious holidays (Eid, Christmas, Easter, etc.)

It does NOT include observances like:
- Teacher's Day
- Daylight Saving Time
- Rafic Hariri Commemoration

These are likely in **your personal Google Calendar**.

## How to Add Your Personal Calendar

### Step 1: Get Your Calendar's ICS URL

1. Go to [Google Calendar](https://calendar.google.com)
2. Click **Settings** (gear icon) → **Settings**
3. On the left sidebar, find your calendar and click it
4. Scroll down to **"Integrate calendar"** section
5. Copy the **"Secret address in iCal format"** URL
   - It looks like: `https://calendar.google.com/calendar/ical/YOUR_EMAIL/private-XXXXX/basic.ics`

### Step 2: Add to API Route

Edit `src/app/api/holidays/[code]/route.ts`:

```typescript
const HOLIDAY_SOURCES: Record<string, string> = {
  lebanon: 'https://calendar.google.com/calendar/ical/en.lb.official%23holiday%40group.v.calendar.google.com/public/basic.ics',
  personal: 'YOUR_PERSONAL_CALENDAR_ICS_URL_HERE', // ← Paste your URL here
};
```

### Step 3: Add to Config

Edit `src/config/holidayFeeds.ts`:

```typescript
export const holidayFeeds: HolidayFeed[] = [
  {
    id: 'lebanon-official',
    name: 'Lebanon Official Holidays',
    countryCode: 'lebanon',
    color: '#FF6B6B',
    enabled: true
  },
  {
    id: 'personal-calendar',
    name: 'Personal Events', // ← Add this
    countryCode: 'personal',
    color: '#4A90E2', // Blue color
    enabled: true
  },
];
```

### Step 4: Restart the Server

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 5: Enable in App

In the calendar view:
1. Click the **Filter** button
2. Under **Special Events**, you'll see **"Personal Events"**
3. Check the box to show them on your calendar

## Security Note

⚠️ The "secret" ICS URL contains your calendar data. Keep it private!
- Don't commit it to public repositories
- Consider using environment variables for production:

```typescript
const HOLIDAY_SOURCES: Record<string, string> = {
  lebanon: 'https://calendar.google.com/calendar/ical/en.lb.official%23holiday%40group.v.calendar.google.com/public/basic.ics',
  personal: process.env.PERSONAL_CALENDAR_ICS_URL || '',
};
```

Then add to `.env.local`:
```
PERSONAL_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/your-email/private-xxxxx/basic.ics
```

## Result

✅ All your personal calendar events (including Teacher's Day, Rafic Hariri Commemoration, etc.) will now appear on your calendar!
