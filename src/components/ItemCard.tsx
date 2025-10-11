"use client";

import { ItemWithDetails } from "@/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { Bell, Calendar, Tag, Trash2, Edit, AlertTriangle, Clock, CheckCircle2, Circle, Globe, Lock, ListChecks } from "lucide-react";

interface ItemCardProps {
  item: ItemWithDetails;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
}

export function ItemCard({ item, onToggleComplete, onEdit, onDelete }: ItemCardProps) {
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

  return (
    <div className="mb-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}>
          <Icon size={20} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={isCompleted ? "line-through text-muted-foreground font-semibold" : "font-semibold"}>{item.title}</h3>
          {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
          {item.event_details?.location_text && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Calendar size={12} />{item.event_details.location_text}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded bg-muted flex items-center gap-1">{item.is_public ? <Globe size={10} /> : <Lock size={10} />}{item.is_public ? "Public" : "Private"}</span>
            {itemDate && <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted"}`}><Clock size={10} />{formatRelativeTime(itemDate)} · {formatTime(itemDate)}</span>}
            {item.categories && item.categories.length > 0 && <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 flex items-center gap-1"><Tag size={10} />{item.categories.map(c => c.name).join(", ")}</span>}
            {totalSubtasks > 0 && <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-center gap-1"><ListChecks size={10} />{completedSubtasks}/{totalSubtasks}</span>}
            {item.priority !== "normal" && <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 flex items-center gap-1"><AlertTriangle size={10} />{item.priority}</span>}
          </div>
        </div>
        {item.type === "reminder" && <button onClick={() => onToggleComplete(item.id)} className="flex-shrink-0">{isCompleted ? <CheckCircle2 size={24} className="text-green-600" /> : <Circle size={24} className="text-gray-400 hover:text-green-600" />}</button>}
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <button onClick={() => onEdit(item)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Edit size={14} /> Edit</button>
        <button onClick={() => onDelete(item.id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 size={14} /> Delete</button>
      </div>
    </div>
  );
}
