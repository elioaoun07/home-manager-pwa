"use client";

import { ItemWithDetails } from "@/types";
import { SwipeableItemCard } from "./SwipeableItemCard";
import { isOverdue, isSameDay, getTimeOfDay, getItemDate } from "@/lib/utils";
import { Sun, Sunset, Moon, AlertTriangle, Sparkles, Trophy, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface TodayViewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  viewDensity?: "compact" | "comfy";
}

export function TodayView({ items, onToggleComplete, onEdit, onDelete, viewDensity = "comfy" }: TodayViewProps) {
  const today = new Date();
  
  // State for collapsible sections (collapsed by default: overdue, completed)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["overdue", "completed"]));

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };
  
  const todayItems = items.filter((item) => {
    const itemDate = getItemDate(item);
    return itemDate && isSameDay(itemDate, today);
  });

  const overdueItems = items.filter((item) => isOverdue(item));

  const morningItems = todayItems.filter((item) => {
    const date = getItemDate(item);
    return date && getTimeOfDay(date) === "morning" && item.status !== 'done';
  });

  const afternoonItems = todayItems.filter((item) => {
    const date = getItemDate(item);
    return date && getTimeOfDay(date) === "afternoon" && item.status !== 'done';
  });

  const eveningItems = todayItems.filter((item) => {
    const date = getItemDate(item);
    return date && getTimeOfDay(date) === "evening" && item.status !== 'done';
  });

  // Completed items for Today (show in collapsed container by default)
  const completedItems = todayItems.filter(i => i.status === 'done');

  const completedToday = todayItems.filter(i => i.status === 'done').length;
  const totalToday = todayItems.length;
  const progress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const renderSection = (
    title: string, 
    sectionItems: ItemWithDetails[], 
    icon: React.ReactNode, 
    gradient: string,
    highlight = false
  ) => {
    if (sectionItems.length === 0) return null;

    const sectionKey = title.toLowerCase().replace(/\s+/g, '-');
    const isCollapsed = collapsedSections.has(sectionKey);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <motion.button
          onClick={() => toggleSection(sectionKey)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`
            w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl
            transition-all hover:scale-[1.02] cursor-pointer
            ${highlight 
              ? 'glass-strong border border-destructive/30 shadow-lg' 
              : 'glass border border-white/10 dark:border-gray-700/50'
            }
          `}
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            className={`
              p-2.5 rounded-xl bg-gradient-to-br ${gradient}
              ${highlight ? 'shadow-lg' : ''}
            `}
          >
            {icon}
          </motion.div>
          
          <div className="flex-1 text-left">
            <h2 className={`
              text-base font-bold uppercase tracking-wider
              ${highlight ? "text-destructive" : "text-foreground"}
            `}>
              {title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Collapse/Expand Icon */}
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-muted-foreground" />
          </motion.div>

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`
              px-3 py-1.5 rounded-xl text-sm font-bold
              ${highlight 
                ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                : 'bg-primary/10 text-primary border border-primary/20'
              }
            `}
          >
            {sectionItems.length}
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-0 overflow-hidden"
            >
              <AnimatePresence mode="popLayout">
                {sectionItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ 
                  delay: index * 0.05,
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const hasAnyItems = overdueItems.length > 0 || todayItems.length > 0;

  return (
    <div className="pb-24">
      {/* Progress Card */}
      {totalToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mb-6 p-6 rounded-3xl glass-strong border border-white/10 dark:border-gray-700/50 shadow-elevated-lg overflow-hidden relative"
        >
          <div className="gradient-mesh absolute inset-0 opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-gradient"
                >
                  Today&apos;s Progress
                </motion.h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedToday} of {totalToday} tasks completed
                </p>
              </div>
              
              <motion.div
                animate={{
                  rotate: progress === 100 ? [0, 360] : 0,
                  scale: progress === 100 ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                className="p-3 rounded-2xl bg-gradient-primary text-white shadow-lg"
              >
                {progress === 100 ? <Trophy size={24} /> : <Sparkles size={24} />}
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full bg-gradient-primary rounded-full relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['- 100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-right text-sm font-semibold text-primary mt-2"
            >
              {Math.round(progress)}%
            </motion.p>
          </div>
        </motion.div>
      )}

      {!hasAnyItems && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-center py-20 px-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-primary opacity-20 blur-2xl" />
          </motion.div>
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4"
          >
            <Trophy size={64} className="mx-auto text-primary opacity-50" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gradient mb-2">All clear for today! 🎉</h3>
          <p className="text-muted-foreground text-base">
            Use Quick Add to create your first item
          </p>
        </motion.div>
      )}

      {renderSection(
        "Overdue", 
        overdueItems, 
        <AlertTriangle size={20} className="text-white" />,
        "from-destructive to-destructive/70",
        true
      )}
      
      {renderSection(
        "Morning", 
        morningItems, 
        <Sun size={20} className="text-white" />,
        "from-warning to-warning/70"
      )}
      
      {renderSection(
        "Afternoon", 
        afternoonItems, 
        <Sunset size={20} className="text-white" />,
        "from-info to-info/70"
      )}
      
      {renderSection(
        "Evening", 
        eveningItems, 
        <Moon size={20} className="text-white" />,
        "from-primary to-primary/70"
      )}

      {renderSection(
        "Completed",
        completedItems,
        <Trophy size={20} className="text-white" />,
        "from-success to-success/70"
      )}
    </div>
  );
}
