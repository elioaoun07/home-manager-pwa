"use client";

import { useState } from "react";
import { Item } from "@/types";
import { getMonthData, isSameDay, getItemDate } from "@/lib/utils";
import { ItemCard } from "./ItemCard";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from "lucide-react";

interface CalendarViewProps {
  items: Item[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function CalendarView({ items, onToggleComplete, onEdit, onDelete }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthData(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const getItemsForDate = (date: Date): Item[] => {
    return items.filter((item) => {
      const itemDate = getItemDate(item);
      return itemDate && isSameDay(itemDate, date);
    });
  };

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

  return (
    <div className="pb-20">
      {/* Month Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 glass p-4 rounded-2xl border border-white/20 dark:border-gray-700/50"
      >
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevMonth}
            className="p-2.5 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-primary shadow-elevated">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-lg gradient-text">
              {currentDate.toLocaleDateString([], { month: "long", year: "numeric" })}
            </h2>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextMonth}
            className="p-2.5 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Calendar Grid Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-4 rounded-2xl border border-white/20 dark:border-gray-700/50 mb-6"
      >
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </motion.div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayItems = getItemsForDate(date);
            const hasItems = dayItems.length > 0;
            const completedCount = dayItems.filter(i => i.completed).length;
            const allCompleted = hasItems && completedCount === dayItems.length;

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded-xl relative transition-all
                  ${isCurrentMonth ? "text-foreground" : "text-muted-foreground/30"}
                  ${isToday ? "gradient-primary text-white font-bold shadow-elevated glow-primary" : 
                    isSelected ? "bg-primary/20 border-2 border-primary shadow-elevated" : 
                    "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                `}
              >
                <span className={`text-sm ${isToday ? "text-white" : ""}`}>
                  {date.getDate()}
                </span>
                
                {/* Item indicators */}
                {hasItems && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayItems.slice(0, 3).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.01 + i * 0.05 }}
                        className={`
                          w-1.5 h-1.5 rounded-full
                          ${item.completed ? 
                            "bg-success shadow-[0_0_4px_rgba(34,197,94,0.5)]" : 
                            isToday ? "bg-white" : "bg-primary shadow-[0_0_4px_rgba(168,85,247,0.5)]"}
                        `}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <div className={`
                        w-1.5 h-1.5 rounded-full
                        ${isToday ? "bg-white/50" : "bg-muted-foreground/50"}
                      `} />
                    )}
                  </div>
                )}

                {/* All completed badge */}
                {allCompleted && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <div className="bg-success rounded-full p-0.5 shadow-elevated">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day items */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Date Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-4 ml-1"
            >
              <div className={`
                w-1 h-10 rounded-full
                ${isSameDay(selectedDate, new Date()) ? 
                  'gradient-primary shadow-elevated glow-primary' : 
                  'bg-gradient-to-b from-purple-500/50 to-blue-500/50'}
              `} />
              <div>
                <h3 className="font-semibold gradient-text">
                  {selectedDate.toLocaleDateString([], { 
                    weekday: "long", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </h3>
                {selectedItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} · {" "}
                    {selectedItems.filter(i => i.completed).length} completed
                  </p>
                )}
              </div>
            </motion.div>

            {/* Items or Empty State */}
            {selectedItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-2xl border border-white/20 dark:border-gray-700/50 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="inline-block mb-3 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10"
                >
                  <Calendar className="w-8 h-8 text-muted-foreground/50" />
                </motion.div>
                <p className="text-sm text-muted-foreground">No items for this day</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {selectedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                    >
                      <ItemCard
                        item={item}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
