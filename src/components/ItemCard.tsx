"use client";

import { ItemWithDetails } from "@/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { Bell, Calendar, Tag, Trash2, Edit, Clock, CheckCircle2, Circle, Globe, Lock, ListChecks, MapPin, Flame, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";

interface ItemCardProps {
  item: ItemWithDetails;
  onToggleComplete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  viewDensity?: "compact" | "comfy";
}

export function ItemCard({ item, onToggleComplete, onView, onEdit, onDelete, viewDensity = "comfy" }: ItemCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  const getItemDate = (): Date | null => {
    if (item.type === "event" && item.event_details?.start_at) {
      return new Date(item.event_details.start_at);
    } else if (item.type === "reminder" && item.reminder_details?.due_at) {
      return new Date(item.reminder_details.due_at);
    }
    // Notes don't have dates
    return null;
  };

  const itemDate = getItemDate();
  const isCompleted = item.status === "done";
  const isOverdue = itemDate && !isCompleted && itemDate < new Date();

  const config = item.type === "reminder" 
    ? { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-50" } 
    : item.type === "event"
    ? { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" }
    : { icon: StickyNote, color: "text-orange-600", bgColor: "bg-orange-50" };
  const Icon = config.icon;
  const completedSubtasks = item.subtasks?.filter(st => st.done_at).length || 0;
  const totalSubtasks = item.subtasks?.length || 0;

  // Calculate live countdown
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
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [itemDate]);

  const handleLocationClick = () => {
    if (item.event_details?.location_text) {
      // Check if it's already a URL (Google Maps link)
      if (item.event_details.location_text.startsWith('http')) {
        window.open(item.event_details.location_text, '_blank');
      } else {
        // Search on Google Maps
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.event_details.location_text)}`;
        window.open(mapsUrl, '_blank');
      }
    }
  };

  // Get urgency gradient and icon
  const getUrgencyConfig = () => {
    switch (item.priority) {
      case "urgent":
        return { gradient: "from-red-500 to-red-600", color: "text-red-600" };
      case "high":
        return { gradient: "from-amber-400 to-amber-500", color: "text-amber-600" };
      case "low":
        return { gradient: "from-slate-300 to-slate-400", color: "text-slate-600" };
      default:
        return null; // normal = no icon
    }
  };

  const urgencyConfig = getUrgencyConfig();

  // Get primary category color
  const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';

  if (viewDensity === "compact") {
    // Calculate if due soon (< 24 hours)
    const isDueSoon = itemDate && !isCompleted && !isOverdue && 
      (itemDate.getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;

    // Determine background and border colors based on public/private (from images)
    const publicPrivateStyles = item.is_public 
      ? { bg: 'bg-blue-500', text: 'text-blue-700', borderColor: '#3b82f6' } // Blue for public
      : { bg: 'bg-purple-600', text: 'text-purple-700', borderColor: '#9333ea' }; // Purple for private

    const totalCategories = item.categories?.length || 0;

    return (
      <div
        onClick={() => onView(item)}
        className="mb-2 p-3 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-[4px] bg-white dark:bg-gray-900"
        style={{
          borderLeftColor: publicPrivateStyles.borderColor,
        }}
      >
        {/* Row 1: Checkbox + Title (max 2 lines) + Urgency */}
        <div className="flex items-start gap-2.5 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(item.id);
            }}
            className="flex-shrink-0 min-w-[44px] min-h-[44px] -m-2.5 p-2.5 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {isCompleted ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <Circle size={20} className="text-gray-400" />
            )}
          </button>
          
          <h3
            className={`text-base font-medium flex-1 line-clamp-2 leading-snug ${
              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}
          >
            {item.title}
          </h3>

          {!isCompleted && urgencyConfig && (
            <div className={`p-1 rounded-lg bg-gradient-to-br ${urgencyConfig.gradient} flex-shrink-0`}>
              <Flame size={12} className="text-white drop-shadow-sm" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Row 2: Due status pill + Category (show first + count) + Delete */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Spacer to align with title (same width as checkbox) */}
          <div className="w-5 flex-shrink-0" />
          
          {!isCompleted && isOverdue && itemDate && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 inline-flex items-center gap-1">
              <Clock size={10} strokeWidth={2} />
              {formatRelativeTime(itemDate)}
            </span>
          )}
          
          {!isCompleted && isDueSoon && itemDate && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 inline-flex items-center gap-1">
              <Clock size={10} strokeWidth={2} />
              {formatRelativeTime(itemDate)}
            </span>
          )}

          {!isCompleted && !isOverdue && !isDueSoon && itemDate && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground inline-flex items-center gap-1">
              <Clock size={10} strokeWidth={2} />
              {formatRelativeTime(itemDate)}
            </span>
          )}

          {item.categories && item.categories.length > 0 && (
            <span 
              className="text-[10px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1"
              style={{ 
                backgroundColor: `${item.categories[0].color_hex}20`,
                color: item.categories[0].color_hex
              }}
            >
              <Tag size={10} />
              {item.categories[0].name}
              {totalCategories > 1 && (
                <span className="opacity-70">+{totalCategories - 1}</span>
              )}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this item?')) {
                onDelete(item.id);
              }
            }}
            className="ml-auto min-w-[44px] min-h-[44px] -my-2 -mr-2 p-2 flex items-center justify-center text-red-500 hover:text-red-600 active:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded transition-colors"
            aria-label="Delete item"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }


  // Comfy View (default)
  return (
    <div 
      onClick={() => onView(item)}
      className={`mb-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isOverdue && !isCompleted ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : ''
      }`}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: isOverdue && !isCompleted ? 'hsl(0 84% 60%)' : categoryColor
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
              <h3 className={isCompleted ? "line-through text-muted-foreground font-semibold" : "font-semibold text-foreground"}>{item.title}</h3>
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
            
            {/* Categories under title */}
            {item.categories && item.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mb-2">
                {item.categories.map(c => {
                  const bgColor = c.color_hex ? `${c.color_hex}20` : '#22c55e20'; // 20 = 12.5% opacity
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
            
            {/* Description with darker/bolder text */}
            {item.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1 mb-2 line-clamp-2">
                {item.description}
              </p>
            )}
            
            {/* Time and other metadata */}
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
            </div>
            
            {/* Bottom action buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(item.id);
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={22} className="text-green-600" /> : <Circle size={22} className="text-gray-400 hover:text-green-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column: Map icon (top) and Edit/Delete buttons (bottom) */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
          {/* Map icon at top */}
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
          
          {/* Edit/Delete buttons at bottom */}
          <div className="flex items-center gap-2 mt-auto">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
