"use client";

import { useState, useEffect, useRef } from "react";
import { parseQuickAdd } from "@/lib/parser";
import { ParsedInput, Priority } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Bell, Calendar, Tag, Send, Sparkles, Clock, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddProps {
  onAdd: (parsed: ParsedInput) => void;
  categories?: Array<{ id: string; name: string; color_hex?: string }>;
  onOpenSettings?: () => void;
}

interface SmartSuggestion {
  type: "type" | "priority" | "category";
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export function QuickAdd({ onAdd, categories = [], onOpenSettings }: QuickAddProps) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParsedInput | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart suggestion generation based on parsed content and input
  useEffect(() => {
    if (input.trim()) {
      const parsed = parseQuickAdd(input);
      setPreview(parsed);
      
      // Generate smart suggestions
      const newSuggestions: SmartSuggestion[] = [];
      
      // Suggest type if has date/time
      if (parsed.time || parsed.startTime) {
        if (parsed.type === "reminder") {
          newSuggestions.push({
            type: "type",
            value: "event",
            label: "Make it an Event?",
            icon: "📅"
          });
        }
      } else {
        // No date = suggest it's a note/reminder
        if (parsed.type === "event") {
          newSuggestions.push({
            type: "type",
            value: "reminder",
            label: "Set as Reminder?",
            icon: "🔔"
          });
        }
      }
      
      // Suggest priority based on keywords
      const urgentWords = ["urgent", "asap", "now", "emergency", "critical"];
      const highWords = ["important", "soon", "priority"];
      const lowWords = ["maybe", "someday", "eventually", "consider"];
      
      const lowerInput = input.toLowerCase();
      if (urgentWords.some(word => lowerInput.includes(word)) && parsed.priority !== "urgent") {
        newSuggestions.push({
          type: "priority",
          value: "urgent",
          label: "Urgent priority?",
          icon: "🔥🔥"
        });
      } else if (highWords.some(word => lowerInput.includes(word)) && parsed.priority !== "high") {
        newSuggestions.push({
          type: "priority",
          value: "high",
          label: "High priority?",
          icon: "🔥"
        });
      } else if (lowWords.some(word => lowerInput.includes(word)) && parsed.priority !== "low") {
        newSuggestions.push({
          type: "priority",
          value: "low",
          label: "Low priority?",
          icon: "⬇️"
        });
      }
      
      // Suggest categories based on keywords
      categories.forEach(category => {
        const categoryWords = category.name.toLowerCase().split(" ");
        const matchesCategory = categoryWords.some(word => 
          lowerInput.includes(word.toLowerCase())
        );
        
        if (matchesCategory && !parsed.categories.includes(category.id)) {
          newSuggestions.push({
            type: "category",
            value: category.id,
            label: category.name,
            color: category.color_hex,
            icon: "🏷️"
          });
        }
      });
      
      setSuggestions(newSuggestions);
    } else {
      setPreview(null);
      setSuggestions([]);
    }
  }, [input, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && preview) {
      onAdd(preview);
      setInput("");
      setPreview(null);
      setSuggestions([]);
      inputRef.current?.focus();
    }
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    if (!preview) return;
    
    const updated = { ...preview };
    
    if (suggestion.type === "type") {
      updated.type = suggestion.value as "reminder" | "event";
    } else if (suggestion.type === "priority") {
      updated.priority = suggestion.value as Priority;
    } else if (suggestion.type === "category") {
      if (!updated.categories.includes(suggestion.value)) {
        updated.categories = [...updated.categories, suggestion.value];
      }
    }
    
    setPreview(updated);
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => 
      !(s.type === suggestion.type && s.value === suggestion.value)
    ));
  };

  const togglePreviewItem = (type: "type" | "priority" | "category", value?: string) => {
    if (!preview) return;
    
    const updated = { ...preview };
    
    if (type === "type") {
      updated.type = updated.type === "reminder" ? "event" : "reminder";
    } else if (type === "priority") {
      // Cycle through priorities
      const priorities: Priority[] = ["low", "normal", "high", "urgent"];
      const currentIndex = priorities.indexOf(updated.priority);
      updated.priority = priorities[(currentIndex + 1) % priorities.length];
    } else if (type === "category" && value) {
      updated.categories = updated.categories.includes(value)
        ? updated.categories.filter(c => c !== value)
        : [...updated.categories, value];
    }
    
    setPreview(updated);
  };

  const priorityConfig = {
    urgent: { icon: "🔥🔥", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Urgent" },
    high: { icon: "🔥", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "High" },
    normal: { icon: "➖", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: "Normal" },
    low: { icon: "⬇️", color: "text-blue-400", bg: "bg-blue-50", border: "border-blue-200", label: "Low" },
  };

  const typeIcon = {
    reminder: <Bell size={16} />,
    event: <Calendar size={16} />,
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 glass-strong shadow-elevated-lg"
    >
      <div className="gradient-mesh absolute inset-0 opacity-50" />
      
      <div className="relative p-4 pb-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Input Field */}
          <div className={`
            relative overflow-hidden rounded-2xl transition-all duration-300
            ${isFocused ? 'ring-2 ring-primary shadow-elevated-lg glow-primary' : 'shadow-md'}
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-info/5" />
            
            <div className="relative flex items-center gap-2 bg-card/95 backdrop-blur">
              {/* Hamburger Menu Button */}
              {onOpenSettings && (
                <motion.button
                  type="button"
                  onClick={onOpenSettings}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-3 p-2 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <Menu className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              )}
              
              <motion.div
                animate={{
                  rotate: isFocused ? [0, 10, -10, 0] : 0,
                  scale: isFocused ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                className={onOpenSettings ? "" : "pl-4"}
              >
                <Sparkles className={`${isFocused ? 'text-primary' : 'text-muted-foreground'} transition-colors`} size={22} />
              </motion.div>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Quick add... (e.g., Pay bills tomorrow 9am)"
                className="flex-1 py-4 pr-2 text-base bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
                autoFocus
              />
              
              <AnimatePresence>
                {input.trim() && (
                  <motion.button
                    type="submit"
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mr-3 p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Send size={20} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Smart Preview & Suggestions - Only while typing */}
          <AnimatePresence>
            {preview && input.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {/* Interactive Preview Tags */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  {/* Type Badge - Clickable to toggle */}
                  <motion.button
                    type="button"
                    onClick={() => togglePreviewItem("type")}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 font-medium text-sm transition-all ${
                      preview.type === "event"
                        ? "bg-purple-50 border-purple-400 text-purple-700 hover:border-purple-500"
                        : "bg-blue-50 border-blue-400 text-blue-700 hover:border-blue-500"
                    }`}
                  >
                    {typeIcon[preview.type]}
                    <span className="capitalize">{preview.type}</span>
                  </motion.button>

                  {/* Title */}
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-foreground"
                  >
                    {preview.title}
                  </motion.span>
                  
                  {/* Priority Badge - Clickable to cycle */}
                  <motion.button
                    type="button"
                    onClick={() => togglePreviewItem("priority")}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 text-sm font-medium transition-all ${
                      priorityConfig[preview.priority].bg
                    } ${priorityConfig[preview.priority].border} ${priorityConfig[preview.priority].color}`}
                  >
                    <span>{priorityConfig[preview.priority].icon}</span>
                    <span>{priorityConfig[preview.priority].label}</span>
                  </motion.button>
                  
                  {/* Category Badges - Clickable to remove */}
                  {preview.categories.map((catId, index) => {
                    const category = categories.find(c => c.id === catId);
                    if (!category) return null;
                    
                    return (
                      <motion.button
                        key={catId}
                        type="button"
                        onClick={() => togglePreviewItem("category", catId)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.05 * index }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 text-sm font-medium transition-all"
                        style={{
                          backgroundColor: `${category.color_hex}20`,
                          borderColor: category.color_hex,
                          color: category.color_hex
                        }}
                      >
                        <Tag size={12} />
                        <span>{category.name}</span>
                      </motion.button>
                    );
                  })}
                  
                  {/* Date/Time Display */}
                  {(preview.time || preview.startTime) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 bg-slate-50 border-slate-300 text-slate-700 text-sm font-medium"
                    >
                      <Clock size={14} />
                      <span>{formatDateTime(preview.time || preview.startTime!)}</span>
                    </motion.div>
                  )}
                </div>

                {/* Smart Suggestions - Appear below preview */}
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2 px-1"
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={`${suggestion.type}-${suggestion.value}`}
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05 * index }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed bg-white/50 backdrop-blur-sm hover:bg-white hover:border-solid text-sm font-medium transition-all"
                        style={suggestion.color ? {
                          borderColor: suggestion.color,
                          color: suggestion.color
                        } : {
                          borderColor: '#94a3b8',
                          color: '#475569'
                        }}
                      >
                        <span className="text-base">{suggestion.icon}</span>
                        <span>{suggestion.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
