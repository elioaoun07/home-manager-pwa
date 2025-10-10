"use client";

import { useState, useEffect } from "react";
import { Item, ItemType, Priority, RecurrencePreset } from "@/types";
import { X, Save, Sparkles, Tag, AlertCircle, Calendar, Clock, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditFormProps {
  item: Item | null;
  onSave: (item: Item) => void;
  onCancel: () => void;
}

export function EditForm({ item, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState<Partial<Item>>({
    type: "reminder",
    title: "",
    notes: "",
    categories: [],
    priority: "normal",
    completed: false,
  });

  const [categoryInput, setCategoryInput] = useState("");

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        type: "reminder",
        title: "",
        notes: "",
        categories: [],
        priority: "normal",
        completed: false,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const savedItem: Item = {
      id: item?.id || crypto.randomUUID(),
      type: formData.type || "reminder",
      title: formData.title || "Untitled",
      notes: formData.notes,
      categories: formData.categories || [],
      priority: formData.priority || "normal",
      due_at: formData.due_at,
      start_at: formData.start_at,
      end_at: formData.end_at,
      all_day: formData.all_day,
      recurrence: formData.recurrence,
      completed: formData.completed || false,
      created_at: item?.created_at || now,
      updated_at: now,
    };

    onSave(savedItem);
  };

  const addCategory = () => {
    if (categoryInput.trim() && !formData.categories?.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        categories: [...(formData.categories || []), categoryInput.trim()],
      });
      setCategoryInput("");
    }
  };

  const removeCategory = (cat: string) => {
    setFormData({
      ...formData,
      categories: formData.categories?.filter((c) => c !== cat) || [],
    });
  };

  const typeIcons = {
    reminder: Clock,
    todo: Sparkles,
    event: Calendar,
  };

  const priorityConfig = {
    urgent: {
      bg: "from-red-500 to-pink-500",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    },
    high: {
      bg: "from-orange-500 to-amber-500",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.5)]",
    },
    normal: {
      bg: "from-blue-500 to-cyan-500",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
    },
    low: {
      bg: "from-gray-500 to-gray-600",
      glow: "shadow-[0_0_20px_rgba(107,114,128,0.5)]",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background w-full max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-primary shadow-elevated">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold gradient-text">
              {item ? "Edit Item" : "Create New Item"}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Type Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["reminder", "todo", "event"] as ItemType[]).map((type, index) => {
              const Icon = typeIcons[type];
              const isSelected = formData.type === type;
              
              return (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`
                    p-4 rounded-xl transition-all
                    ${isSelected 
                      ? "gradient-primary text-white shadow-elevated glow-primary" 
                      : "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                  `}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${isSelected ? "text-white" : ""}`} />
                  <span className={`text-sm font-medium ${isSelected ? "text-white" : ""}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <label className="block text-sm font-semibold text-muted-foreground mb-3">
            Title
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
            required
            placeholder="What do you need to do?"
          />
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            Notes
          </label>
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 glass rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            rows={4}
            placeholder="Add some details..."
          />
        </motion.div>

        {/* Priority */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            Priority
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["low", "normal", "high", "urgent"] as Priority[]).map((priority, index) => {
              const isSelected = formData.priority === priority;
              const config = priorityConfig[priority];

              return (
                <motion.button
                  key={priority}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`
                    px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isSelected 
                      ? `bg-gradient-to-r ${config.bg} text-white shadow-elevated ${config.glow}` 
                      : "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                  `}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-success" />
            Categories
          </label>
          <div className="flex gap-2 mb-3">
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="Add category"
              className="flex-1 px-4 py-3 glass rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={addCategory}
              className="px-5 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl shadow-elevated glow-success font-medium"
            >
              Add
            </motion.button>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="flex flex-wrap gap-2">
              {formData.categories?.map((cat, index) => (
                <motion.span
                  key={cat}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-2 glass rounded-xl text-sm font-medium flex items-center gap-2 border border-white/20 dark:border-gray-700/50"
                >
                  <Tag className="w-3.5 h-3.5 text-success" />
                  #{cat}
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="p-0.5 rounded-full hover:bg-destructive/20 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.span>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10 dark:border-gray-700/30"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 font-medium transition-all"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-6 py-3 rounded-xl gradient-primary text-white shadow-elevated glow-primary font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {item ? "Save Changes" : "Create Item"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
