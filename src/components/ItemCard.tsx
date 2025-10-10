"use client";

import { Item } from "@/types";
import { formatRelativeTime, formatTime, isOverdue, getItemDate } from "@/lib/utils";
import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Bell, Calendar, Check, Tag, Trash2, Edit, Repeat, AlertTriangle, Clock, CheckCircle2, Circle } from "lucide-react";

interface ItemCardProps {
  item: Item;
  onToggleComplete: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function ItemCard({ item, onToggleComplete, onEdit, onDelete }: ItemCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);
  
  const overdue = isOverdue(item);
  const itemDate = getItemDate(item);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    
    if (info.offset.x < -threshold) {
      // Swipe left to delete
      onDelete(item.id);
    } else if (info.offset.x > threshold) {
      // Swipe right to edit
      onEdit(item);
    }
    
    x.set(0);
  };

  const typeConfig = {
    reminder: {
      icon: Bell,
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
      gradient: "from-info/20 to-transparent",
    },
    todo: {
      icon: Check,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      gradient: "from-success/20 to-transparent",
    },
    event: {
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      gradient: "from-primary/20 to-transparent",
    },
  };

  const priorityConfig = {
    urgent: {
      color: "border-l-destructive",
      glow: "shadow-destructive/20",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
    },
    high: {
      color: "border-l-warning",
      glow: "shadow-warning/20",
      badge: "bg-warning/10 text-warning border-warning/20",
    },
    normal: {
      color: "border-l-primary",
      glow: "shadow-primary/10",
      badge: "bg-primary/10 text-primary border-primary/20",
    },
    low: {
      color: "border-l-muted-foreground",
      glow: "shadow-muted-foreground/10",
      badge: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
  };

  const config = typeConfig[item.type];
  const priorityStyle = priorityConfig[item.priority];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.9,
        x: -100,
        transition: { duration: 0.2 } 
      }}
      whileHover={{ y: -2 }}
      className="mb-3"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        className={`
          relative overflow-hidden rounded-2xl border-l-4 ${priorityStyle.color}
          ${overdue ? 'glass border border-destructive/30 shadow-lg ' + priorityStyle.glow : 'glass-strong border border-border/50 shadow-elevated'}
          transition-all duration-300 cursor-grab active:cursor-grabbing
          ${isPressed ? 'scale-[0.98]' : ''}
        `}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />
        
        {/* Overdue indicator */}
        {overdue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-destructive/5"
          />
        )}

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <motion.div
              whileHover={{ rotate: 360, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`flex-shrink-0 p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}
            >
              <Icon size={20} className={config.color} />
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className={`font-semibold text-lg mb-1 ${
                item.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}>
                {item.title}
              </h3>

              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.notes}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {itemDate && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      overdue 
                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                        : "bg-card/50 text-muted-foreground border-border/50"
                    }`}
                  >
                    <Clock size={12} />
                    <span>{formatRelativeTime(itemDate)} · {formatTime(itemDate)}</span>
                  </motion.div>
                )}

                {item.categories.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring" }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-medium"
                  >
                    <Tag size={12} />
                    <span>{item.categories.join(", ")}</span>
                  </motion.div>
                )}

                {item.recurrence && item.recurrence.preset !== "none" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                  >
                    <Repeat size={12} />
                    <span className="capitalize">{item.recurrence.preset}</span>
                  </motion.div>
                )}

                {item.priority !== "normal" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: "spring" }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${priorityStyle.badge}`}
                  >
                    <AlertTriangle size={12} />
                    <span className="capitalize">{item.priority}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Complete Button */}
            {(item.type === "todo" || item.type === "reminder") && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => onToggleComplete(item.id)}
                className={`flex-shrink-0 relative group`}
              >
                <motion.div
                  animate={{
                    scale: item.completed ? [1, 1.2, 1] : 1,
                    rotate: item.completed ? [0, 10, -10, 0] : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                    ${item.completed
                      ? "bg-success border-success text-white shadow-lg glow-success"
                      : "border-muted-foreground/30 hover:border-success hover:bg-success/10 group-hover:shadow-md"
                    }
                  `}
                >
                  {item.completed ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Circle size={22} className="opacity-50 group-hover:opacity-100" />
                  )}
                </motion.div>
              </motion.button>
            )}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mt-4 pt-3 border-t border-border/50"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onEdit(item)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Edit size={16} /> Edit
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onDelete(item.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </motion.button>
          </motion.div>
        </div>

        {/* Swipe indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.abs(x.get()) > 20 ? 1 : 0 }}
          className="absolute inset-y-0 left-0 w-20 flex items-center justify-start pl-4 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"
        >
          <Edit className="text-primary" size={24} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.abs(x.get()) > 20 ? 1 : 0 }}
          className="absolute inset-y-0 right-0 w-20 flex items-center justify-end pr-4 bg-gradient-to-l from-destructive/20 to-transparent pointer-events-none"
        >
          <Trash2 className="text-destructive" size={24} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
