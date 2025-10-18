/**
 * Holiday Service - Fetches public holidays from server-side API
 * 
 * This service provides a maintainable way to:
 * 1. Fetch holidays from server-side API (avoids CORS)
 * 2. Cache results in localStorage to minimize network requests
 * 3. Support multiple countries/regions
 * 4. Auto-refresh when cache expires
 */

export interface Holiday {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  description?: string;
  location?: string;
  isAllDay: boolean;
  type: 'fixed' | 'lunar' | 'other';
  source: string;
}

export interface HolidayFeed {
  id: string;
  name: string;
  countryCode: string; // Country code for API route (e.g., 'lebanon')
  color: string;
  enabled: boolean;
}

// Default holiday feeds
export const DEFAULT_HOLIDAY_FEEDS: HolidayFeed[] = [
  {
    id: 'lebanon-official',
    name: 'Lebanon Official Holidays',
    countryCode: 'lebanon',
    color: '#FF6B6B',
    enabled: true
  }
  // Add more feeds as needed:
  // { id: 'usa-federal', name: 'USA Federal Holidays', countryCode: 'usa', color: '#...' }
];

const CACHE_KEY_PREFIX = 'holiday_cache_';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedHolidays {
  holidays: Holiday[];
  cachedAt: number;
  feedId: string;
}

/**
 * Fetch holidays from server-side API
 */
export async function fetchHolidaysFromAPI(countryCode: string, feedId: string): Promise<Holiday[]> {
  try {
    const response = await fetch(`/api/holidays/${countryCode}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.statusText}`);
    }

      const data = await response.json();
      
      // Convert API response to Holiday objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const holidays: Holiday[] = data.events.map((event: any) => {
        const date = new Date(event.date);      // Determine if it's a lunar calendar event (Islamic holidays)
      const isLunar = event.title.toLowerCase().includes('eid') ||
                      event.title.toLowerCase().includes('ramadan') ||
                      event.title.toLowerCase().includes('muharram') ||
                      event.title.toLowerCase().includes('prophet');

      return {
        id: event.id,
        title: event.title,
        date,
        endDate: undefined, // Single day holidays
        description: undefined,
        location: undefined,
        isAllDay: event.allDay,
        type: isLunar ? 'lunar' : 'fixed',
        source: feedId
      };
    });

    return holidays;
  } catch (error) {
    console.error('Error fetching holidays from API:', error);
    throw error;
  }
}

/**
 * Get holidays from cache or fetch if expired
 */
export async function getHolidays(feed: HolidayFeed, forceRefresh = false): Promise<Holiday[]> {
  const cacheKey = `${CACHE_KEY_PREFIX}${feed.id}`;

  if (!forceRefresh) {
    const cached = getCachedHolidays(cacheKey);
    if (cached) {
      console.log(`Using cached holidays for ${feed.name}`);
      return cached.holidays;
    }
  }

  console.log(`Fetching fresh holidays for ${feed.name}...`);
  try {
    const holidays = await fetchHolidaysFromAPI(feed.countryCode, feed.id);
    
    // Cache the results
    cacheHolidays(cacheKey, holidays, feed.id);
    
    return holidays;
  } catch (error) {
    console.error(`Failed to fetch holidays for ${feed.name}:`, error);
    
    // Try to return stale cache if available
    const staleCache = getCachedHolidays(cacheKey, true);
    if (staleCache) {
      console.log(`Using stale cache for ${feed.name}`);
      return staleCache.holidays;
    }
    
    return [];
  }
}

/**
 * Get holidays from cache if valid
 */
function getCachedHolidays(cacheKey: string, allowStale = false): CachedHolidays | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const data: CachedHolidays = JSON.parse(cached);
    
    // Rehydrate Date objects
    data.holidays = data.holidays.map(h => ({
      ...h,
      date: new Date(h.date),
      endDate: h.endDate ? new Date(h.endDate) : undefined
    }));

    // Check if cache is still valid
    const age = Date.now() - data.cachedAt;
    if (!allowStale && age > CACHE_DURATION_MS) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cached holidays:', error);
    return null;
  }
}

/**
 * Save holidays to cache
 */
function cacheHolidays(cacheKey: string, holidays: Holiday[], feedId: string): void {
  try {
    const cacheData: CachedHolidays = {
      holidays,
      cachedAt: Date.now(),
      feedId
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching holidays:', error);
  }
}

/**
 * Clear holiday cache
 */
export function clearHolidayCache(feedId?: string): void {
  try {
    if (feedId) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${feedId}`);
    } else {
      // Clear all holiday caches
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing holiday cache:', error);
  }
}

/**
 * Get holidays for a specific date range
 */
export function getHolidaysInRange(
  holidays: Holiday[],
  startDate: Date,
  endDate: Date
): Holiday[] {
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
}

/**
 * Get holidays for a specific date
 */
export function getHolidaysForDate(holidays: Holiday[], date: Date): Holiday[] {
  return holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return (
      holidayDate.getDate() === date.getDate() &&
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getFullYear() === date.getFullYear()
    );
  });
}

/**
 * Check if a specific date is a holiday
 */
export function isHoliday(holidays: Holiday[], date: Date): boolean {
  return getHolidaysForDate(holidays, date).length > 0;
}
