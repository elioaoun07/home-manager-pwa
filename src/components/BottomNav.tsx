"use client";

import { ViewType } from "@/types";
import { Calendar, Filter, ListTodo, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
    { view: "today", label: "Today", icon: Sparkles },
    { view: "upcoming", label: "Upcoming", icon: ListTodo },
    { view: "calendar", label: "Calendar", icon: Calendar },
    { view: "categories", label: "Filters", icon: Filter },
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
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
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
                
                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    rotate: isActive ? [0, -10, 10, 0] : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                {/* Label */}
                <motion.span
                  animate={{
                    fontWeight: isActive ? 600 : 500,
                  }}
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
