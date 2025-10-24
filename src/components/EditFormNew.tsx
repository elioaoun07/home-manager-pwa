"use client";

import { useState, useEffect } from "react";
import { ItemWithDetails, ItemType, Priority, Subtask } from "@/types";
import { 
  X, Save, Tag, Calendar, Clock, 
  MapPin, Plus, Trash2, Check, Globe, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlarmPicker, AlarmConfig } from "./AlarmPicker";

interface EditFormProps {
  item: ItemWithDetails | null;
  categories: { id: string; name: string; color_hex?: string }[];
  onSave: (data: Partial<ItemWithDetails> & { 
    categories?: string[]; 
    subtasks?: Array<{ title: string; order_index: number }>;
    event_details?: Record<string, unknown>;
    reminder_details?: Record<string, unknown>;
    alarms?: AlarmConfig[];
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
  const [alarms, setAlarms] = useState<AlarmConfig[]>([]);
  
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

  // Ensure status defaults depending on type
  useEffect(() => {
    setFormData((prev) => {
      if (!prev) return prev;
      // For reminders always default to pending
      if (prev.type === "reminder" && prev.status !== "pending") {
        return { ...prev, status: "pending" };
      }
      // For events restrict to pending/tentative (default pending)
      if (prev.type === "event" && prev.status !== "pending" && prev.status !== "tentative") {
        return { ...prev, status: "pending" };
      }
      return prev;
    });
  }, [formData.type]);

  // When user updates the start date via the input, if start becomes after end,
  // automatically bump end date to start + 1 day to avoid invalid ranges.
  const handleStartDateChange = (value: string) => {
    setStartDate(value);

    if (!value) return;

    try {
      if (endDate) {
        const s = new Date(value);
        const e = new Date(endDate);
        // compare dates at midnight to ignore time-of-day
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        if (s.getTime() > e.getTime()) {
          const newEnd = new Date(s);
          newEnd.setDate(newEnd.getDate() + 1);
          setEndDate(newEnd.toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      // defensive: if parsing fails, do nothing
      console.error('Invalid date while handling start-date change', err);
    }
  };

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
      
      // Pass alarms to be saved after the item is created
      (data as Record<string, unknown>).alarms = alarms;
      (data as Record<string, unknown>).eventStartTime = startDateTime;
      
      await onSave(data as Parameters<typeof onSave>[0]);
    } else if (formData.type === "reminder") {
      (data as Record<string, unknown>).reminder_details = {
        due_at: dueDate && dueTime 
          ? new Date(`${dueDate}T${dueTime}`).toISOString()
          : undefined,
        estimate_minutes: estimateMinutes,
        has_checklist: subtasks.length > 0,
      };
      
      await onSave(data as Parameters<typeof onSave>[0]);
    } else {
      await onSave(data as Parameters<typeof onSave>[0]);
    }
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

  // Format a date as "Mon DD" and include the year only when it's not the current year.
  const formatDateMaybeYear = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const currentYear = new Date().getFullYear();
    return d.getFullYear() === currentYear ? monthDay : `${monthDay}, ${d.getFullYear()}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background w-full h-full md:h-[90vh] md:max-w-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header with Public/Private Toggle - Fixed */}
          <div className="flex-shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b-2 border-gradient bg-background/95 backdrop-blur-lg">
            <div className="flex-1 mb-3 md:mb-0">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold gradient-text"
              >
                {item ? "Edit Item" : "Create Item"}
              </motion.h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.type === "reminder" ? "Set up your reminder" : "Schedule your event"}
              </p>
            </div>
            
            <div className="flex w-full md:w-auto items-center justify-end gap-2">
              {/* Public/Private Toggle */}
              <div className="inline-flex flex-row items-center gap-2 p-1 glass rounded-xl border-2 border-white/30 dark:border-gray-700/50 shadow-lg">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, is_public: false })}
                  className={`
                    px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all
                    ${!formData.is_public
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                      : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-gray-800/40'}
                  `}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, is_public: true })}
                  className={`
                    px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all
                    ${formData.is_public
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'text-muted-foreground hover:bg-white/40 dark:hover:bg-gray-800/40'}
                  `}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public</span>
                </motion.button>
              </div>
              
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onCancel}
                className="p-2.5 rounded-lg glass hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 space-y-5 pb-24">{/* Step 1: Choose Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
            >
              1
            </motion.div>
            <h3 className="text-xl font-bold gradient-text">Choose Type</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {(["reminder", "event"] as ItemType[]).map((type) => {
              const Icon = typeIcons[type];
              const isSelected = formData.type === type;
              
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`
                    p-8 rounded-2xl border-2 transition-all flex flex-col items-center gap-4
                    ${isSelected 
                      ? type === "reminder"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                      : "border-white/20 dark:border-gray-700/50 hover:border-primary/50 glass"}
                  `}
                >
                  <Icon className={`w-10 h-10 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                  <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-muted-foreground"}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Step 2: Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
            >
              2
            </motion.div>
            <h3 className="text-xl font-bold gradient-text">What&apos;s it about?</h3>
          </div>
          
          <div className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg space-y-5">
            <div>
              <label className="block text-base font-semibold mb-3 text-foreground">Title *</label>
              <motion.input
                whileFocus={{ scale: 1.005 }}
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 text-base rounded-xl border-2 border-white/20 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 focus:shadow-lg transition-all"
                required
                placeholder={formData.type === "reminder" ? "e.g., Buy groceries" : "e.g., Team meeting"}
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-3 text-foreground">Description (optional)</label>
              <motion.textarea
                whileFocus={{ scale: 1.005 }}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-5 py-4 text-base rounded-xl border-2 border-white/20 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 focus:shadow-lg transition-all resize-none"
                rows={4}
                placeholder="Add any additional details..."
              />
            </div>
          </div>
        </motion.div>


        {/* Step 3: When (Date & Time) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
            >
              3
            </motion.div>
            <h3 className="text-xl font-bold gradient-text">
              {formData.type === "reminder" ? "When is it due?" : "When does it happen?"}
            </h3>
          </div>

          {formData.type === "reminder" && (
            <div className="glass rounded-2xl border-2 border-blue-200/50 dark:border-blue-500/30 p-5 shadow-lg space-y-5">
              {/* Compact Date & Time - View/Edit Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground/80">Due</span>
                  {dueDate && (() => {
                    const date = new Date(dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(date);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    let relativeText = '';
                    if (diffDays === 0) relativeText = 'Today';
                    else if (diffDays === 1) relativeText = 'Tomorrow';
                    else if (diffDays === -1) relativeText = 'Yesterday';
                    else if (diffDays > 1 && diffDays <= 7) relativeText = `In ${diffDays} days`;
                    else if (diffDays < -1 && diffDays >= -7) relativeText = `${Math.abs(diffDays)} days ago`;
                    
                    return relativeText ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        {relativeText}
                      </span>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-2">
                  {/* Date */}
                  <div 
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-700/30 cursor-pointer hover:shadow-md transition-all relative"
                    onClick={() => (document.getElementById('reminder-date-input') as HTMLInputElement)?.showPicker?.()}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mb-0.5">Date</div>
                        <div className="text-base font-semibold text-foreground">
                          {dueDate ? formatDateMaybeYear(dueDate) : 'Select date'}
                        </div>
                      </div>
                    </div>
                    <input
                      id="reminder-date-input"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Time */}
                  <div 
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-700/30 cursor-pointer hover:shadow-md transition-all relative"
                    onClick={() => (document.getElementById('reminder-time-input') as HTMLInputElement)?.showPicker?.()}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mb-0.5">Time</div>
                        <div className="text-base font-semibold text-foreground">
                          {dueTime ? new Date(`2000-01-01T${dueTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Select time'}
                        </div>
                      </div>
                    </div>
                    <input
                      id="reminder-time-input"
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-base font-semibold mb-3 text-foreground">Estimated time (minutes)</label>
                <motion.input
                  whileFocus={{ scale: 1.005 }}
                  type="number"
                  value={estimateMinutes || ""}
                  onChange={(e) => setEstimateMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="How long will this take?"
                  min="1"
                  className="w-full px-5 py-4 text-base rounded-xl border-2 border-white/20 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-foreground focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg transition-all"
                />
              </div>
            </div>
          )}

          {formData.type === "event" && (
            <div className="glass rounded-2xl border-2 border-emerald-200/50 dark:border-emerald-500/30 p-5 shadow-lg space-y-5">
              <label className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 backdrop-blur-sm">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-6 h-6 rounded border-2 text-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-base font-semibold">All day event</span>
              </label>

              {/* Compact Start/End Date & Time */}
              <div className="space-y-3">
                {/* Start - Date and Time side by side */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Start
                    </span>
                    {startDate && (() => {
                      const date = new Date(startDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const start = new Date(date);
                      start.setHours(0, 0, 0, 0);
                      const diffDays = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      let relativeText = '';
                      if (diffDays === 0) relativeText = 'Today';
                      else if (diffDays === 1) relativeText = 'Tomorrow';
                      else if (diffDays > 1 && diffDays <= 7) relativeText = `In ${diffDays} days`;
                      
                      return relativeText ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          {relativeText}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Start Date */}
                    <div 
                      className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/50 dark:border-emerald-700/30 cursor-pointer hover:shadow-md transition-all relative"
                      onClick={() => (document.getElementById('start-date-input') as HTMLInputElement)?.showPicker?.()}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 mb-0.5">Date</div>
                          <div className="text-sm font-semibold text-foreground">
                            {startDate ? formatDateMaybeYear(startDate) : 'Select'}
                          </div>
                        </div>
                      </div>
                      <input
                        id="start-date-input"
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                    </div>

                    {/* Start Time */}
                    {!allDay && (
                      <div 
                        className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/50 dark:border-emerald-700/30 cursor-pointer hover:shadow-md transition-all relative"
                        onClick={() => (document.getElementById('start-time-input') as HTMLInputElement)?.showPicker?.()}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 mb-0.5">Time</div>
                            <div className="text-sm font-semibold text-foreground">
                              {startTime ? new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Select'}
                            </div>
                          </div>
                        </div>
                        <input
                          id="start-time-input"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

 
                {/* End - Date and Time side by side */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      End
                    </span>
                    {endDate && startDate && endDate !== startDate && (() => {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return diffDays > 0 ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400">
                          +{diffDays} day{diffDays > 1 ? 's' : ''}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* End Date */}
                    <div 
                      className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200/50 dark:border-orange-700/30 cursor-pointer hover:shadow-md transition-all relative"
                      onClick={() => (document.getElementById('end-date-input') as HTMLInputElement)?.showPicker?.()}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-orange-600/70 dark:text-orange-400/70 mb-0.5">Date</div>
                          <div className="text-sm font-semibold text-foreground">
                            {endDate ? formatDateMaybeYear(endDate) : 'Select'}
                          </div>
                        </div>
                      </div>
                      <input
                        id="end-date-input"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                    </div>

                    {/* End Time */}
                    {!allDay && (
                      <div 
                        className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200/50 dark:border-orange-700/30 cursor-pointer hover:shadow-md transition-all relative"
                        onClick={() => (document.getElementById('end-time-input') as HTMLInputElement)?.showPicker?.()}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-orange-600/70 dark:text-orange-400/70 mb-0.5">Time</div>
                            <div className="text-sm font-semibold text-foreground">
                              {endTime ? new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Select'}
                            </div>
                          </div>
                        </div>
                        <input
                          id="end-time-input"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-base font-semibold mb-3 text-foreground">
                  <MapPin className="w-5 h-5" />
                  Location (optional)
                </label>
                <motion.input
                  whileFocus={{ scale: 1.005 }}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where will this take place?"
                  className="w-full px-5 py-4 text-base rounded-xl border-2 border-white/20 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-lg transition-all"
                />
              </div>

              <div>
                <label className="block text-base font-semibold mb-3 text-foreground">Reminders</label>
                <AlarmPicker
                  eventStartTime={startDate && startTime ? new Date(`${startDate}T${startTime}`) : null}
                  existingAlarms={alarms}
                  onChange={setAlarms}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Step 4: Priority & Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
            >
              4
            </motion.div>
            <h3 className="text-xl font-bold gradient-text">How important is it?</h3>
          </div>
          
          <div className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg space-y-5">
            <div>
              <label className="block text-base font-semibold mb-3 text-foreground">Priority</label>
              <div className="grid grid-cols-2 gap-3">
                {(["low", "normal", "high", "urgent"] as Priority[]).map((priority) => {
                  const isSelected = formData.priority === priority;
                  const config = priorityConfig[priority];

                  return (
                    <motion.button
                      key={priority}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`
                        py-4 rounded-xl text-base font-bold transition-all border-2
                        ${isSelected 
                          ? `bg-gradient-to-br ${config.bg} text-white shadow-lg border-transparent ${config.glow}` 
                          : "border-white/20 dark:border-gray-700 hover:border-primary/50 glass"}
                      `}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-3 text-foreground">Categories</label>
              {categories.length === 0 ? (
                <p className="text-base text-muted-foreground py-4">No categories available</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <motion.button
                        key={cat.id}
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
                          px-5 py-3 rounded-xl text-base font-semibold flex items-center gap-2 transition-all border-2
                          ${isSelected 
                            ? "text-white shadow-lg border-transparent" 
                            : "border-white/20 dark:border-gray-700 hover:border-primary/50 glass"}
                        `}
                        style={isSelected && cat.color_hex ? { 
                          background: `linear-gradient(135deg, ${cat.color_hex} 0%, ${cat.color_hex}dd 100%)`,
                          boxShadow: `0 4px 12px ${cat.color_hex}40`
                        } : undefined}
                      >
                        <Tag className="w-4 h-4" />
                        {cat.name}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>


        {/* Step 5: Subtasks (Reminder only) */}
        {formData.type === "reminder" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
              >
                5
              </motion.div>
              <h3 className="text-xl font-bold gradient-text">Break it down (optional)</h3>
            </div>

            <div className="glass rounded-2xl border-2 border-purple-200/50 dark:border-purple-500/30 p-5 shadow-lg space-y-4">
              <div className="flex gap-3">
                <motion.input
                  whileFocus={{ scale: 1.005 }}
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 px-5 py-4 text-base rounded-xl border-2 border-white/20 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-foreground focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:shadow-lg transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addSubtask}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
              </div>

              {subtasks.length > 0 && (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3 pt-2">
                    {subtasks.map((subtask, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-4 p-4 glass rounded-xl border border-white/20 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(index)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${
                            subtask.done_at
                              ? "bg-gradient-to-br from-green-400 to-green-500 border-green-500 shadow-md"
                              : "border-gray-400 hover:border-purple-500"
                          }`}
                        >
                          {subtask.done_at && <Check className="w-5 h-5 text-white" />}
                        </button>
                        <span className={`flex-1 text-base ${subtask.done_at ? "line-through text-muted-foreground" : ""}`}>
                          {subtask.title}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeSubtask(index)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}

        {/* Additional Settings - only for events */}
        {formData.type === "event" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-base font-bold shadow-lg"
              >
                5
              </motion.div>
              <h3 className="text-xl font-bold gradient-text">Additional settings</h3>
            </div>

            <div className="glass rounded-2xl border-2 border-white/30 dark:border-gray-700/50 p-5 shadow-lg">
              <div>
                <label className="block text-base font-semibold mb-3 text-foreground">Status</label>

                <div className="inline-flex bg-white/5 p-1 rounded-xl gap-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={formData.status === "pending"}
                    onClick={() => setFormData({ ...formData, status: "pending" })}
                    className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                      formData.status === "pending"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                        : "text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    Pending
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={formData.status === "tentative"}
                    onClick={() => setFormData({ ...formData, status: "tentative" })}
                    className={`px-4 py-3 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                      formData.status === "tentative"
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md"
                        : "text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    Tentative
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-4 pt-6 border-t-2 border-gradient"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onCancel}
            className="px-8 py-4 text-base rounded-xl glass border-2 border-white/30 dark:border-gray-600 hover:bg-white/20 dark:hover:bg-gray-800/40 transition-all font-semibold shadow-md"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-8 py-4 text-base rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all font-semibold flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {item ? "Save Changes" : "Create Item"}
          </motion.button>
        </motion.div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
