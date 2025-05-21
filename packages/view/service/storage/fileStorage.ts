import fs from "node:fs/promises";
import path from "node:path";
import type { ViewSchema } from "@repo/view-engine/renderers/types";
import type { ViewStorageProvider } from "./types";

/**
 * FileStorage implementation of ViewStorageProvider
 * Uses the file system for persistence
 */
export class FileStorageProvider implements ViewStorageProvider {
  private readonly storagePath: string;

  /**
   * Create a new FileStorageProvider
   * @param storagePath Directory path where view schemas will be stored
   */
  constructor(storagePath: string) {
    this.storagePath = storagePath;
  }

  /**
   * Get the full file path for a view ID
   * @param id View ID
   * @returns Full file path
   */
  private getFilePath(id: string): string {
    return path.join(this.storagePath, `${id}.json`);
  }

  /**
   * Ensure the storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error("Error creating storage directory:", error);
      throw new Error(`Failed to create storage directory: ${this.storagePath}`);
    }
  }

  /**
   * Save a view schema to the file system
   * @param id Unique identifier for the view
   * @param view The view schema to save
   */
  async saveView(id: string, view: ViewSchema): Promise<void> {
    await this.ensureStorageDirectory();
    
    const filePath = this.getFilePath(id);
    const data = JSON.stringify(view, null, 2);
    
    try {
      await fs.writeFile(filePath, data, "utf8");
    } catch (error) {
      console.error(`Error saving view ${id}:`, error);
      throw new Error(`Failed to save view: ${id}`);
    }
  }

  /**
   * Get a view schema from the file system
   * @param id Unique identifier for the view
   * @returns The view schema or undefined if not found
   */
  async getView(id: string): Promise<ViewSchema | undefined> {
    const filePath = this.getFilePath(id);
    
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data) as ViewSchema;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      
      console.error(`Error reading view ${id}:`, error);
      throw new Error(`Failed to read view: ${id}`);
    }
  }

  /**
   * List all view IDs in the storage directory
   * @returns Array of view IDs
   */
  async listViews(): Promise<string[]> {
    try {
      await this.ensureStorageDirectory();
      
      const files = await fs.readdir(this.storagePath);
      
      return files
        .filter(file => file.endsWith(".json"))
        .map(file => file.slice(0, -5)); // Remove .json extension
    } catch (error) {
      console.error("Error listing views:", error);
      throw new Error("Failed to list views");
    }
  }

  /**
   * Delete a view from the file system
   * @param id Unique identifier for the view to delete
   */
  async deleteView(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`Error deleting view ${id}:`, error);
        throw new Error(`Failed to delete view: ${id}`);
      }
    }
  }
}
