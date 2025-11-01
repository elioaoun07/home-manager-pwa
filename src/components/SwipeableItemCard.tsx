"use client";

import { ItemWithDetails } from "@/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { 
  Bell, Calendar, Tag, Trash2, Edit, Clock, CheckCircle2, Circle, 
  Globe, Lock, ListChecks, MapPin, Flame, StickyNote, Archive, 
  RotateCcw 
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SwipeableItemCardProps {
  item: ItemWithDetails;
  onToggleComplete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  viewDensity?: "compact" | "comfy";
}

export function SwipeableItemCard({ 
  item, 
  onToggleComplete, 
  onView, 
  onEdit, 
  onDelete, 
  onArchive,
  onUnarchive,
  viewDensity = "comfy" 
}: SwipeableItemCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [swipeState, setSwipeState] = useState<'closed' | 'left' | 'right'>('closed');
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const getItemDate = (): Date | null => {
    if (item.type === "event" && item.event_details?.start_at) {
      return new Date(item.event_details.start_at);
    } else if (item.type === "reminder" && item.reminder_details?.due_at) {
      return new Date(item.reminder_details.due_at);
    }
    return null;
  };

  const itemDate = getItemDate();
  const isCompleted = item.status === "done";
  const isArchived = !!item.archived_at;
  const isOverdue = itemDate && !isCompleted && itemDate < new Date();

  const config = item.type === "reminder" 
    ? { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-50" } 
    : item.type === "event"
    ? { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" }
    : { icon: StickyNote, color: "text-orange-600", bgColor: "bg-orange-50" };
  const Icon = config.icon;
  const completedSubtasks = item.subtasks?.filter(st => st.done_at).length || 0;
  const totalSubtasks = item.subtasks?.length || 0;

  useEffect(() => {
    if (!itemDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = itemDate.getTime() - now.getTime();

      if (diff < 0) {
        setTimeLeft("overdue");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`in ${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`in ${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`in ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`in ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [itemDate]);

  const handleLocationClick = () => {
    if (item.event_details?.location_text) {
      if (item.event_details.location_text.startsWith('http')) {
        window.open(item.event_details.location_text, '_blank');
      } else {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.event_details.location_text)}`;
        window.open(mapsUrl, '_blank');
      }
    }
  };

  const getUrgencyConfig = () => {
    switch (item.priority) {
      case "urgent":
        return { gradient: "from-red-500 to-red-600", color: "text-red-600" };
      case "high":
        return { gradient: "from-amber-400 to-amber-500", color: "text-amber-600" };
      case "low":
        return { gradient: "from-slate-300 to-slate-400", color: "text-slate-600" };
      default:
        return null;
    }
  };

  const urgencyConfig = getUrgencyConfig();
  const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';

  // Get gradient colors based on item type
  const getSwipeGradient = () => {
    switch (item.type) {
      case "note":
        return "from-orange-500 to-amber-500"; // Orange gradient for notes
      case "reminder":
        return "from-blue-500 to-cyan-500"; // Blue gradient for reminders
      case "event":
        return "from-green-500 to-emerald-500"; // Green gradient for events
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const swipeGradient = getSwipeGradient();

  // iOS-style swipe behavior
  const SWIPE_THRESHOLD = 60; // Minimum drag to trigger swipe state
  const SWIPE_OPEN_AMOUNT = -80; // How far to keep it open (negative for left swipe)
  const SWIPE_RIGHT_OPEN_AMOUNT = 80; // How far to keep it open for right swipe

  // Track drag direction
  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    if (info.offset.x < -10) {
      setDragDirection('left');
    } else if (info.offset.x > 10) {
      setDragDirection('right');
    }
  };

  // Handle drag end - determine if we should keep it open
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
    const offset = info.offset.x;
    setIsDragging(false);

    // Left swipe (show edit/delete)
    if (offset < -SWIPE_THRESHOLD) {
      setSwipeState('left');
      setDragDirection('left');
    }
    // Right swipe (show archive)
    else if (offset > SWIPE_THRESHOLD) {
      setSwipeState('right');
      setDragDirection('right');
    }
    // Not enough - close it
    else {
      setSwipeState('closed');
      setDragDirection(null);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Close swipe if open
    if (swipeState !== 'closed') {
      setSwipeState('closed');
      setDragDirection(null);
      return;
    }
    // Only open view if not dragging and not clicking checkbox
    if (!isDragging && !(e.target as HTMLElement).closest('button')) {
      onView(item);
    }
  };

  const isDueSoon = itemDate && !isCompleted && !isOverdue && 
    (itemDate.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

  const publicPrivateStyles = item.is_public 
    ? { bg: 'bg-blue-500', text: 'text-blue-700', borderColor: '#3b82f6' }
    : { bg: 'bg-purple-600', text: 'text-purple-700', borderColor: '#9333ea' };

  const totalCategories = item.categories?.length || 0;

  // Compact view
  if (viewDensity === "compact") {
    return (
      <div className="overflow-hidden rounded-xl mb-1.5">
        <div className="relative">
          {/* Full background color layer - at the very back */}
          <div className={`absolute inset-0 bg-gradient-to-r ${swipeGradient}`} />
          
          {/* Right side - Edit/Delete icons (shown when swiping LEFT) */}
          <div className="absolute inset-y-0 right-0 flex items-center gap-3 px-4 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSwipeState('closed');
                setDragDirection(null);
                onEdit(item);
              }}
              className="flex flex-col items-center gap-0.5 hover:scale-110 transition-transform active:scale-95"
            >
              <Edit size={20} className="text-white" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-white">Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this item?')) {
                  setSwipeState('closed');
                  setDragDirection(null);
                  onDelete(item.id);
                }
              }}
              className="flex flex-col items-center gap-0.5 hover:scale-110 transition-transform active:scale-95"
            >
              <Trash2 size={20} className="text-white" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-white">Delete</span>
            </button>
          </div>

          {/* Left side - Archive icon (shown when swiping RIGHT) */}
          <div className="absolute inset-y-0 left-0 flex items-center gap-3 px-4 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSwipeState('closed');
                setDragDirection(null);
                if (isArchived && onUnarchive) {
                  onUnarchive(item.id);
                } else if (!isArchived && onArchive) {
                  onArchive(item.id);
                }
              }}
              className="flex flex-col items-center gap-0.5 hover:scale-110 transition-transform active:scale-95"
            >
              {isArchived ? <RotateCcw size={20} className="text-white" strokeWidth={2.5} /> : <Archive size={20} className="text-white" strokeWidth={2.5} />}
              <span className="text-[10px] font-semibold text-white">{isArchived ? 'Restore' : 'Archive'}</span>
            </button>
          </div>

        {/* Main card - draggable, sits on top */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.2}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          animate={{
            x: swipeState === 'left' ? SWIPE_OPEN_AMOUNT : swipeState === 'right' ? SWIPE_RIGHT_OPEN_AMOUNT : 0
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative p-2.5 rounded-xl border shadow-sm bg-white dark:bg-gray-900 border-l-[4px] cursor-pointer touch-pan-y z-20"
          style={{
            borderLeftColor: publicPrivateStyles.borderColor,
          }}
        >
          {/* Row 1: Checkbox + Title + Urgency */}
          <div className="flex items-start gap-2 mb-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(item.id);
              }}
              className="flex-shrink-0 min-w-[40px] min-h-[40px] -m-2 p-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              {isCompleted ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <Circle size={18} className="text-gray-400" />
              )}
            </button>
            
            <h3
              className={`text-sm font-medium flex-1 line-clamp-2 leading-tight ${
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}
            >
              {item.title}
            </h3>

            {!isCompleted && urgencyConfig && (
              <div className={`p-0.5 rounded-md bg-gradient-to-br ${urgencyConfig.gradient} flex-shrink-0`}>
                <Flame size={11} className="text-white drop-shadow-sm" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Row 2: Metadata only */}
          <div className="flex items-center gap-1.5 flex-wrap pl-9">
            {!isCompleted && isOverdue && itemDate && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 inline-flex items-center gap-0.5">
                <Clock size={9} strokeWidth={2} />
                {formatRelativeTime(itemDate)}
              </span>
            )}
            
            {!isCompleted && isDueSoon && itemDate && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 inline-flex items-center gap-0.5">
                <Clock size={9} strokeWidth={2} />
                {formatRelativeTime(itemDate)}
              </span>
            )}

            {!isCompleted && !isOverdue && !isDueSoon && itemDate && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-flex items-center gap-0.5">
                <Clock size={9} strokeWidth={2} />
                {formatRelativeTime(itemDate)}
              </span>
            )}

            {item.categories && item.categories.length > 0 && (
              <span 
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
                style={{ 
                  backgroundColor: `${item.categories[0].color_hex}20`,
                  color: item.categories[0].color_hex
                }}
              >
                <Tag size={8} />
                {item.categories[0].name}
                {totalCategories > 1 && (
                  <span className="opacity-70">+{totalCategories - 1}</span>
                )}
              </span>
            )}

            {isArchived && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center gap-0.5">
                <Archive size={8} />
                Archived
              </span>
            )}
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

  // Comfy view
  return (
    <div className="overflow-hidden rounded-xl mb-3">
      <div className="relative">
        {/* Full background color layer - at the very back */}
        <div className={`absolute inset-0 bg-gradient-to-r ${swipeGradient}`} />
        
        {/* Right side - Edit/Delete icons (shown when swiping LEFT) */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-6 px-6 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeState('closed');
              setDragDirection(null);
              onEdit(item);
            }}
            className="flex items-center gap-2 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <Edit size={24} strokeWidth={2.5} />
            <span className="font-bold text-lg">Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this item?')) {
                setSwipeState('closed');
                setDragDirection(null);
                onDelete(item.id);
              }
            }}
            className="flex items-center gap-2 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <Trash2 size={24} strokeWidth={2.5} />
            <span className="font-bold text-lg">Delete</span>
          </button>
        </div>

        {/* Left side - Archive icon (shown when swiping RIGHT) */}
        <div className="absolute inset-y-0 left-0 flex items-center gap-6 px-6 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwipeState('closed');
              setDragDirection(null);
              if (isArchived && onUnarchive) {
                onUnarchive(item.id);
              } else if (!isArchived && onArchive) {
                onArchive(item.id);
              }
            }}
            className="flex items-center gap-2 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <span className="font-bold text-lg">{isArchived ? 'Restore' : 'Archive'}</span>
            {isArchived ? <RotateCcw size={24} strokeWidth={2.5} /> : <Archive size={24} strokeWidth={2.5} />}
          </button>
        </div>

      {/* Main card - draggable, sits on top */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        animate={{
          x: swipeState === 'left' ? SWIPE_OPEN_AMOUNT : swipeState === 'right' ? SWIPE_RIGHT_OPEN_AMOUNT : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative p-4 rounded-xl border bg-card shadow-sm cursor-pointer touch-pan-y z-20 ${
          isOverdue && !isCompleted ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : ''
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: isOverdue && !isCompleted ? 'hsl(0 84% 60%)' : categoryColor,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div 
              className="flex-shrink-0 p-2 rounded-lg"
              style={{ 
                backgroundColor: `${categoryColor}20`,
              }}
            >
              <Icon size={20} style={{ color: categoryColor }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={isCompleted ? "line-through text-muted-foreground font-semibold" : "font-semibold text-foreground"}>
                  {item.title}
                </h3>
                {item.is_public ? (
                  <Globe size={14} className="text-muted-foreground flex-shrink-0" />
                ) : (
                  <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                )}
                {urgencyConfig && (
                  <div className={`p-1 rounded-lg bg-gradient-to-br ${urgencyConfig.gradient}`}>
                    <Flame size={12} className="text-white drop-shadow-sm" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              
              {item.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  {item.categories.map(c => {
                    const bgColor = c.color_hex ? `${c.color_hex}20` : '#22c55e20';
                    const textColor = c.color_hex || '#16a34a';
                    return (
                      <span 
                        key={c.id} 
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ 
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                      >
                        <Tag size={10} />
                        {c.name}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {item.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {itemDate && (
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
                    <Clock size={10} />
                    {formatRelativeTime(itemDate)} · {formatTime(itemDate)}
                    {timeLeft && timeLeft !== "overdue" && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        · {timeLeft}
                      </span>
                    )}
                  </span>
                )}
                {totalSubtasks > 0 && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                    <ListChecks size={10} />
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
                {isArchived && (
                  <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Archive size={10} />
                    Archived
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(item.id);
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="text-green-600" />
                    ) : (
                      <Circle size={22} className="text-gray-400 hover:text-green-600 transition-colors" />
                    )}
                  </button>
                </div>
                
                {/* Swipe hint */}
                <span className="text-xs text-muted-foreground/60 italic">
                  ← Delete · Archive →
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-shrink-0">
            {item.event_details?.location_text && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocationClick();
                }}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center"
                title="Open in Google Maps"
              >
                <MapPin size={16} className="text-blue-600" strokeWidth={2} />
              </button>
            )}
            
            {/* Edit button - always visible */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors flex items-center justify-center"
              title="Edit"
            >
              <Edit size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
