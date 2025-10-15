"use client";

import { ItemWithDetails } from "@/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { 
  Bell, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Globe, 
  Lock, 
  ListChecks,
  Flame,
  CheckCircle2,
  Circle,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useEffect, useState } from "react";

interface ViewDetailsProps {
  item: ItemWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export function ViewDetails({ 
  item, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onToggleComplete 
}: ViewDetailsProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!item) return;

    const getItemDate = (): Date | null => {
      if (item.type === "event" && item.event_details?.start_at) {
        return new Date(item.event_details.start_at);
      } else if (item.type === "reminder" && item.reminder_details?.due_at) {
        return new Date(item.reminder_details.due_at);
      }
      return null;
    };

    const itemDate = getItemDate();
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
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [item]);

  if (!item) return null;

  const categoryColor = item.categories?.[0]?.color_hex || '#6366f1';
  const isCompleted = item.status === "done";
  const Icon = item.type === "reminder" ? Bell : Calendar;
  
  const getItemDate = (): Date | null => {
    if (item.type === "event" && item.event_details?.start_at) {
      return new Date(item.event_details.start_at);
    } else if (item.type === "reminder" && item.reminder_details?.due_at) {
      return new Date(item.reminder_details.due_at);
    }
    return null;
  };

  const itemDate = getItemDate();
  const isOverdue = itemDate && !isCompleted && itemDate < new Date();

  const getUrgencyConfig = () => {
    switch (item.priority) {
      case "urgent":
        return { gradient: "from-red-500 to-red-600", label: "Urgent", color: "text-red-600" };
      case "high":
        return { gradient: "from-amber-400 to-amber-500", label: "High Priority", color: "text-amber-600" };
      case "low":
        return { gradient: "from-slate-300 to-slate-400", label: "Low Priority", color: "text-slate-600" };
      default:
        return { label: "Normal", color: "text-muted-foreground" };
    }
  };

  const urgencyConfig = getUrgencyConfig();
  const completedSubtasks = item.subtasks?.filter(st => st.done_at).length || 0;
  const totalSubtasks = item.subtasks?.length || 0;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
          <DrawerTitle className="sr-only">View Details</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-8">
          {/* Header with icon and completion toggle */}
          <div className="flex items-start gap-4 mb-6">
            <div 
              className="p-4 rounded-2xl flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Icon size={32} style={{ color: categoryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-2xl font-bold mb-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onToggleComplete(item.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={18} className="text-green-600" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle size={18} className="text-muted-foreground" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
                {item.is_public ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe size={14} />
                    Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Lock size={14} />
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mb-6 p-4 rounded-xl bg-muted/50">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {/* Key Info Cards */}
          <div className="space-y-3 mb-6">
            {/* Time Info */}
            {itemDate && (
              <div className={`p-4 rounded-xl border-l-4 ${isOverdue ? 'bg-destructive/5 border-destructive' : 'bg-card border-primary'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className={isOverdue ? "text-destructive" : "text-primary"} />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {item.type === "event" ? "Event Time" : "Due Date"}
                      </div>
                      <div className="text-lg font-semibold">
                        {formatRelativeTime(itemDate)} · {formatTime(itemDate)}
                      </div>
                      {item.type === "event" && item.event_details && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(item.event_details.start_at).toLocaleString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                          {!item.event_details.all_day && ` - ${new Date(item.event_details.end_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}`}
                        </div>
                      )}
                    </div>
                  </div>
                  {timeLeft && timeLeft !== "overdue" && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Time Left</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {timeLeft}
                      </div>
                    </div>
                  )}
                  {isOverdue && (
                    <div className="text-lg font-bold text-destructive">
                      Overdue
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Priority */}
            <div className="p-4 rounded-xl bg-card border">
              <div className="flex items-center gap-3">
                {urgencyConfig.gradient ? (
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${urgencyConfig.gradient}`}>
                    <Flame size={20} className="text-white" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-muted">
                    <Flame size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Priority</div>
                  <div className={`text-lg font-semibold ${urgencyConfig.color}`}>
                    {urgencyConfig.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Location (for events) */}
            {item.event_details?.location_text && (
              <div className="p-4 rounded-xl bg-card border">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                    <a
                      href={item.event_details.location_text.startsWith('http') 
                        ? item.event_details.location_text 
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.event_details.location_text)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      {item.event_details.location_text}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {item.categories && item.categories.length > 0 && (
              <div className="p-4 rounded-xl bg-card border">
                <div className="flex items-start gap-3">
                  <Tag size={20} className="text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {item.categories.map(c => (
                        <span
                          key={c.id}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${c.color_hex}20`,
                            color: c.color_hex
                          }}
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <div className="p-4 rounded-xl bg-card border">
                <div className="flex items-start gap-3">
                  <ListChecks size={20} className="text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-3">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {item.subtasks?.map(subtask => (
                        <div
                          key={subtask.id}
                          className={`flex items-center gap-2 text-sm ${
                            subtask.done_at ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {subtask.done_at ? (
                            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                          ) : (
                            <Circle size={16} className="text-muted-foreground flex-shrink-0" />
                          )}
                          <span>{subtask.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Buttons - Edit and Delete */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="p-4 rounded-full bg-destructive/20 backdrop-blur-md border border-destructive/30 text-destructive shadow-lg hover:bg-destructive/30 hover:shadow-xl hover:scale-110 transition-all"
            title="Delete"
          >
            <Trash2 size={22} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              onEdit(item);
              onClose();
            }}
            className="p-4 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary shadow-lg hover:bg-primary/30 hover:shadow-xl hover:scale-110 transition-all"
            title="Edit"
          >
            <Edit2 size={22} strokeWidth={2} />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
