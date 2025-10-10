"use client";

import { useState } from "react";
import { Item, Priority } from "@/types";
import { ItemCard } from "./ItemCard";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Tag, AlertCircle, X } from "lucide-react";

interface CategoriesViewProps {
  items: Item[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function CategoriesView({ items, onToggleComplete, onEdit, onDelete }: CategoriesViewProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);

  // Get all unique categories
  const allCategories = Array.from(
    new Set(items.flatMap((item) => item.categories))
  ).sort();

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const togglePriority = (priority: Priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      item.categories.some((cat) => selectedCategories.includes(cat));

    const matchesPriority =
      selectedPriorities.length === 0 ||
      selectedPriorities.includes(item.priority);

    return matchesCategory && matchesPriority;
  });

  const priorities: Priority[] = ["urgent", "high", "normal", "low"];

  const priorityConfig = {
    urgent: {
      bg: "from-red-500 to-pink-500",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
      icon: AlertCircle,
    },
    high: {
      bg: "from-orange-500 to-amber-500",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.5)]",
      icon: AlertCircle,
    },
    normal: {
      bg: "from-blue-500 to-cyan-500",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
      icon: Filter,
    },
    low: {
      bg: "from-gray-500 to-gray-600",
      glow: "shadow-[0_0_20px_rgba(107,114,128,0.5)]",
      icon: Filter,
    },
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedPriorities.length > 0;

  return (
    <div className="pb-20">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 glass p-4 rounded-2xl border border-white/20 dark:border-gray-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-primary shadow-elevated">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold gradient-text">Filter & Organize</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredItems.length} of {items.length} items
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategories([]);
                setSelectedPriorities([]);
              }}
              className="px-3 py-1.5 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Clear</span>
            </motion.button>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-success" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Categories
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {allCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">No categories yet</p>
            ) : (
              allCategories.map((category, index) => {
                const isSelected = selectedCategories.includes(category);
                const itemCount = items.filter(item => 
                  item.categories.includes(category)
                ).length;

                return (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleCategory(category)}
                    className={`
                      px-3 py-2 rounded-xl text-sm font-medium transition-all relative
                      ${isSelected 
                        ? "bg-gradient-to-r from-success to-emerald-500 text-white shadow-elevated glow-success" 
                        : "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>#{category}</span>
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${isSelected ? "bg-white/20" : "bg-primary/10"}
                      `}>
                        {itemCount}
                      </span>
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Filters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Priority
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {priorities.map((priority, index) => {
              const isSelected = selectedPriorities.includes(priority);
              const config = priorityConfig[priority];
              const Icon = config.icon;
              const itemCount = items.filter(item => item.priority === priority).length;

              return (
                <motion.button
                  key={priority}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePriority(priority)}
                  className={`
                    px-3 py-2 rounded-xl text-sm font-medium transition-all relative
                    ${isSelected 
                      ? `bg-gradient-to-r ${config.bg} text-white shadow-elevated ${config.glow}` 
                      : "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{priority}</span>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full
                      ${isSelected ? "bg-white/20" : "bg-primary/10"}
                    `}>
                      {itemCount}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Filtered Items */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-block mb-4 p-6 rounded-3xl gradient-primary shadow-elevated-lg glow-primary"
          >
            <Filter className="w-12 h-12 text-white" />
          </motion.div>
          <p className="text-lg font-semibold gradient-text mb-2">No Matches Found</p>
          <p className="text-muted-foreground text-sm">
            {hasActiveFilters 
              ? "Try adjusting your filters" 
              : "Add some items to get started"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
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
    </div>
  );
}
