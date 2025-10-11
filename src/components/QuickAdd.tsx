"use client";

import { useState, useEffect, useRef } from "react";
import { parseQuickAdd } from "@/lib/parser";
import { ParsedInput } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Bell, Calendar, Tag, AlertTriangle, Repeat, Sparkles, Send, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddProps {
  onAdd: (parsed: ParsedInput) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParsedInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      const parsed = parseQuickAdd(input);
      setPreview(parsed);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const parsed = parseQuickAdd(input);
      onAdd(parsed);
      setInput("");
      setPreview(null);
      inputRef.current?.focus();
    }
  };

  const typeIcon = {
    reminder: <Bell size={16} className="text-info" />,
    event: <Calendar size={16} className="text-primary" />,
  };

  const typeBadge = {
    reminder: "bg-info/10 text-info border-info/20",
    event: "bg-primary/10 text-primary border-primary/20",
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
        <form onSubmit={handleSubmit} className="relative">
          <div className={`
            relative overflow-hidden rounded-2xl transition-all duration-300
            ${isFocused ? 'ring-2 ring-primary shadow-elevated-lg glow-primary' : 'shadow-md'}
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-info/5" />
            
            <div className="relative flex items-center gap-2 bg-card/95 backdrop-blur">
              <motion.div
                animate={{
                  rotate: isFocused ? [0, 10, -10, 0] : 0,
                  scale: isFocused ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                className="pl-4"
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
                placeholder="Quick Add: Pay bills tomorrow 9am #home !high"
                className="flex-1 py-4 pr-4 text-base bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
                autoFocus
              />
              
              <AnimatePresence>
                {input.trim() && (
                  <motion.button
                    type="submit"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="mr-2 p-2.5 rounded-xl bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Send size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </form>

        <AnimatePresence>
          {preview && input.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="mt-3 p-3 rounded-xl glass border border-white/10 dark:border-gray-700/50 shadow-elevated"
            >
              <div className="flex flex-wrap items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium text-sm ${typeBadge[preview.type]}`}
                >
                  {typeIcon[preview.type]}
                  <span className="capitalize">{preview.type}</span>
                </motion.div>

                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-semibold text-foreground"
                >
                  {preview.title}
                </motion.span>
                
                {preview.priority !== "normal" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      preview.priority === "urgent" 
                        ? "bg-destructive/10 text-destructive border border-destructive/20" 
                        : preview.priority === "high" 
                        ? "bg-warning/10 text-warning border border-warning/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <AlertTriangle size={12} /> {preview.priority}
                  </motion.div>
                )}
                
                {preview.categories.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 500 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-medium"
                  >
                    <Tag size={12} /> {preview.categories.join(", ")}
                  </motion.div>
                )}
                
                {(preview.time || preview.startTime) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-info/10 text-info border border-info/20 text-xs font-medium"
                  >
                    <Calendar size={12} /> {formatDateTime(preview.time || preview.startTime!)}
                  </motion.div>
                )}
                
                {preview.recurrence && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 500 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                  >
                    <Repeat size={12} /> recurring
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Zap size={12} className="text-primary" />
          <span>Try: <span className="font-mono text-foreground/70">#work !high tomorrow 5pm /reminder</span></span>
        </motion.div>
      </div>
    </motion.div>
  );
}
