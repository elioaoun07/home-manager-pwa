"use client";

import { ItemWithDetails } from "@/types";
import { SwipeableItemCard } from "./SwipeableItemCard";
import { getItemDate } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";

interface UpcomingViewProps {
  items: ItemWithDetails[];
  days: number; // 7 or 30
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
  viewDensity?: "compact" | "comfy";
}

export function UpcomingView({ items, days, onToggleComplete, onEdit, onDelete, viewDensity = "comfy" }: UpcomingViewProps) {
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcomingItems = items
    .filter((item) => {
      const itemDate = getItemDate(item);
      if (!itemDate) return false;
      return itemDate > now && itemDate <= endDate;
    })
    .sort((a, b) => {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

  // Group by date
  const groupedItems = upcomingItems.reduce((acc, item) => {
    const itemDate = getItemDate(item);
    if (!itemDate) return acc;
    
    const dateKey = itemDate.toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = { date: itemDate, items: [] };
    }
    acc[dateKey].items.push(item);
    return acc;
  }, {} as Record<string, { date: Date; items: ItemWithDetails[] }>);

  const groups = Object.values(groupedItems).sort((a, b) => a.date.getTime() - b.date.getTime());

  const getDaysUntil = (date: Date) => {
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="pb-24">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 glass p-4 rounded-2xl border border-white/20 dark:border-gray-700/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-primary shadow-elevated">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold gradient-text">Next {days} Days</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {upcomingItems.length} scheduled {upcomingItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          {upcomingItems.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="text-xs font-medium text-primary">
                {upcomingItems.filter(i => i.status !== 'done' && i.status !== 'cancelled').length} pending
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Empty State */}
      {groups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              y: [0, -10, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-block mb-4 p-6 rounded-3xl gradient-primary shadow-elevated-lg glow-primary"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <p className="text-lg font-semibold gradient-text mb-2">All Clear!</p>
          <p className="text-muted-foreground text-sm">
            Nothing scheduled for the next {days} days
          </p>
        </motion.div>
      )}

      {/* Date Groups */}
      {groups.map((group, groupIndex) => {
        const daysUntil = getDaysUntil(group.date);
        const isToday = daysUntil === 0;
        const isTomorrow = daysUntil === 1;
        
        let dateLabel = group.date.toLocaleDateString([], { 
          weekday: "long", 
          month: "short", 
          day: "numeric" 
        });
        
        if (isToday) dateLabel = "Today · " + dateLabel;
        else if (isTomorrow) dateLabel = "Tomorrow · " + dateLabel;
        else dateLabel = `In ${daysUntil} days · ` + dateLabel;

        return (
          <motion.div
            key={group.date.toISOString()}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="mb-6"
          >
            {/* Date Header */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: groupIndex * 0.1 + 0.1 }}
              className="flex items-center gap-2 mb-3 ml-1"
            >
              <div className={`
                w-1 h-8 rounded-full
                ${isToday ? 'gradient-primary shadow-elevated glow-primary' : 
                  isTomorrow ? 'bg-gradient-to-b from-blue-500 to-cyan-500 shadow-elevated' : 
                  'bg-gradient-to-b from-purple-500/50 to-blue-500/50'}
              `} />
              <div>
                <h3 className={`
                  text-sm font-semibold
                  ${isToday || isTomorrow ? 'gradient-text' : 'text-foreground/90'}
                `}>
                  {dateLabel}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </motion.div>

            {/* Items */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      delay: groupIndex * 0.1 + itemIndex * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <SwipeableItemCard
                      item={item}
                      onToggleComplete={onToggleComplete}
                      onView={onEdit}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      viewDensity={viewDensity}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
