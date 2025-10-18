/**
 * Holiday Feeds Configuration
 * 
 * This file allows you to easily add, remove, or modify holiday feeds.
 * Each feed represents a source of holidays (country, region, organization, etc.)
 * 
 * To add a new holiday feed:
 * 1. Add the ICS URL to the server API route (src/app/api/holidays/[code]/route.ts)
 * 2. Add a new entry to the holidayFeeds array below with the country code
 * 3. Set a unique ID, name, and color
 * 4. Enable/disable as needed
 * 
 * Holiday sources are fetched server-side via Next.js API routes to avoid CORS issues.
 * The API route fetches from Google Calendar ICS feeds and caches for 24 hours.
 */

import { HolidayFeed } from '@/services/holidayService';

export const holidayFeeds: HolidayFeed[] = [
  {
    id: 'lebanon-official',
    name: 'Lebanon Official Holidays',
    countryCode: 'lebanon',
    color: '#FF6B6B', // Red for Lebanon
    enabled: true
  },
  
  // Example: Add more feeds as needed
  // {
  //   id: 'uae-holidays',
  //   name: 'UAE Public Holidays',
  //   countryCode: 'uae',
  //   color: '#00843D',
  //   enabled: false
  // },
];

/**
 * Export individual feed configs for easy access
 */
export const LEBANON_HOLIDAYS = holidayFeeds.find(f => f.id === 'lebanon-official')!;

/**
 * Get all enabled feeds
 */
export function getEnabledFeeds(): HolidayFeed[] {
  return holidayFeeds.filter(feed => feed.enabled);
}

/**
 * Holiday color constants
 */
export const HOLIDAY_COLORS = {
  lebanon: '#FF6B6B',
  uae: '#00843D',
  company: '#4A90E2',
  birthday: '#FFB347',
  anniversary: '#C589E8'
} as const;
