import { openDB } from 'idb';

/**
 * Raw attachment bytes live in this browser's IndexedDB — they never travel
 * with the workspace JSON (cloud sync only carries the metadata on the issue).
 * A server-side blob store (Vercel Blob) is the natural next step for
 * cross-device files; this module keeps the read/write surface identical so the
 * swap only touches these helpers.
 */

const DB_NAME = 'm4ster-tracker-files';
const STORE_NAME = 'attachments';

/** Per-file upload cap: generous for screenshots/docs, light on storage. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

async function filesDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

/** Persist raw file bytes under the attachment id. */
export async function saveAttachmentBlob(id: string, blob: Blob): Promise<void> {
  const db = await filesDb();
  await db.put(STORE_NAME, blob, id);
}

/** Read raw bytes back. `undefined` when they were never saved (or were cleaned). */
export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  const db = await filesDb();
  return db.get(STORE_NAME, id);
}

/** Drop one attachment's bytes. Best-effort — missing keys are fine. */
export async function removeAttachmentBlob(id: string): Promise<void> {
  const db = await filesDb();
  await db.delete(STORE_NAME, id);
}

/** Image types we can thumbnail inline in the UI. */
export function isPreviewableImage(type: string): boolean {
  return type.startsWith('image/');
}

/** Human size: "512 B", "1.5 KB", "12 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${Math.round(value * 10) / 10} ${units[unit]}`;
}
