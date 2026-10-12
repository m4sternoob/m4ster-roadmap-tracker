/**
 * Thin client for the workspace sync API.
 * All failures are swallowed into typed results — the app must
 * keep working offline / without a configured backend.
 */

export interface CloudRecord {
  data: unknown;
  updatedAt: string;
  deviceId: string;
}

export type CloudResult<T> =
  | { ok: true; record: T }
  | {
      ok: false;
      reason: 'not-found' | 'not-configured' | 'unauthorized' | 'conflict' | 'network' | 'stale';
      record?: CloudRecord;
    };

const slugPath = (slug: string) => `/api/workspaces/${encodeURIComponent(slug)}`;

export async function cloudPull(slug: string): Promise<CloudResult<CloudRecord>> {
  try {
    const res = await fetch(slugPath(slug), { method: 'GET' });
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (res.status === 503) return { ok: false, reason: 'not-configured' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const record = (await res.json()) as CloudRecord;
    return { ok: true, record };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function cloudPush(
  slug: string,
  record: CloudRecord
): Promise<CloudResult<{ updatedAt: string }>> {
  try {
    const res = await fetch(slugPath(slug), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (res.status === 503) return { ok: false, reason: 'not-configured' };
    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (res.status === 409) {
      const record = (await res.json()) as CloudRecord;
      return { ok: false, reason: 'conflict', record };
    }
    if (!res.ok) return { ok: false, reason: 'network' };
    const body = (await res.json()) as { updatedAt: string };
    return { ok: true, record: body };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
