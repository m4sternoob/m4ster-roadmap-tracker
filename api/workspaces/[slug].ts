/**
 * Workspace sync API — GET/PUT /api/workspaces/:slug
 *
 * Stores the whole workspace JSON in Vercel KV, scoped per signed-in user.
 * Requires a KV database attached to the project
 * (Vercel dashboard → Storage → Create KV).
 * Without KV env vars, returns 503 and the app stays local-only.
 * Without a session cookie, returns 401 — sign in to sync.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

const SLUG_RE = /^[a-z0-9-_]{1,32}$/i;

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
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

  // Session lookup (inlined).
  let user: { id: string; username: string } | null = null;
  try {
    const header = req.headers?.cookie;
    let token: string | null = null;
    if (typeof header === 'string') {
      for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx > 0 && part.slice(0, idx).trim() === 'mt_session') {
          token = decodeURIComponent(part.slice(idx + 1).trim());
        }
      }
    }
    if (token && token.length <= 128) {
      const sess = (await kv.get(`sess:${token}`)) as { uid: string } | null;
      const uname = sess ? ((await kv.get(`uid:${sess.uid}`)) as string | null) : null;
      const record = uname
        ? ((await kv.get(`user:${uname}`)) as { id: string; username: string } | null)
        : null;
      if (record) user = { id: record.id, username: record.username };
    }
  } catch (e) {
    console.error('session lookup error', e);
  }
  if (!user) {
    return res.status(401).json({ error: 'sign in required' });
  }

  // Per-user namespace — one account, same boards on every device.
  // Exception: if this board is shared (see api/collab) and the user is
  // a member, everyone syncs against one shared record instead.
  let key = `u:${user.id}:ws:${slug.toLowerCase()}`;
  try {
    const share = (await kv.get(`share:${slug.toLowerCase()}`)) as { ownerId: string } | null;
    if (share) {
      const members = (await kv.get(`share:${slug.toLowerCase()}:members`)) as string[] | null;
      if (Array.isArray(members) && members.includes(user.id)) {
        key = `shared:${slug.toLowerCase()}:data`;
      }
    }
  } catch (e) {
    console.error('share lookup error', e);
  }

  try {
    if (req.method === 'GET') {
      const record = await kv.get(key);
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
      const existing = (await kv.get(key)) as { updatedAt: string } | null;
      if (existing && existing.updatedAt > updatedAt) {
        return res.status(409).json(existing);
      }
      const record = {
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
