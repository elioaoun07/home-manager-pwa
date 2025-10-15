"use client";

import { useState, useMemo } from "react";
import { ItemWithDetails, Priority } from "@/types";
import { ItemCard } from "./ItemCard";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Filter, LayoutGrid, Rows3, CalendarDays, X } from "lucide-react";

interface CalendarViewNewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  categories: { id: string; name: string; color_hex?: string }[];
}

type ViewMode = "month" | "week" | "3day";

export function CalendarViewNew({ items, onToggleComplete, onEdit, onDelete, categories }: CalendarViewNewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    return filteredItems.filter(item => {
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
    }).sort((a, b) => {
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
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
      
      for (let i = 0; i < 35; i++) {
        dates.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
      }
    } else if (viewMode === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      
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
                {filteredItems.filter(i => {
                  const d = i.type === "event" ? i.event_details?.start_at : i.reminder_details?.due_at;
                  return d;
                }).length} scheduled items
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
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
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
                    className={`min-h-20 p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                        : isToday(date)
                        ? 'bg-primary/10 border-primary'
                        : isCurrentMonth
                        ? 'bg-card border-border hover:border-primary/50 hover:shadow-md'
                        : 'bg-muted/30 border-transparent text-muted-foreground'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday(date) || isSelected ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </div>
                    {dayItems.length > 0 && (
                      <div className="space-y-0.5">
                        {dayItems.slice(0, 2).map(item => {
                          const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                          return (
                            <div
                              key={item.id}
                              className="text-[10px] px-1.5 py-0.5 rounded truncate pointer-events-none flex items-center gap-0.5"
                              style={{ 
                                backgroundColor: `${categoryColor}20`,
                                borderLeft: `2px solid ${categoryColor}`,
                                color: categoryColor
                              }}
                            >
                              <span className="text-[8px]">{item.type === "event" ? "📅" : "⏰"}</span>
                              <span className="font-medium">{item.title}</span>
                            </div>
                          );
                        })}
                        {dayItems.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayItems.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
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
                        getItemsForDate(selectedDay).map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <ItemCard
                              item={item}
                              onToggleComplete={onToggleComplete}
                              onView={onEdit}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          </motion.div>
                        ))
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
          /* Horizontal Timeline view for Week/3Day - Outlook style */
          <div className="space-y-3">
            {/* Day headers */}
            <div className="grid gap-0.5 sticky top-0 bg-background z-10 pb-1 border-b-2" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
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
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
                <div className="flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground py-1 border-r">
                  All Day
                </div>
                {dates.map((date, dateIndex) => {
                  const allDayItems = getItemsForDate(date).filter(item => 
                    item.type === "event" && item.event_details?.all_day
                  );
                  return (
                    <div key={dateIndex} className={`min-h-8 p-0.5 border-b border-r ${isToday(date) ? 'bg-primary/5' : ''}`}>
                      {allDayItems.map(item => {
                        const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                        return (
                          <div
                            key={item.id}
                            onClick={() => onEdit(item)}
                            className="text-[10px] px-1.5 py-0.5 mb-0.5 rounded cursor-pointer hover:opacity-80 truncate flex items-center gap-1"
                            style={{ 
                              backgroundColor: `${categoryColor}20`,
                              borderLeft: `3px solid ${categoryColor}`,
                              color: categoryColor
                            }}
                          >
                            <span className="text-[8px]">📅</span>
                            <span className="font-medium">{item.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Hourly time slots (6 AM to 10 PM) */}
              {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => {
                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                const period = hour >= 12 ? 'PM' : 'AM';
                
                return (
                  <div
                    key={hour}
                    className="grid gap-0.5"
                    style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}
                  >
                    <div className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground font-medium pt-0.5 border-r">
                      {displayHour}:00 {period}
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
                          className={`min-h-12 p-0.5 border-b border-r ${
                            isToday(date) ? 'bg-primary/5' : ''
                          } hover:bg-muted/30 transition-colors relative overflow-hidden`}
                        >
                          <div className="space-y-0.5 w-full">
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
                                  className="text-[10px] px-1.5 py-1 rounded cursor-pointer hover:opacity-80 transition-all relative overflow-hidden w-full max-w-full"
                                  style={{ 
                                    backgroundColor: `${categoryColor}15`,
                                    borderLeft: `3px solid ${categoryColor}`,
                                    color: categoryColor
                                  }}
                                >
                                  {/* Duration indicator bar (vertical stripe pattern for long events) */}
                                  {showDurationBar && (
                                    <div 
                                      className="absolute top-0 right-0 bottom-0 w-1 opacity-40"
                                      style={{ 
                                        backgroundColor: categoryColor,
                                        height: '100%'
                                      }}
                                    />
                                  )}
                                  
                                  <div className="font-medium flex items-center gap-1 min-w-0">
                                    <span className="text-[8px] flex-shrink-0">{item.type === "event" ? "📅" : "⏰"}</span>
                                    <span className="flex-1 truncate min-w-0">{item.title}</span>
                                    {showDurationBar && (
                                      <span className="text-[8px] opacity-60 flex-shrink-0">{duration}h</span>
                                    )}
                                  </div>
                                  {startTime && (
                                    <div className="text-[9px] opacity-70 ml-3 truncate">
                                      {startTime.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      })}
                                      {endTime && ` - ${endTime.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      })}`}
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

              {/* Items without specific time (reminders without due_at shown at bottom) */}
              <div className="grid gap-0.5 mt-2" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
                <div className="flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground py-1 border-r">
                  No Time
                </div>
                {dates.map((date, dateIndex) => {
                  const noTimeItems = getItemsForDate(date).filter(item => {
                    if (item.type === "event") return false; // Events always have time
                    return !item.reminder_details?.due_at; // Notes without due time
                  });
                  return (
                    <div key={dateIndex} className={`min-h-8 p-0.5 border-b border-r ${isToday(date) ? 'bg-primary/5' : ''}`}>
                      {noTimeItems.map(item => {
                        const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
                        return (
                          <div
                            key={item.id}
                            onClick={() => onEdit(item)}
                            className="text-[10px] px-1.5 py-0.5 mb-0.5 rounded cursor-pointer hover:opacity-80 truncate flex items-center gap-1"
                            style={{ 
                              backgroundColor: `${categoryColor}20`,
                              borderLeft: `3px solid ${categoryColor}`,
                              color: categoryColor
                            }}
                          >
                            <span className="text-[8px]">📝</span>
                            <span className="font-medium">{item.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
