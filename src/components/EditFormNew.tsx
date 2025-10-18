"use client";

import { useState, useEffect } from "react";
import { ItemWithDetails, ItemType, Priority, ItemStatus, Subtask } from "@/types";
import { 
  X, Save, Sparkles, Tag, AlertCircle, Calendar, Clock, 
  StickyNote, Globe, Lock, Plus, Trash2, Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditFormProps {
  item: ItemWithDetails | null;
  categories: { id: string; name: string; color_hex?: string }[];
  onSave: (data: Partial<ItemWithDetails> & { 
    categories?: string[]; 
    subtasks?: Array<{ title: string; order_index: number }>;
    event_details?: Record<string, unknown>;
    reminder_details?: Record<string, unknown>;
  }) => Promise<void>;
  onCancel: () => void;
}

export function EditFormNew({ item, categories, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState<Partial<ItemWithDetails>>({
    type: "reminder",
    title: "",
    description: "",
    priority: "normal",
    status: "pending",
    is_public: false,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<Partial<Subtask>[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  
  // Event-specific fields
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  
  // Reminder-specific fields
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [estimateMinutes, setEstimateMinutes] = useState<number>();

  useEffect(() => {
    if (item) {
      setFormData(item);
      setSelectedCategories(item.categories?.map(c => c.id) || []);
      setSubtasks(item.subtasks || []);
      
      if (item.event_details) {
        const start = new Date(item.event_details.start_at);
        const end = new Date(item.event_details.end_at);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
        setAllDay(item.event_details.all_day);
        setLocation(item.event_details.location_text || "");
      }
      
      if (item.reminder_details) {
        if (item.reminder_details.due_at) {
          const due = new Date(item.reminder_details.due_at);
          setDueDate(due.toISOString().split('T')[0]);
          setDueTime(due.toTimeString().slice(0, 5));
        }
        setEstimateMinutes(item.reminder_details.estimate_minutes);
      }
    } else {
      // New item - auto-populate with defaults
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentTime = today.toTimeString().slice(0, 5);
      
      // Auto-populate reminder due date to today
      setDueDate(todayStr);
      setDueTime(currentTime);
      
      // Auto-populate event dates (today to tomorrow)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      setStartDate(todayStr);
      setStartTime(currentTime);
      setEndDate(tomorrowStr);
      setEndTime(currentTime);
      
      // Select first category (Personal) by default
      if (categories.length > 0) {
        setSelectedCategories([categories[0].id]);
      }
    }
  }, [item, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      categories: selectedCategories,
      subtasks: subtasks.filter(st => st.title?.trim()),
    };

    // Add type-specific details
    if (formData.type === "event") {
      const startDateTime = allDay 
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}`);
      const endDateTime = allDay
        ? new Date(`${endDate}T23:59:59`)
        : new Date(`${endDate}T${endTime}`);
      
      (data as Record<string, unknown>).event_details = {
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        all_day: allDay,
        location_text: location || undefined,
      };
    } else if (formData.type === "reminder") {
      (data as Record<string, unknown>).reminder_details = {
        due_at: dueDate && dueTime 
          ? new Date(`${dueDate}T${dueTime}`).toISOString()
          : undefined,
        estimate_minutes: estimateMinutes,
        has_checklist: subtasks.length > 0,
      };
    }

    await onSave(data as Parameters<typeof onSave>[0]);
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, {
        title: newSubtask.trim(),
        order_index: subtasks.length,
      }]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    setSubtasks(subtasks.map((st, i) => 
      i === index ? { ...st, done_at: st.done_at ? undefined : new Date().toISOString() } : st
    ));
  };

  const typeIcons = {
    reminder: Clock,
    event: Calendar,
  };

  const priorityConfig = {
    urgent: { bg: "from-red-500 to-pink-500", glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]" },
    high: { bg: "from-orange-500 to-amber-500", glow: "shadow-[0_0_20px_rgba(249,115,22,0.5)]" },
    normal: { bg: "from-blue-500 to-cyan-500", glow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]" },
    low: { bg: "from-gray-500 to-gray-600", glow: "shadow-[0_0_20px_rgba(107,114,128,0.5)]" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background w-full max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header - Sticky */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 -mt-6 -mx-6 px-6 py-4 glass-strong border-b border-white/20 dark:border-gray-700/50 shadow-sm"
        >
          {/* Title Row */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-elevated">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">
                  {item ? "Edit Item" : "Create New Item"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in the details below
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onCancel}
              className="p-2.5 rounded-xl glass hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Visibility Toggle */}
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-1 p-1 glass rounded-xl border-2 border-white/30 dark:border-gray-700/50 shadow-sm">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: false })}
                className={`
                  px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all
                  ${!formData.is_public
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-gray-800/40'}
                `}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: true })}
                className={`
                  px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all
                  ${formData.is_public
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                    : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-gray-800/40'}
                `}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* === SECTION 1: Type & Basic Info === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Type Selection</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {(["reminder", "event"] as ItemType[]).map((type, index) => {
              const Icon = typeIcons[type];
              const isSelected = formData.type === type;
              
              return (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`
                    p-5 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? type === "reminder"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-white/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md"}
                  `}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-foreground"}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* === SECTION 2: Title & Description === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <StickyNote className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Details</h3>
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Title *
            </label>
            <motion.input
              whileFocus={{ scale: 1.005 }}
              type="text"
              value={formData.title || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-lg placeholder:text-muted-foreground/50"
              required
              placeholder="e.g., Team meeting, Buy groceries..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Description
            </label>
            <motion.textarea
              whileFocus={{ scale: 1.005 }}
              value={formData.description || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-lg resize-none placeholder:text-muted-foreground/50"
              rows={4}
              placeholder="Add any additional details or notes..."
            />
          </div>
        </motion.div>

        {/* === SECTION 3: Priority & Status === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-warning/10">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Priority & Status</h3>
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["low", "normal", "high", "urgent"] as Priority[]).map((priority, index) => {
                const isSelected = formData.priority === priority;
                const config = priorityConfig[priority];

                return (
                  <motion.button
                    key={priority}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`
                      px-3 py-3 rounded-xl text-sm font-bold transition-all border-2
                      ${isSelected 
                        ? `bg-gradient-to-br ${config.bg} text-white shadow-lg border-transparent ${config.glow}` 
                        : "bg-white/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-primary/50 text-foreground"}
                    `}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              Current Status
            </label>
            <select
              value={formData.status || "pending"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ItemStatus })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-lg"
            >
              <option value="pending">⏳ Pending</option>
              <option value="done">✅ Done</option>
              <option value="cancelled">❌ Cancelled</option>
              {formData.type === "event" && (
                <>
                  <option value="confirmed">✔️ Confirmed</option>
                  <option value="tentative">❓ Tentative</option>
                </>
              )}
            </select>
          </div>
        </motion.div>

        {/* === SECTION 4: Categories === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-success/10">
              <Tag className="w-4 h-4 text-success" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Categories</h3>
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {selectedCategories.length} selected
            </span>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-6 px-4 bg-muted/30 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Tag className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No categories available</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, index) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + index * 0.02 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      }
                    }}
                    className={`
                      px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border-2
                      ${isSelected 
                        ? "text-white shadow-lg border-transparent" 
                        : "bg-white/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-primary/50 text-foreground"}
                    `}
                    style={isSelected && cat.color_hex ? { 
                      background: `linear-gradient(135deg, ${cat.color_hex} 0%, ${cat.color_hex}dd 100%)`,
                      boxShadow: `0 4px 12px ${cat.color_hex}40`
                    } : undefined}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {cat.name}
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* === SECTION 5: Event Details === */}
        {formData.type === "event" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl border-2 border-emerald-200 dark:border-emerald-700/50 p-5 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Event Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setStartTime("");
                  setEndDate("");
                  setEndTime("");
                  setLocation("");
                }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Clear all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700/30">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-emerald-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">All Day Event</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-lg"
                  required
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Start Time *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-lg"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-lg"
                  required
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">End Time *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-lg"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-foreground/70 mb-2 block">📍 LOCATION</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where will this take place?"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:shadow-lg focus:shadow-emerald-500/5"
              />
            </div>
          </motion.div>
        )}

        {/* Reminder-specific fields */}
        {formData.type === "reminder" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-5 glass rounded-2xl border-2 border-blue-200 dark:border-blue-500/30 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wide">Reminder Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDueDate("");
                  setDueTime("");
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all border border-transparent hover:border-red-200"
                title="Clear date and time"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">⏰ Set when you want to be reminded</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-foreground/70 mb-2 block">📅 DUE DATE</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:shadow-lg focus:shadow-blue-500/5"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-foreground/70 mb-2 block">⏰ DUE TIME</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:shadow-lg focus:shadow-blue-500/5"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-foreground/70 mb-2 block">⏱️ ESTIMATE (MINUTES)</label>
              <input
                type="number"
                value={estimateMinutes || ""}
                onChange={(e) => setEstimateMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="How long will this take?"
                min="1"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:shadow-lg focus:shadow-blue-500/5"
              />
            </div>
          </motion.div>
        )}

        {/* Subtasks */}
        {formData.type === "reminder" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 p-5 glass rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <Check className="w-4 h-4 text-purple-500" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Subtasks</h3>
              {subtasks.length > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                  {subtasks.filter(s => s.done_at).length}/{subtasks.length}
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">✅ Break down your reminder into smaller tasks</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Type a subtask and press Enter..."
                className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-foreground font-medium transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:shadow-lg focus:shadow-purple-500/5"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addSubtask}
                className="px-5 py-3.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl font-bold flex items-center gap-2 border-2 border-purple-400"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-4 glass rounded-xl border-2 border-white/30 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(index)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all ${
                        subtask.done_at
                          ? "bg-gradient-to-br from-green-400 to-green-500 border-green-500 shadow-md"
                          : "border-gray-400 hover:border-purple-500"
                      }`}
                    >
                      {subtask.done_at && <Check className="w-5 h-5 text-white" />}
                    </button>
                    <span className={`flex-1 font-medium ${subtask.done_at ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {subtask.title}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-200 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-white/20 dark:border-gray-700/50"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-xl glass border-2 border-gray-300 dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/80 font-bold uppercase tracking-wide text-sm transition-all shadow-md hover:shadow-lg"
          >
            ✖ Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl font-bold uppercase tracking-wide text-sm flex items-center gap-2 border-2 border-blue-400"
          >
            <Save className="w-5 h-5" />
            {item ? "💾 Save Changes" : "✨ Create Item"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
