"use client";

import { useState, useEffect } from "react";
import { Item, ViewType, ParsedInput } from "@/types";
import { storage } from "@/lib/storage";
import { generateNextInstance } from "@/lib/recurrence";
import { seedItems } from "@/lib/seedData";
import { QuickAdd } from "@/components/QuickAdd";
import { TodayView } from "@/components/TodayView";
import { UpcomingView } from "@/components/UpcomingView";
import { CalendarView } from "@/components/CalendarView";
import { CategoriesView } from "@/components/CategoriesView";
import { BottomNav } from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { EditForm } from "@/components/EditForm";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("today");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load items from storage on mount
  useEffect(() => {
    const loadedItems = storage.getItems();
    
    // If no items, seed with demo data
    if (loadedItems.length === 0) {
      storage.saveItems(seedItems);
      setItems(seedItems);
    } else {
      setItems(loadedItems);
    }
    
    setIsInitialized(true);
  }, []);

  // Save items to storage whenever they change
  useEffect(() => {
    if (isInitialized) {
      storage.saveItems(items);
    }
  }, [items, isInitialized]);

  const handleQuickAdd = (parsed: ParsedInput) => {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: crypto.randomUUID(),
      type: parsed.type,
      title: parsed.title,
      categories: parsed.categories,
      priority: parsed.priority,
      completed: false,
      created_at: now,
      updated_at: now,
    };

    if (parsed.type === "event") {
      newItem.start_at = parsed.startTime?.toISOString() || parsed.time?.toISOString();
      newItem.end_at = parsed.endTime?.toISOString();
      newItem.all_day = parsed.allDay;
    } else {
      newItem.due_at = parsed.time?.toISOString() || null;
    }

    if (parsed.recurrence) {
      newItem.recurrence = parsed.recurrence;
    }

    // Optimistic UI update with animation
    setItems((prev) => [...prev, newItem]);
    toast.success(
      <div className="flex items-center gap-2">
        <span className="font-semibold">{newItem.title}</span>
        <span className="text-sm text-muted-foreground">has been added</span>
      </div>
    );
  };

  const handleToggleComplete = (id: string) => {
    let itemTitle = "";
    let isCompleted = false;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          itemTitle = item.title;
          isCompleted = !item.completed;
          const updated = { ...item, completed: isCompleted };
          
          // If completing a recurring item, generate next instance
          if (updated.completed && item.recurrence && item.recurrence.preset !== "none") {
            const nextInstance = generateNextInstance(item);
            if (nextInstance) {
              // Add next instance
              setTimeout(() => {
                setItems((current) => [...current, nextInstance]);
                toast.info(
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Next instance for</span>
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-sm">created</span>
                  </div>
                );
              }, 300);
            }
          }
          
          return updated;
        }
        return item;
      })
    );

    if (itemTitle) {
      toast.success(
        <div className="flex items-center gap-2">
          <span className="font-semibold">{itemTitle}</span>
          <span className="text-sm text-muted-foreground">
            marked as {isCompleted ? 'complete' : 'incomplete'}
          </span>
        </div>
      );
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    let itemTitle = "";
    setItems((prev) => prev.filter((item) => {
      if (item.id === id) {
        itemTitle = item.title;
        return false;
      }
      return true;
    }));
    
    if (itemTitle) {
      toast.error(
        <div className="flex items-center gap-2">
          <span className="font-semibold">{itemTitle}</span>
          <span className="text-sm text-muted-foreground">has been deleted</span>
        </div>
      );
    }
  };

  const handleSaveEdit = (item: Item) => {
    const isNew = !editingItem;
    if (isNew) {
      // Create new
      setItems((prev) => [...prev, item]);
    } else {
      // Update existing
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    }
    
    setIsDrawerOpen(false);
    setEditingItem(null);
    
    toast.success(
      <div className="flex items-center gap-2">
        <span className="font-semibold">{item.title}</span>
        <span className="text-sm text-muted-foreground">
          has been {isNew ? 'created' : 'updated'}
        </span>
      </div>
    );
  };

  const handleCancelEdit = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  const handleFABClick = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent"
          />
          <p className="text-muted-foreground text-lg font-medium">Loading your tasks...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      onClose={handleCancelEdit}
    >
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.1),transparent_50%)] pointer-events-none" />

        <QuickAdd onAdd={handleQuickAdd} />

        <main className="relative max-w-2xl mx-auto px-4 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === "today" && (
                <TodayView
                  items={items}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {currentView === "upcoming" && (
                <UpcomingView
                  items={items}
                  days={30}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {currentView === "calendar" && (
                <CalendarView
                  items={items}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              {currentView === "categories" && (
                <CategoriesView
                  items={items}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        <FAB onClick={handleFABClick} />

        <DrawerContent>
          <div className="px-4 pb-8">
            <EditForm
              item={editingItem}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </div>
        </DrawerContent>
      </div>
    </Drawer>
  );
}
