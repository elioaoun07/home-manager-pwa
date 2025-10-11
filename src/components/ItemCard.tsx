"use client";

import { ItemWithDetails } from "@/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { Bell, Calendar, Tag, Trash2, Edit, Clock, CheckCircle2, Circle, Globe, Lock, ListChecks, MapPin, Flame } from "lucide-react";
import { useEffect, useState } from "react";

interface ItemCardProps {
  item: ItemWithDetails;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
}

export function ItemCard({ item, onToggleComplete, onEdit, onDelete }: ItemCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

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
  const isOverdue = itemDate && !isCompleted && itemDate < new Date();

  const config = item.type === "reminder" ? { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-50" } : { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" };
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

  return (
    <div className={`mb-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow ${isOverdue ? 'animate-pulse-red' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}>
            <Icon size={20} className={config.color} />
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
                {item.type === "reminder" && (
                  <button onClick={() => onToggleComplete(item.id)}>
                    {isCompleted ? <CheckCircle2 size={22} className="text-green-600" /> : <Circle size={22} className="text-gray-400 hover:text-green-600" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column: Map icon (top) and Edit/Delete buttons (bottom) */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
          {/* Map icon at top */}
          {item.event_details?.location_text && (
            <button
              onClick={handleLocationClick}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Open in Google Maps"
            >
              <MapPin size={16} className="text-blue-600" strokeWidth={2} />
            </button>
          )}
          
          {/* Edit/Delete buttons at bottom */}
          <div className="flex items-center gap-2 mt-auto">
            <button 
              onClick={() => onEdit(item)} 
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(item.id)} 
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
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
