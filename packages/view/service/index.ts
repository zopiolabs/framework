import type { ViewSchema } from "../engine/renderers/types";
import { createStorageProvider, type ViewStorageProvider } from "./storage";

// Default storage provider instance
let storageProvider: ViewStorageProvider;

/**
 * Initialize the view service with a storage provider
 * @param provider Custom storage provider or options for the default provider
 */
export function initViewService(provider?: ViewStorageProvider | {
  type?: "local" | "file";
  storagePath?: string;
  storagePrefix?: string;
}): void {
  if (!provider) {
    storageProvider = createStorageProvider();
  } else if ('saveView' in provider && 'getView' in provider) {
    storageProvider = provider;
  } else {
    storageProvider = createStorageProvider(provider);
  }
}

// Initialize with default provider if not already initialized
function ensureInitialized(): ViewStorageProvider {
  if (!storageProvider) {
    storageProvider = createStorageProvider();
  }
  return storageProvider;
}

/**
 * Save a view schema to storage
 * @param id Unique identifier for the view
 * @param view The view schema to save
 * @returns Promise that resolves when the view is saved
 */
export async function saveView(id: string, view: ViewSchema): Promise<void> {
  const provider = ensureInitialized();
  return provider.saveView(id, view);
}

/**
 * Get a view schema from storage
 * @param id Unique identifier for the view
 * @returns Promise that resolves with the view schema or undefined if not found
 */
export async function getView(id: string): Promise<ViewSchema | undefined> {
  const provider = ensureInitialized();
  return provider.getView(id);
}

/**
 * List all view IDs in storage
 * @returns Promise that resolves with an array of view IDs
 */
export async function listViews(): Promise<string[]> {
  const provider = ensureInitialized();
  return provider.listViews();
}

/**
 * Delete a view from storage
 * @param id Unique identifier for the view to delete
 * @returns Promise that resolves when the view is deleted
 */
export async function deleteView(id: string): Promise<void> {
  const provider = ensureInitialized();
  return provider.deleteView(id);
}
