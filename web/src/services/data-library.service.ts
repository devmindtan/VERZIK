/**
 * Data Library Service - Template (API connections removed)
 */

export interface DataLibraryCollection {
  id: string;
  source: "internal" | "external";
  title: string;
  description: string | null;
  data_type: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  entry_count: number;
  last_snapshot_date: string | null;
}

export interface SnapshotEntry {
  id: string;
  collection_id: string;
  snapshot_date: string;
  minio_keys: Record<string, string>;
  file_sizes: Record<string, number> | null;
  record_count: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface CollectionDetail extends DataLibraryCollection {
  entries: SnapshotEntry[];
}

export interface CollectionsResponse {
  success: boolean;
  data: DataLibraryCollection[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Mock get collections
 */
export async function getCollections(params?: {
  source?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<CollectionsResponse> {
  // TODO: Connect to your API
  console.log("Get collections:", params);
  return { success: true, data: [], total: 0, page: 1, limit: 10 };
}

/**
 * Mock get collection by ID
 */
export async function getCollectionById(id: string): Promise<CollectionDetail> {
  // TODO: Connect to your API
  console.log("Get collection:", id);
  throw new Error("Collection not found");
}

/**
 * Mock create collection
 */
export async function createCollection(payload: {
  title: string;
  data_type: string;
  description?: string;
  tags?: string[];
}): Promise<DataLibraryCollection> {
  // TODO: Connect to your API
  console.log("Create collection:", payload);
  throw new Error("Not implemented");
}

/**
 * Mock update collection
 */
export async function updateCollection(
  id: string,
  payload: { title?: string; description?: string | null; data_type?: string },
): Promise<DataLibraryCollection> {
  // TODO: Connect to your API
  console.log("Update collection:", id, payload);
  throw new Error("Not implemented");
}

/**
 * Mock delete collection
 */
export async function deleteCollection(id: string): Promise<void> {
  // TODO: Connect to your API
  console.log("Delete collection:", id);
}

/**
 * Mock import entry
 */
export async function importEntry(payload: {
  collection_id: string;
  snapshot_date: string;
  file: File;
  new_title?: string;
  data_type?: string;
  description?: string;
}): Promise<SnapshotEntry> {
  // TODO: Connect to your API
  console.log("Import entry:", payload);
  throw new Error("Not implemented");
}

/**
 * Mock delete entry
 */
export async function deleteEntry(id: string): Promise<void> {
  // TODO: Connect to your API
  console.log("Delete entry:", id);
}

/**
 * Mock download entry file
 */
export async function downloadEntryFile(
  entryId: string,
  fileKey: string,
  filename: string,
): Promise<void> {
  // TODO: Connect to your API
  console.log("Download file:", entryId, fileKey, filename);
}
