import { NextRequest, NextResponse } from 'next/server';
import * as ical from 'node-ical';

export const runtime = 'nodejs';
export const revalidate = 86400; // 24 hours

// Map country codes to Google Calendar ICS URLs
const HOLIDAY_SOURCES: Record<string, string> = {
  lebanon: 'https://calendar.google.com/calendar/ical/en.lb.official%23holiday%40group.v.calendar.google.com/public/basic.ics',
  // Add your personal calendar ICS URL here:
  // personal: 'YOUR_PERSONAL_CALENDAR_ICS_URL_HERE',
};

interface HolidayEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  readonly: boolean;
  category: string;
  country: string;
  source: string;
}

interface HolidayResponse {
  version: string;
  events: HolidayEvent[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const countryCode = code.toLowerCase();

    // Get ICS URL for country
    const icsUrl = HOLIDAY_SOURCES[countryCode];
    if (!icsUrl) {
      return NextResponse.json(
        { error: `Holiday source not found for country: ${countryCode}` },
        { status: 404 }
      );
    }

    // Fetch and parse ICS data
    const events = await ical.async.fromURL(icsUrl);
    const holidays: HolidayEvent[] = [];

    // Debug: Log total events fetched
    console.log(`[Holidays API] Fetched ${Object.keys(events).length} events from ICS feed`);

    // Process events
    for (const [, event] of Object.entries(events)) {
      // Type guard for VEVENT
      if (event && typeof event === 'object' && 'type' in event && event.type === 'VEVENT') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vevent = event as any; // node-ical doesn't have proper TypeScript definitions
        const startDate = vevent.start;
        if (!startDate) continue;

        // Format date as YYYY-MM-DD
        const date = startDate instanceof Date
          ? startDate.toISOString().split('T')[0]
          : new Date(startDate).toISOString().split('T')[0];

        // Generate stable ID from UID or create from summary + date
        const id = vevent.uid || `${countryCode}-${slugify(vevent.summary || 'holiday')}-${date}`;

        holidays.push({
          id,
          title: vevent.summary || 'Holiday',
          date,
          allDay: true,
          readonly: true,
          category: 'holiday',
          country: countryCode.toUpperCase(),
          source: 'google-ics',
        });
      }
    }

    // Debug: Log processed holidays count
    console.log(`[Holidays API] Processed ${holidays.length} VEVENT entries`);

    // Sort by date, then by title
    holidays.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.title.localeCompare(b.title);
    });

    // Deduplicate by ID
    const uniqueHolidays = Array.from(
      new Map(holidays.map(h => [h.id, h])).values()
    );

    const response: HolidayResponse = {
      version: new Date().toISOString(),
      events: uniqueHolidays,
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch holidays',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to create URL-safe slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
