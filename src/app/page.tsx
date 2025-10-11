"use client";

import { useState, useEffect } from "react";
import { Item, ItemWithDetails, ViewType, ParsedInput, ItemStatus } from "@/types";
import { AuthWrapper } from "@/components/AuthWrapper";
import { QuickAdd } from "@/components/QuickAdd";
import { TodayView } from "@/components/TodayView";
import { UpcomingView } from "@/components/UpcomingView";
import { CalendarView } from "@/components/CalendarView";
import { CategoriesView } from "@/components/CategoriesView";
import { BottomNav } from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { EditFormNew } from "@/components/EditFormNew";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getItems, 
  createItem, 
  updateItem, 
  deleteItem,
  upsertEventDetails,
  upsertReminderDetails,
  setItemCategories,
  createSubtask,
  getCategories,
  createCategory
} from "@/lib/database";

function HomeContent() {
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; color_hex?: string }[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("today");
  const [editingItem, setEditingItem] = useState<ItemWithDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from database
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories from database
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      
      // If no categories exist, create default ones
      if (!data || data.length === 0) {
        const defaultCategories = [
          { name: 'Personal', color_hex: '#8B5CF6', position: 0 },
          { name: 'Work', color_hex: '#3B82F6', position: 1 },
          { name: 'Family', color_hex: '#EC4899', position: 2 },
          { name: 'Home', color_hex: '#10B981', position: 3 },
          { name: 'Health', color_hex: '#F59E0B', position: 4 },
          { name: 'Finance', color_hex: '#EF4444', position: 5 }
        ];
        
        const created = [];
        for (const cat of defaultCategories) {
          try {
            const newCat = await createCategory(cat.name, cat.color_hex, cat.position);
            created.push(newCat);
          } catch (err) {
            console.error(`Failed to create category ${cat.name}:`, err);
          }
        }
        
        setCategories(created);
      } else {
        setCategories(data);
      }
    } catch (error: any) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const handleQuickAdd = async (parsed: ParsedInput) => {
    try {
      // Create the item
      const newItem = await createItem({
        type: parsed.type,
        title: parsed.title,
        priority: parsed.priority,
        is_public: false,
      });

      // Handle event or reminder specific details
      if (parsed.type === "event" && (parsed.startTime || parsed.time)) {
        await upsertEventDetails({
          item_id: newItem.id,
          start_at: (parsed.startTime || parsed.time || new Date()).toISOString(),
          end_at: parsed.endTime?.toISOString() || (parsed.startTime || parsed.time || new Date()).toISOString(),
          all_day: parsed.allDay || false,
        });
      } else if (parsed.type === "reminder" && parsed.time) {
        await upsertReminderDetails({
          item_id: newItem.id,
          due_at: parsed.time.toISOString(),
          has_checklist: false,
        });
      }

      // Set categories if any
      if (parsed.categories && parsed.categories.length > 0) {
        // You'll need to create categories first or fetch existing ones
        // For now, we'll skip this - you can implement category creation
      }

      // Reload items
      await loadItems();
      
      toast.success(
        <div className="flex items-center gap-2">
          <span className="font-semibold">{newItem.title}</span>
          <span className="text-sm text-muted-foreground">has been added</span>
        </div>
      );
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    }
  };

  const handleToggleComplete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const newStatus: ItemStatus = item.status === "done" ? "pending" : "done";
      await updateItem(id, { status: newStatus });
      
      // Update local state optimistically
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: newStatus } : i
        )
      );

      toast.success(
        <div className="flex items-center gap-2">
          <span className="font-semibold">{item.title}</span>
          <span className="text-sm text-muted-foreground">
            marked as {newStatus === "done" ? "complete" : "incomplete"}
          </span>
        </div>
      );
    } catch (error) {
      console.error("Error toggling completion:", error);
      toast.error("Failed to update item");
    }
  };

  const handleEdit = (item: ItemWithDetails) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      
      toast.error(
        <div className="flex items-center gap-2">
          <span className="font-semibold">{item.title}</span>
          <span className="text-sm text-muted-foreground">has been deleted</span>
        </div>
      );
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleSaveEdit = async (data: any) => {
    try {
      // Validate event-specific required fields
      if (data.type === "event") {
        if (!data.event_details?.start_at || !data.event_details?.end_at) {
          toast.error("Events require start and end dates");
          return;
        }
      }

      if (editingItem?.id) {
        // Update existing item
        await updateItem(editingItem.id, data);
        
        // Handle event details
        if (data.type === "event" && data.event_details) {
          await upsertEventDetails({ ...data.event_details, item_id: editingItem.id });
        }
        
        // Handle reminder details
        if (data.type === "reminder" && data.reminder_details) {
          await upsertReminderDetails({ 
            ...data.reminder_details, 
            item_id: editingItem.id,
            has_checklist: data.subtasks?.length > 0 || false
          });
        }
        
        toast.success("Item updated successfully!");
      } else {
        // Create new item
        const newItem = await createItem(data);
        
        // Handle event details
        if (data.type === "event" && data.event_details) {
          await upsertEventDetails({ ...data.event_details, item_id: newItem.id });
        }
        
        // Handle reminder details
        if (data.type === "reminder" && data.reminder_details) {
          await upsertReminderDetails({ 
            ...data.reminder_details, 
            item_id: newItem.id,
            has_checklist: data.subtasks?.length > 0 || false
          });
        }
        
        // Handle subtasks
        if (data.subtasks && data.subtasks.length > 0) {
          for (const subtask of data.subtasks) {
            await createSubtask({ ...subtask, parent_item_id: newItem.id });
          }
        }
        
        // Handle categories
        if (data.categories && data.categories.length > 0) {
          await setItemCategories(newItem.id, data.categories);
        }
        
        toast.success("Item created successfully!");
      }
      
      // Reload items after save
      await loadItems();
      setIsDrawerOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast.error(error.message || "Failed to save item");
    }
  };

  const handleCancelEdit = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  const handleFABClick = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
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
            <DrawerTitle className="text-xl font-bold mb-4">
              {editingItem?.id ? "Edit Item" : "Create Item"}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {editingItem?.id ? "Edit an existing item" : "Create a new reminder or event"}
            </DrawerDescription>
            <EditFormNew
              item={editingItem}
              categories={categories}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </div>
        </DrawerContent>
      </div>
    </Drawer>
  );
}

export default function Home() {
  return (
    <AuthWrapper>
      {() => <HomeContent />}
    </AuthWrapper>
  );
}
