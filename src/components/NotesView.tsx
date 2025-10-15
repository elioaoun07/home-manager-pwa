"use client";

import { ItemWithDetails } from "@/types";
import { ItemCard } from "./ItemCard";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";

interface NotesViewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
}

export function NotesView({ items, onToggleComplete, onEdit, onDelete, onView }: NotesViewProps) {
  // Filter for notes: reminders without a due_at date
  const notes = items.filter(item => 
    item.type === "reminder" && !item.reminder_details?.due_at
  );

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
          <StickyNote size={24} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gradient">Notes</h2>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
      </motion.div>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <StickyNote size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create quick notes for things you want to remember without setting a specific date or time.
            </p>
          </motion.div>
        ) : (
          notes.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ItemCard
                item={item}
                onToggleComplete={onToggleComplete}
                onView={onEdit}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
