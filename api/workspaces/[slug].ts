/**
 * Workspace sync API — GET/PUT /api/workspaces/:slug
 *
 * Stores the whole workspace JSON in Vercel KV. Requires a KV database
 * attached to the project (Vercel dashboard → Storage → Create KV).
 * Without KV env vars, returns 503 and the app stays local-only.
 */

const SLUG_RE = /^[a-z0-9-_]{1,32}$/i;

// Lazy-load @vercel/kv so the function still boots without it.
let kvModule: typeof import('@vercel/kv') | null = null;
async function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

interface WorkspaceRecord {
  data: unknown;
  updatedAt: string;
  deviceId: string;
}

export default async function handler(req: any, res: any) {
  const slug = String(req.query.slug ?? '');
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'invalid workspace slug' });
  }

  const kv = await getKv();
  if (!kv) {
    return res.status(503).json({ error: 'sync not configured' });
  }

  const key = `workspace:${slug.toLowerCase()}`;

  try {
    if (req.method === 'GET') {
      const record = (await kv.get<WorkspaceRecord>(key)) ?? null;
      if (!record) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(record);
    }

    if (req.method === 'PUT') {
      const { data, updatedAt, deviceId } = req.body ?? {};
      if (!data || typeof updatedAt !== 'string') {
        return res.status(400).json({ error: 'data and updatedAt required' });
      }
      // Last-write-wins: reject stale writes so a lagging device
      // doesn't clobber newer changes.
      const existing = (await kv.get<WorkspaceRecord>(key)) ?? null;
      if (existing && existing.updatedAt > updatedAt) {
        return res.status(409).json(existing);
      }
      const record: WorkspaceRecord = {
        data,
        updatedAt,
        deviceId: typeof deviceId === 'string' ? deviceId : 'unknown',
      };
      await kv.set(key, record);
      return res.status(200).json({ ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end();
  } catch (e) {
    console.error('workspace sync error', e);
    return res.status(500).json({ error: 'sync failed' });
  }
}
