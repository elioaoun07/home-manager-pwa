"use client";

import { ItemWithDetails } from "@/types";
import { ItemCard } from "./ItemCard";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { StickyNote, Trophy, ChevronDown, Archive } from "lucide-react";

interface NotesViewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
  viewDensity?: "compact" | "comfy";
  showArchived?: boolean;
}

export function NotesView({ items, onToggleComplete, onEdit, onDelete, viewDensity = "comfy", showArchived = false }: NotesViewProps) {
  // Filter for notes: items with type='note'
  const notes = items.filter(item => item.type === "note");

  // Collapsible state: Completed container collapsed by default
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["completed"]));

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) newSet.delete(sectionName);
      else newSet.add(sectionName);
      return newSet;
    });
  };

  // Helper to detect if a date is within the current week (Monday-start)
  const isDateInCurrentWeek = (d: Date) => {
    const now = new Date();
    // compute Monday of current week
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const daysSinceMonday = (day + 6) % 7; // 0 for Monday
    const start = new Date(now);
    start.setHours(0,0,0,0);
    start.setDate(now.getDate() - daysSinceMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  };

  // Open notes: pending and cancelled notes (active/actionable) - exclude archived
  const openNotes = notes.filter(n => (n.status === 'pending' || n.status === 'cancelled') && !n.archived_at);

  // Completed notes: only notes that are done and NOT archived
  const completedNotes = notes.filter(n => n.status === 'done' && !n.archived_at);
  
  // Archived notes: notes that are archived (only show if showArchived is true)
  const archivedNotes = showArchived ? notes.filter(n => n.archived_at) : [];

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
            {showArchived 
              ? `${notes.filter(n => !n.archived_at).length} active • ${archivedNotes.length} archived`
              : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`
            }
          </p>
        </div>
      </motion.div>

      {/* Notes List */}
      <div className="space-y-2">
        {openNotes.length === 0 ? (
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
          openNotes.map((item, index) => (
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
                viewDensity={viewDensity}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Completed Notes (collapsed by default) - placed at bottom */}
      {completedNotes.length > 0 && (
        <motion.div className="mt-6">
          <motion.button
            onClick={() => toggleSection('completed')}
            className="w-full flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl glass border border-white/10 dark:border-gray-700/50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-success to-success/70 shadow-lg">
              <Trophy size={20} className="text-white" />
            </div>

            <div className="flex-1 text-left">
              <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Completed</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{completedNotes.length} {completedNotes.length === 1 ? 'note' : 'notes'}</p>
            </div>

            <motion.div animate={{ rotate: collapsedSections.has('completed') ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={18} className="text-muted-foreground" />
            </motion.div>

            <div className="px-3 py-1.5 rounded-xl text-sm font-bold bg-success/10 text-success border border-success/20">
              {completedNotes.length}
            </div>
          </motion.button>

          <AnimatePresence>
            {!collapsedSections.has('completed') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 overflow-hidden"
              >
                {completedNotes.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ItemCard
                      item={item}
                      onToggleComplete={onToggleComplete}
                      onView={onEdit}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      viewDensity={viewDensity}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Archived Notes - only show when showArchived is true */}
      {showArchived && archivedNotes.length > 0 && (
        <motion.div className="mt-6">
          <motion.button
            onClick={() => toggleSection('archived')}
            className="w-full flex items-center gap-3 mb-3 px-4 py-3 rounded-2xl glass border border-white/10 dark:border-gray-700/50 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg">
              <Archive size={20} className="text-white" />
            </div>

            <div className="flex-1 text-left">
              <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Archived</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{archivedNotes.length} {archivedNotes.length === 1 ? 'note' : 'notes'}</p>
            </div>

            <motion.div animate={{ rotate: collapsedSections.has('archived') ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={18} className="text-muted-foreground" />
            </motion.div>

            <div className="px-3 py-1.5 rounded-xl text-sm font-bold bg-amber-600/10 text-amber-600 border border-amber-600/20">
              {archivedNotes.length}
            </div>
          </motion.button>

          <AnimatePresence>
            {!collapsedSections.has('archived') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 overflow-hidden"
              >
                {archivedNotes.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ItemCard
                      item={item}
                      onToggleComplete={onToggleComplete}
                      onView={onEdit}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      viewDensity={viewDensity}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
