// Local storage management
import { Item } from "@/types";

const STORAGE_KEY = "home_manager_items";

export const storage = {
  getItems: (): Item[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveItems: (items: Item[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save items:", e);
    }
  },

  addItem: (item: Item): void => {
    const items = storage.getItems();
    items.push(item);
    storage.saveItems(items);
  },

  updateItem: (id: string, updates: Partial<Item>): void => {
    const items = storage.getItems();
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
      storage.saveItems(items);
    }
  },

  deleteItem: (id: string): void => {
    const items = storage.getItems();
    const filtered = items.filter((item) => item.id !== id);
    storage.saveItems(filtered);
  },
};
