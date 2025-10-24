// src/components/BottomNav.tsx
"use client";

import { ViewType } from "@/types";
import { Calendar, ListTodo, Sparkles, StickyNote } from "lucide-react";
import { motion } from "framer-motion";

function capCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  /** New (optional): counts for badges */
  todayCount?: number;
  notesCount?: number;
}

export function BottomNav({
  currentView,
  onViewChange,
  todayCount = 0,
  notesCount = 0,
}: BottomNavProps) {
  const navItems: {
    view: ViewType;
    label: string;
    icon: React.ElementType;
  }[] = [
    { view: "today", label: "Today", icon: Sparkles },
    { view: "upcoming", label: "Upcoming", icon: ListTodo },
    { view: "notes", label: "Notes", icon: StickyNote },
    { view: "calendar", label: "Calendar", icon: Calendar },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom"
    >
      {/* Glass background with gradient */}
      <div className="relative glass-strong border-t border-white/10 dark:border-gray-700/50 shadow-elevated-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />

        <div className="relative flex justify-around px-2 py-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;

            // Only Today and Notes get badges
            let displayCount: string | null = null;
            if (item.view === "today") displayCount = capCount(todayCount);
            if (item.view === "notes") displayCount = capCount(notesCount);

            return (
              <motion.button
                key={item.view}
                onClick={() => onViewChange(item.view)}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl
                  transition-all duration-300
                  ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"}
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon + badge wrapper (badge anchors to icon) */}
                <div className="relative z-10">
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.2, 1] : 1,
                      rotate: isActive ? [0, -10, 10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>

                  {displayCount && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-3 h-4 min-w-[16px] px-1 rounded-full text-white text-[10px] leading-4 flex items-center justify-center shadow-lg z-20 bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10"
                    >
                      {displayCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <motion.span
                  animate={{ fontWeight: isActive ? 600 : 500 }}
                  className="relative z-10 text-xs"
                >
                  {item.label}
                </motion.span>

                {/* Glow effect for active tab */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-2xl glow-primary blur-sm"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
