/**
 * useHolidays Hook - React hook for managing holiday data
 * 
 * Features:
 * - Automatic loading and caching
 * - Manual refresh capability
 * - Loading and error states
 * - Multiple feed support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Holiday,
  HolidayFeed,
  DEFAULT_HOLIDAY_FEEDS,
  getHolidays,
  clearHolidayCache
} from '@/services/holidayService';

interface UseHolidaysOptions {
  feeds?: HolidayFeed[];
  autoLoad?: boolean;
}

interface UseHolidaysReturn {
  holidays: Holiday[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export function useHolidays(options: UseHolidaysOptions = {}): UseHolidaysReturn {
  const { feeds = DEFAULT_HOLIDAY_FEEDS, autoLoad = true } = options;
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadHolidays = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const enabledFeeds = feeds.filter(feed => feed.enabled);
      
      // Fetch holidays from all enabled feeds in parallel
      const results = await Promise.allSettled(
        enabledFeeds.map(feed => getHolidays(feed, forceRefresh))
      );

      // Combine all successful results
      const allHolidays: Holiday[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allHolidays.push(...result.value);
        } else {
          console.error(
            `Failed to load holidays from ${enabledFeeds[index].name}:`,
            result.reason
          );
        }
      });

      // Sort by date
      allHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

      setHolidays(allHolidays);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load holidays');
      setError(error);
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  }, [feeds]);

  const refresh = useCallback(async () => {
    await loadHolidays(true);
  }, [loadHolidays]);

  const clearCache = useCallback(() => {
    feeds.forEach(feed => clearHolidayCache(feed.id));
    loadHolidays(true);
  }, [feeds, loadHolidays]);

  useEffect(() => {
    if (autoLoad) {
      loadHolidays();
    }
  }, [autoLoad, loadHolidays]);

  return {
    holidays,
    loading,
    error,
    refresh,
    clearCache
  };
}
