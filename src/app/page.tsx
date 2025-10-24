"use client";

import { useState, useEffect, useMemo } from "react";
import { ItemWithDetails, ViewType, ParsedInput, ItemStatus } from "@/types";
import { AuthWrapper } from "@/components/AuthWrapper";
import { QuickAdd } from "@/components/QuickAdd";
import { TodayView } from "@/components/TodayView";
import { UpcomingView } from "@/components/UpcomingView";
import { CalendarViewNew } from "@/components/CalendarViewNew";
import { NotesView } from "@/components/NotesView";
import { BottomNav } from "@/components/BottomNav";
import { FAB } from "@/components/FAB";
import { EditFormNew } from "@/components/EditFormNew";
import { ViewDetails } from "@/components/ViewDetails";
import { SettingsSidebar, ViewDensity } from "@/components/SettingsSidebar";
import { Drawer } from "@/components/ui/drawer";
import { toast } from "sonner";
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
import { saveAlarms } from "@/lib/alertManager";
import { enhanceCategoriesWithKeywords } from "@/config/categoryKeywords";

function HomeContent() {
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; color_hex?: string }[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("today");
  const [editingItem, setEditingItem] = useState<ItemWithDetails | null>(null);
  const [viewingItem, setViewingItem] = useState<ItemWithDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [viewDensity, setViewDensity] = useState<ViewDensity>("comfy");
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
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
    
    // Load view density from localStorage
    const savedDensity = localStorage.getItem("viewDensity") as ViewDensity | null;
    if (savedDensity === "compact" || savedDensity === "comfy") {
      setViewDensity(savedDensity);
    }
  }, []);

  // Enhance categories with keywords for smart parsing
  const enhancedCategories = useMemo(() => {
    return enhanceCategoriesWithKeywords(categories);
  }, [categories]);

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

  const handleView = (item: ItemWithDetails) => {
    setViewingItem(item);
    setIsViewDetailsOpen(true);
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

  const handleSaveEdit = async (data: Partial<ItemWithDetails> & { 
    categories?: string[]; 
    subtasks?: Array<{ title: string; order_index: number }>;
    event_details?: Record<string, unknown>;
    reminder_details?: Record<string, unknown>;
    alarms?: Array<{ type: 'relative' | 'absolute'; offset_minutes?: number; absolute_time?: string; channel: 'push' | 'email' | 'sms' }>;
    eventStartTime?: Date;
  }) => {
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
          
          // Handle alarms for events
          if (data.alarms && data.eventStartTime) {
            await saveAlarms(editingItem.id, data.eventStartTime, data.alarms);
          }
        }
        
        // Handle reminder details
        if (data.type === "reminder" && data.reminder_details) {
          await upsertReminderDetails({ 
            ...data.reminder_details, 
            item_id: editingItem.id,
            has_checklist: (data.subtasks?.length ?? 0) > 0
          });
        }
        
        // Handle categories for update
        if (data.categories && data.categories.length > 0) {
          await setItemCategories(editingItem.id, data.categories);
        }
        
        toast.success("Item updated successfully!");
      } else {
        // Create new item
        const newItem = await createItem(data);
        
        // Handle event details
        if (data.type === "event" && data.event_details) {
          await upsertEventDetails({ ...data.event_details, item_id: newItem.id });
          
          // Handle alarms for events
          if (data.alarms && data.eventStartTime) {
            await saveAlarms(newItem.id, data.eventStartTime, data.alarms);
          }
        }
        
        // Handle reminder details
        if (data.type === "reminder" && data.reminder_details) {
          await upsertReminderDetails({ 
            ...data.reminder_details, 
            item_id: newItem.id,
            has_checklist: (data.subtasks?.length ?? 0) > 0
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
    } catch (error) {
      console.error("Error saving item:", error);
      // Log detailed error information
      if (error && typeof error === 'object') {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }
      const errorMessage = error instanceof Error ? error.message : 
                          (error && typeof error === 'object' && 'message' in error) ? 
                          String(error.message) : 
                          "Failed to save item";
      toast.error(errorMessage);
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

        <QuickAdd 
          onAdd={handleQuickAdd} 
          categories={enhancedCategories}
          onOpenSettings={() => setIsSettingsSidebarOpen(true)}
        />

        <SettingsSidebar
          isOpen={isSettingsSidebarOpen}
          onClose={() => setIsSettingsSidebarOpen(false)}
          viewDensity={viewDensity}
          onViewDensityChange={(density) => {
            setViewDensity(density);
            localStorage.setItem("viewDensity", density);
            toast.success(`View changed to ${density === "compact" ? "Compact" : "Comfy"}`);
          }}
        />

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
                  onEdit={handleView}
                  onDelete={handleDelete}
                  viewDensity={viewDensity}
                />
              )}

              {currentView === "upcoming" && (
                <UpcomingView
                  items={items}
                  days={30}
                  onToggleComplete={handleToggleComplete}
                  onView={handleView}
                  onEdit={handleView}
                  onDelete={handleDelete}
                  viewDensity={viewDensity}
                />
              )}

              {currentView === "notes" && (
                <NotesView
                  items={items}
                  onToggleComplete={handleToggleComplete}
                  onView={handleView}
                  onEdit={handleView}
                  onDelete={handleDelete}
                  viewDensity={viewDensity}
                />
              )}

              {currentView === "calendar" && (
                <CalendarViewNew
                  items={items}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleView}
                  onDelete={handleDelete}
                  categories={categories}
                  viewDensity={viewDensity}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        {!isDrawerOpen && <FAB onClick={handleFABClick} />}

        {/* View Details Drawer */}
        <ViewDetails
          item={viewingItem}
          isOpen={isViewDetailsOpen}
          onClose={() => {
            setIsViewDetailsOpen(false);
            setViewingItem(null);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
        />

        {/* Edit Form Modal */}
        <AnimatePresence>
          {isDrawerOpen && (
            <EditFormNew
              item={editingItem}
              categories={categories}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}
        </AnimatePresence>
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
