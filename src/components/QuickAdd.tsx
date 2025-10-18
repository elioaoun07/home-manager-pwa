"use client";

import { useState, useEffect, useRef } from "react";
import { parseQuickAdd } from "@/lib/parser";
import { smartParse } from "@/lib/smartParser";
import { ParsedInput, Priority, ItemType } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Bell, Calendar, Tag, Send, Sparkles, Clock, Menu, Globe, Lock, Zap, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddProps {
  onAdd: (parsed: ParsedInput) => void;
  categories?: Array<{ id: string; name: string; color_hex?: string; keywords?: string[] }>;
  onOpenSettings?: () => void;
}

interface SmartSuggestion {
  type: "type" | "priority" | "category" | "privacy";
  value: string | boolean;
  label: string;
  color?: string;
  icon?: string;
  confidence: 'high' | 'medium' | 'low';
}

export function QuickAdd({ onAdd, categories = [], onOpenSettings }: QuickAddProps) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParsedInput | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart suggestion generation using NLP
  useEffect(() => {
    if (input.trim()) {
      // Use smart parser to get AI-powered detections
      const smartResult = smartParse(input, categories);
      
      // Also get the basic parse result for backward compatibility
      const basicParse = parseQuickAdd(input);
      
      // Build preview from both sources
      const newPreview: ParsedInput = {
        title: smartResult.title || basicParse.title,
        type: smartResult.detections.type?.value || basicParse.type,
        priority: smartResult.detections.priority?.value || basicParse.priority,
        categories: [],
        time: smartResult.detections.time?.value || basicParse.time,
        startTime: smartResult.detections.startTime?.value || basicParse.startTime,
        endTime: smartResult.detections.endTime?.value || basicParse.endTime,
        allDay: basicParse.allDay,
        recurrence: basicParse.recurrence,
        isPublic: smartResult.detections.isPublic?.value !== undefined 
          ? smartResult.detections.isPublic.value 
          : false,
      };
      
      // Handle categories from smart parser
      if (smartResult.detections.categories) {
        newPreview.categories = smartResult.detections.categories
          .filter(cat => cat.confidence === 'high')
          .map(cat => cat.value);
      }
      
      // Add basic parse categories (hashtags)
      basicParse.categories.forEach(catId => {
        if (!newPreview.categories.includes(catId)) {
          newPreview.categories.push(catId);
        }
      });
      
      setPreview(newPreview);
      
      // Generate smart suggestions for uncertain detections
      const newSuggestions: SmartSuggestion[] = [];
      
      // Type suggestions (medium/low confidence)
      if (smartResult.detections.type && smartResult.detections.type.confidence !== 'high') {
        const detected = smartResult.detections.type;
        newSuggestions.push({
          type: "type",
          value: detected.value,
          label: `${detected.value === 'event' ? '📅 Event' : '🔔 Reminder'}?`,
          icon: detected.value === 'event' ? '�' : '�',
          confidence: detected.confidence
        });
      }
      
      // Priority suggestions (medium/low confidence)
      if (smartResult.detections.priority && smartResult.detections.priority.confidence !== 'high') {
        const detected = smartResult.detections.priority;
        const priorityIcons = {
          urgent: '🔥🔥',
          high: '🔥',
          normal: '➖',
          low: '⬇️'
        };
        newSuggestions.push({
          type: "priority",
          value: detected.value,
          label: `${priorityIcons[detected.value]} ${detected.value.charAt(0).toUpperCase() + detected.value.slice(1)}?`,
          icon: priorityIcons[detected.value],
          confidence: detected.confidence
        });
      }
      
      // Privacy suggestions
      if (smartResult.detections.isPublic) {
        const detected = smartResult.detections.isPublic;
        if (detected.confidence !== 'high') {
          newSuggestions.push({
            type: "privacy",
            value: detected.value,
            label: detected.value ? '🌐 Make Public?' : '🔒 Keep Private?',
            icon: detected.value ? '🌐' : '🔒',
            confidence: detected.confidence
          });
        }
      }
      
      // Category suggestions (medium/low confidence)
      if (smartResult.detections.categories) {
        smartResult.detections.categories
          .filter(cat => cat.confidence !== 'high' && !newPreview.categories.includes(cat.value))
          .forEach(cat => {
            const category = categories.find(c => c.id === cat.value);
            if (category) {
              newSuggestions.push({
                type: "category",
                value: cat.value,
                label: `🏷️ ${category.name}?`,
                color: category.color_hex,
                icon: '🏷️',
                confidence: cat.confidence
              });
            }
          });
      }
      
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
      updated.type = suggestion.value as ItemType;
    } else if (suggestion.type === "priority") {
      updated.priority = suggestion.value as Priority;
    } else if (suggestion.type === "privacy") {
      updated.isPublic = suggestion.value as boolean;
    } else if (suggestion.type === "category" && typeof suggestion.value === 'string') {
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

  const togglePreviewItem = (type: "type" | "priority" | "category" | "privacy", value?: string | boolean) => {
    if (!preview) return;
    
    const updated = { ...preview };
    
    if (type === "type") {
      updated.type = updated.type === "reminder" ? "event" : "reminder";
    } else if (type === "priority") {
      // Cycle through priorities
      const priorities: Priority[] = ["low", "normal", "high", "urgent"];
      const currentIndex = priorities.indexOf(updated.priority);
      updated.priority = priorities[(currentIndex + 1) % priorities.length];
    } else if (type === "privacy") {
      updated.isPublic = !updated.isPublic;
    } else if (type === "category" && typeof value === 'string') {
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
                placeholder="Smart quick add... (e.g., Urgent meeting tomorrow afternoon)"
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
                    <CheckCircle2 size={12} className="opacity-70" />
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
                    <CheckCircle2 size={12} className="opacity-70" />
                  </motion.button>
                  
                  {/* Privacy Badge - Clickable to toggle */}
                  <motion.button
                    type="button"
                    onClick={() => togglePreviewItem("privacy")}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 text-sm font-medium transition-all ${
                      preview.isPublic
                        ? "bg-green-50 border-green-400 text-green-700 hover:border-green-500"
                        : "bg-slate-50 border-slate-400 text-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {preview.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    <span>{preview.isPublic ? 'Public' : 'Private'}</span>
                    <CheckCircle2 size={12} className="opacity-70" />
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
                        <CheckCircle2 size={12} className="opacity-70" />
                      </motion.button>
                    );
                  })}
                  
                  {/* Date/Time Display */}
                  {(preview.time || preview.startTime) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 bg-indigo-50 border-indigo-300 text-indigo-700 text-sm font-medium"
                    >
                      <Clock size={14} />
                      <span>{formatDateTime(preview.time || preview.startTime!)}</span>
                      <CheckCircle2 size={12} className="opacity-70" />
                    </motion.div>
                  )}
                </div>

                {/* Smart Suggestions - Dotted borders for user confirmation */}
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        Smart Suggestions (tap to confirm)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                            ${suggestion.confidence === 'high' 
                              ? 'border-2 border-dashed bg-white/80 backdrop-blur-sm hover:bg-white' 
                              : 'border border-dashed bg-white/50 backdrop-blur-sm hover:bg-white/80'
                            }
                          `}
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
                          {suggestion.confidence === 'high' && (
                            <span className="text-xs opacity-60">(likely)</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        
        {/* Helpful Tips */}
        {!input && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-xs text-muted-foreground px-1"
          >
            <p className="opacity-70">
              💡 Try: "Urgent team meeting tomorrow afternoon", "Pay bills next business day", "Review docs this Friday"
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
