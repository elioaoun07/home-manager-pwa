"use client";

import { useState, useMemo } from "react";
import { ItemWithDetails, Priority } from "@/types";
import { ItemCard } from "./ItemCard";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Filter, LayoutGrid, Rows3, CalendarDays, X } from "lucide-react";
import { useHolidays } from "@/hooks/useHolidays";
import { getHolidaysForDate } from "@/services/holidayService";
import { holidayFeeds, HOLIDAY_COLORS } from "@/config/holidayFeeds";

// Holiday color constant
const HOLIDAY_COLOR = HOLIDAY_COLORS.lebanon;

interface CalendarViewNewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  categories: { id: string; name: string; color_hex?: string }[];
  viewDensity?: "compact" | "comfy";
}

type ViewMode = "month" | "week" | "3day";

export function CalendarViewNew({ items, onToggleComplete, onEdit, onDelete, categories, viewDensity = "comfy" }: CalendarViewNewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Special event filters (default: public holidays shown)
  const [showPublicHolidays, setShowPublicHolidays] = useState(true);
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showAnniversaries, setShowAnniversaries] = useState(false);

  // Load holidays dynamically from ICS feed
  const { holidays: publicHolidays, loading: holidaysLoading, error: holidaysError } = useHolidays({
    feeds: holidayFeeds
  });

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => !item.archived_at);
    
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.type));
    }
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(item => selectedPriorities.includes(item.priority));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => 
        item.categories?.some(cat => selectedCategories.includes(cat.id))
      );
    }
    
    return filtered;
  }, [items, selectedTypes, selectedPriorities, selectedCategories]);

  // Get items for a specific date (including holidays if enabled)
  const getItemsForDate = (date: Date) => {
    const userItems = filteredItems.filter(item => {
      const itemDate = item.type === "event" && item.event_details?.start_at
        ? new Date(item.event_details.start_at)
        : item.type === "reminder" && item.reminder_details?.due_at
        ? new Date(item.reminder_details.due_at)
        : null;
      
      if (!itemDate) return false;
      
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });

    // Add public holidays if filter is enabled
    let holidays: ItemWithDetails[] = [];
    if (showPublicHolidays && publicHolidays.length > 0) {
      const matchingHolidays = getHolidaysForDate(publicHolidays, date);

      holidays = matchingHolidays.map(holiday => ({
        id: `holiday-${holiday.id}`,
        user_id: 'system',
        title: `🇱🇧 ${holiday.title}`,
        type: 'event' as const,
        priority: 'normal' as Priority,
        is_public: true,
        responsible_user_id: 'system',
        created_at: holiday.date.toISOString(),
        updated_at: holiday.date.toISOString(),
        event_details: {
          item_id: `holiday-${holiday.id}`,
          start_at: holiday.date.toISOString(),
          end_at: new Date(holiday.date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          all_day: true,
          location_text: 'Lebanon'
        },
        categories: [{
          id: 'public-holiday',
          user_id: 'system',
          name: 'Public Holiday',
          color_hex: HOLIDAY_COLOR,
          created_at: holiday.date.toISOString(),
          updated_at: holiday.date.toISOString()
        }]
      } as ItemWithDetails));
    }

    // Combine and sort all items
    const allItems = [...userItems, ...holidays];
    return allItems.sort((a, b) => {
      const timeA = a.type === "event" ? new Date(a.event_details!.start_at).getTime() : 
                    a.reminder_details?.due_at ? new Date(a.reminder_details.due_at).getTime() : 0;
      const timeB = b.type === "event" ? new Date(b.event_details!.start_at).getTime() : 
                    b.reminder_details?.due_at ? new Date(b.reminder_details.due_at).getTime() : 0;
      return timeA - timeB;
    });
  };

  // Generate dates based on view mode
  const getDates = () => {
    const dates: Date[] = [];
    const today = new Date(currentDate);
    
    if (viewMode === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = new Date(firstDay);
      // Start from Monday (1 = Monday, 0 = Sunday)
      const dayOfWeek = firstDay.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToSubtract);
      
      for (let i = 0; i < 35; i++) {
        dates.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
      }
    } else if (viewMode === "week") {
      const startOfWeek = new Date(today);
      // Start from Monday
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(today.getDate() - daysToSubtract);
      
      for (let i = 0; i < 7; i++) {
        dates.push(new Date(startOfWeek));
        startOfWeek.setDate(startOfWeek.getDate() + 1);
      }
    } else { // 3day
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      dates.push(yesterday);
      dates.push(new Date(today));
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dates.push(tomorrow);
    }
    
    return dates;
  };

  const dates = getDates();

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 3 : -3));
    }
    setCurrentDate(newDate);
  };

  const getHeaderText = () => {
    const month = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (viewMode === "month") return month;
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.getDate()}, ${lastDate.getFullYear()}`;
    }
    return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const activeFilterCount = selectedTypes.length + selectedPriorities.length + selectedCategories.length;

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
              <Calendar size={24} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">Calendar</h2>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const userItemCount = filteredItems.filter(i => {
                    const d = i.type === "event" ? i.event_details?.start_at : i.reminder_details?.due_at;
                    return d;
                  }).length;
                  const holidayCount = showPublicHolidays ? publicHolidays.length : 0;
                  const loadingText = holidaysLoading ? ' (loading holidays...)' : '';
                  return `${userItemCount + holidayCount} scheduled items${showPublicHolidays && holidayCount > 0 ? ` (incl. ${holidayCount} holidays)` : ''}${loadingText}`;
                })()}
              </p>
            </div>
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary text-white shadow-lg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <button
                    onClick={() => {
                      setSelectedTypes([]);
                      setSelectedPriorities([]);
                      setSelectedCategories([]);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X size={12} />
                    Clear all
                  </button>
                </div>

                {/* Special Events Filters */}
                <div className="border-b border-border pb-3">
                  <label className="text-xs text-muted-foreground mb-2 block">Special Events</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={showPublicHolidays}
                        onChange={(e) => setShowPublicHolidays(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-xs font-medium group-hover:text-primary transition-colors flex items-center gap-1.5">
                        🇱🇧 Public Holidays
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: HOLIDAY_COLOR, color: 'white' }}>
                          Lebanon
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group opacity-50">
                      <input
                        type="checkbox"
                        checked={showBirthdays}
                        onChange={(e) => setShowBirthdays(e.target.checked)}
                        disabled
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        🎂 Birthdays
                        <span className="text-[9px] text-muted-foreground">(Coming soon)</span>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group opacity-50">
                      <input
                        type="checkbox"
                        checked={showAnniversaries}
                        onChange={(e) => setShowAnniversaries(e.target.checked)}
                        disabled
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        💍 Anniversaries
                        <span className="text-[9px] text-muted-foreground">(Coming soon)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {["reminder", "event"].map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedTypes(prev =>
                          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedTypes.includes(type)
                            ? 'bg-primary text-white'
                            : 'bg-background border border-border text-muted-foreground'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                  <div className="flex gap-2">
                    {(["urgent", "high", "normal", "low"] as Priority[]).map(priority => (
                      <button
                        key={priority}
                        onClick={() => setSelectedPriorities(prev =>
                          prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
                        )}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedPriorities.includes(priority)
                            ? 'bg-primary text-white'
                            : 'bg-background border border-border text-muted-foreground'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategories(prev =>
                            prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategories.includes(cat.id)
                              ? 'text-white'
                              : 'bg-background border border-border text-muted-foreground'
                          }`}
                          style={selectedCategories.includes(cat.id) ? {
                            backgroundColor: cat.color_hex || '#6366f1'
                          } : {}}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Mode Selector & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode("3day")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "3day" ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <Rows3 size={14} className="inline mr-1" />
              3 Days
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "week" ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <CalendarDays size={14} className="inline mr-1" />
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "month" ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <LayoutGrid size={14} className="inline mr-1" />
              Month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold">{getHeaderText()}</h3>
      </motion.div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {viewMode === "month" ? (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            {/* Month grid - Matches reference image styling */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {dates.map((date, index) => {
                const dayItems = getItemsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isSelected = selectedDay?.toDateString() === date.toDateString();
                
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDay(null);
                      } else {
                        setSelectedDay(date);
                      }
                    }}
                    className={`min-h-16 p-1.5 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                        : isToday(date)
                        ? 'bg-primary/10 border-primary'
                        : isCurrentMonth
                        ? 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                        : 'bg-muted/30 border-transparent text-muted-foreground'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-xs font-bold mb-1 flex-shrink-0 ${isToday(date) || isSelected ? 'text-primary' : ''}`}>
                        {date.getDate()}
                      </div>
                      {dayItems.length > 0 && (
                        <div className="space-y-0.5 flex-1 overflow-hidden">
                          {dayItems.slice(0, 2).map(item => {
                            const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                            return (
                              <div
                                key={item.id}
                                className="text-[9px] px-1.5 py-0.5 rounded-md truncate font-semibold"
                                style={{ 
                                  backgroundColor: categoryColor,
                                  color: 'white'
                                }}
                                title={item.title}
                              >
                                {item.title}
                              </div>
                            );
                          })}
                          {dayItems.length > 2 && (
                            <div className="text-[8px] text-muted-foreground font-medium px-1">
                              +{dayItems.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-blue/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xs font-medium uppercase text-muted-foreground">
                            {selectedDay.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-3xl font-bold text-primary">
                            {selectedDay.getDate()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="border-l pl-3">
                          <h3 className="text-lg font-semibold">
                            {getItemsForDate(selectedDay).length} {getItemsForDate(selectedDay).length === 1 ? 'Item' : 'Items'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isToday(selectedDay) ? 'Today' : selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {getItemsForDate(selectedDay).length > 0 ? (
                        getItemsForDate(selectedDay).map((item, idx) => {
                          const isHoliday = item.id.startsWith('holiday-');
                          
                          if (isHoliday) {
                            // Special read-only display for holidays
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 rounded-lg border-2"
                                style={{ 
                                  borderColor: HOLIDAY_COLOR,
                                  backgroundColor: `${HOLIDAY_COLOR}10`
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">🇱🇧</div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-base mb-1" style={{ color: HOLIDAY_COLOR }}>
                                      {item.title.replace('🇱🇧 ', '')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Lebanese Public Holiday • All Day
                                    </p>
                                    {item.event_details?.location_text && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        📍 {item.event_details.location_text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          
                          return (
                            <div key={item.id}>
                              <ItemCard
                                item={item}
                                onToggleComplete={onToggleComplete}
                                onView={onEdit}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                viewDensity={viewDensity}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No items scheduled for this day
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Horizontal Timeline view for Week/3Day - Optimized for mobile */
          <div className="space-y-2 overflow-x-auto">
            {/* Day headers */}
            <div className="grid gap-px sticky top-0 bg-background z-10 pb-1 border-b-2" style={{ gridTemplateColumns: `32px repeat(${dates.length}, 1fr)`, minWidth: dates.length === 7 ? '100%' : 'auto' }}>
              <div className="border-r"></div> {/* Empty corner for time column */}
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={`text-center py-2 border-r ${
                    isToday(date)
                      ? 'bg-primary/10 border-primary'
                      : ''
                  }`}
                >
                  <div className={`text-[10px] font-medium uppercase ${isToday(date) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-xl font-bold ${isToday(date) ? 'text-primary' : ''}`}>
                    {date.getDate()}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline grid with hours */}
            <div className="space-y-0">
              {/* All day section */}
              <div className="grid gap-px" style={{ gridTemplateColumns: `32px repeat(${dates.length}, 1fr)`, minWidth: dates.length === 7 ? '100%' : 'auto' }}>
                <div className="flex items-center justify-center text-[8px] font-bold text-muted-foreground py-1 border-r writing-mode-vertical">
                  
                </div>
                {dates.map((date, dateIndex) => {
                  const allDayItems = getItemsForDate(date).filter(item => 
                    item.type === "event" && item.event_details?.all_day
                  );
                  return (
                    <div key={dateIndex} className={`min-h-8 p-1 border-b border-r ${isToday(date) ? 'bg-primary/5' : ''}`}>
                      {allDayItems.map(item => {
                        const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                        return (
                          <div
                            key={item.id}
                            onClick={() => onEdit(item)}
                            className="text-[10px] px-1.5 py-1 mb-1 rounded cursor-pointer hover:brightness-110 truncate font-semibold leading-tight"
                            style={{ 
                              backgroundColor: categoryColor,
                              color: 'white'
                            }}
                          >
                            {item.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Hourly time slots (0 to 23 - 24 hour format) */}
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                return (
                  <div
                    key={hour}
                    className="grid gap-px"
                    style={{ gridTemplateColumns: `32px repeat(${dates.length}, 1fr)`, minWidth: dates.length === 7 ? '100%' : 'auto' }}
                  >
                    <div className="flex items-start justify-center text-[9px] text-muted-foreground font-bold pt-1 border-r">
                      {hour.toString().padStart(2, '0')}
                    </div>
                    {dates.map((date, dateIndex) => {
                      const hourItems = getItemsForDate(date).filter(item => {
                        if (item.type === "event" && item.event_details && !item.event_details.all_day) {
                          const startTime = new Date(item.event_details.start_at);
                          return startTime.getHours() === hour;
                        }
                        if (item.type === "reminder" && item.reminder_details?.due_at) {
                          const dueTime = new Date(item.reminder_details.due_at);
                          return dueTime.getHours() === hour;
                        }
                        return false;
                      });

                      return (
                        <div
                          key={dateIndex}
                          className={`min-h-16 p-1 border-b border-r ${
                            isToday(date) ? 'bg-primary/5' : ''
                          } hover:bg-muted/30 transition-colors relative overflow-hidden`}
                        >
                          <div className="space-y-1 w-full">
                            {hourItems.map(item => {
                              const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                              const startTime = item.type === "event" && item.event_details
                                ? new Date(item.event_details.start_at)
                                : item.reminder_details?.due_at
                                ? new Date(item.reminder_details.due_at)
                                : null;
                              
                              const endTime = item.type === "event" && item.event_details
                                ? new Date(item.event_details.end_at)
                                : null;

                              const duration = endTime && startTime
                                ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10
                                : 0;

                              // Show duration indicator only for events > 1 hour
                              const showDurationBar = duration > 1;

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => onEdit(item)}
                                  className="text-[10px] px-1.5 py-1.5 mb-1 rounded cursor-pointer hover:brightness-110 transition-all w-full leading-tight"
                                  style={{ 
                                    backgroundColor: categoryColor,
                                    color: 'white'
                                  }}
                                >
                                  <div className="font-semibold line-clamp-2">
                                    {item.title}
                                  </div>
                                  {startTime && (
                                    <div className="text-[8px] opacity-80 mt-0.5">
                                      {startTime.toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
