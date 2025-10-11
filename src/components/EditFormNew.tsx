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
  onSave: (data: any) => Promise<void>;
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
      // New item - select first category (Personal) by default
      if (categories.length > 0) {
        setSelectedCategories([categories[0].id]);
      }
    }
  }, [item, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
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
      
      data.event_details = {
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        all_day: allDay,
        location_text: location || undefined,
      };
    } else if (formData.type === "reminder") {
      data.reminder_details = {
        due_at: dueDate && dueTime 
          ? new Date(`${dueDate}T${dueTime}`).toISOString()
          : undefined,
        estimate_minutes: estimateMinutes,
        has_checklist: subtasks.length > 0,
      };
    }

    await onSave(data);
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
      <form onSubmit={handleSubmit} className="p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Title Row */}
          <div className="flex justify-between items-center mb-3">
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
          </div>
          
          {/* Visibility Toggle - Right Aligned */}
          <div className="flex justify-end">
            <div className="inline-flex items-center p-0.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: false })}
                className={`
                  px-2.5 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all
                  ${!formData.is_public
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-white/40 dark:hover:bg-white/10'}
                `}
              >
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: true })}
                className={`
                  px-2.5 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all
                  ${formData.is_public
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/30'
                    : 'text-blue-700 dark:text-blue-300 hover:bg-white/40 dark:hover:bg-white/10'}
                `}
              >
                <Globe className="w-3 h-3" />
                <span>Public</span>
              </button>
            </div>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            {(["reminder", "event"] as ItemType[]).map((type, index) => {
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
                      ? type === "reminder"
                        ? "gradient-primary text-white shadow-elevated glow-primary"
                        : "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-elevated shadow-emerald-500/30"
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

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            Description
          </label>
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-6"
        >
          <label className="text-sm font-semibold text-muted-foreground mb-3">
            Status
          </label>
          <select
            value={formData.status || "pending"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ItemStatus })}
            className="w-full px-4 py-3 glass rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="pending">Pending</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
            {formData.type === "event" && (
              <>
                <option value="confirmed">Confirmed</option>
                <option value="tentative">Tentative</option>
              </>
            )}
          </select>
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
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available. Categories will be loaded automatically.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      console.log("Category clicked:", cat.name, "Selected:", !isSelected);
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.id]);
                      }
                    }}
                    className={`
                      px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all
                      ${isSelected 
                        ? "bg-gradient-to-r from-success to-emerald-500 text-white shadow-elevated" 
                        : "glass hover:bg-white/50 dark:hover:bg-gray-800/50"}
                    `}
                    style={isSelected && cat.color_hex ? { 
                      background: cat.color_hex,
                      boxShadow: `0 0 20px ${cat.color_hex}50`
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

        {/* Event-specific fields */}
        {formData.type === "event" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-4 glass rounded-xl border border-white/20 dark:border-gray-700/50"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Event Details
            </h3>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">All Day Event</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  required
                />
              </div>
              {!allDay && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  required
                />
              </div>
              {!allDay && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
              />
            </div>
          </motion.div>
        )}

        {/* Reminder-specific fields */}
        {formData.type === "reminder" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-4 glass rounded-xl border border-white/20 dark:border-gray-700/50"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Reminder Details
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due Time</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Estimate (minutes)</label>
              <input
                type="number"
                value={estimateMinutes || ""}
                onChange={(e) => setEstimateMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="How long will this take?"
                min="1"
                className="w-full px-3 py-2 glass rounded-lg border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
              />
            </div>
          </motion.div>
        )}

        {/* Subtasks */}
        {formData.type === "reminder" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-6"
          >
            <label className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Subtasks
            </label>
            
            <div className="flex gap-2 mb-3">
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
                placeholder="Add a subtask"
                className="flex-1 px-4 py-3 glass rounded-xl border border-white/20 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 text-foreground transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addSubtask}
                className="px-5 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl shadow-elevated glow-success font-medium"
              >
                <Plus className="w-4 h-4" />
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
                    className="flex items-center gap-3 p-3 glass rounded-xl border border-white/20 dark:border-gray-700/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(index)}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                        subtask.done_at
                          ? "bg-success border-success"
                          : "border-gray-400"
                      }`}
                    >
                      {subtask.done_at && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <span className={`flex-1 ${subtask.done_at ? "line-through text-muted-foreground" : ""}`}>
                      {subtask.title}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="p-1.5 rounded-lg hover:bg-destructive/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
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
          transition={{ delay: 0.5 }}
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
