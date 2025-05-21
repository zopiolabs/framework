import type { ViewSchema } from "@repo/view-engine/renderers/types";
import type { ViewStorageProvider } from "./types";

/**
 * LocalStorage implementation of ViewStorageProvider
 * Uses browser's localStorage for persistence
 */
export class LocalStorageProvider implements ViewStorageProvider {
  private readonly storagePrefix: string;

  /**
   * Create a new LocalStorageProvider
   * @param storagePrefix Prefix for localStorage keys to avoid conflicts
   */
  constructor(storagePrefix = "zopio_view_") {
    this.storagePrefix = storagePrefix;
  }

  /**
   * Get the full storage key for a view ID
   * @param id View ID
   * @returns Full storage key
   */
  private getStorageKey(id: string): string {
    return `${this.storagePrefix}${id}`;
  }

  /**
   * Save a view schema to localStorage
   * @param id Unique identifier for the view
   * @param view The view schema to save
   */
  async saveView(id: string, view: ViewSchema): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageProvider can only be used in browser environments");
    }
    
    const key = this.getStorageKey(id);
    localStorage.setItem(key, JSON.stringify(view));
  }

  /**
   * Get a view schema from localStorage
   * @param id Unique identifier for the view
   * @returns The view schema or undefined if not found
   */
  async getView(id: string): Promise<ViewSchema | undefined> {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageProvider can only be used in browser environments");
    }
    
    const key = this.getStorageKey(id);
    const data = localStorage.getItem(key);
    
    if (!data) {
      return undefined;
    }
    
    try {
      return JSON.parse(data) as ViewSchema;
    } catch (error) {
      console.error(`Error parsing view data for ${id}:`, error);
      return undefined;
    }
  }

  /**
   * List all view IDs in localStorage
   * @returns Array of view IDs
   */
  async listViews(): Promise<string[]> {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageProvider can only be used in browser environments");
    }
    
    const views: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith(this.storagePrefix)) {
        views.push(key.substring(this.storagePrefix.length));
      }
    }
    
    return views;
  }

  /**
   * Delete a view from localStorage
   * @param id Unique identifier for the view to delete
   */
  async deleteView(id: string): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageProvider can only be used in browser environments");
    }
    
    const key = this.getStorageKey(id);
    localStorage.removeItem(key);
  }
}
