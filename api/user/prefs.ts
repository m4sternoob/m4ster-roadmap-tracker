/**
 * GET /api/user/prefs — get user preferences (theme, iconPack, aura).
 * POST /api/user/prefs — save user preferences.
 * Requires valid session (mt_session cookie). Prefs are stored per-user in KV.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

function getCookie(req: any, name: string): string | null {
  const header = req.headers?.cookie;
  if (typeof header !== 'string') return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

async function getUidFromSession(kv: any, req: any): Promise<string | null> {
  const token = getCookie(req, 'mt_session');
  if (!token) return null;
  const sess = await kv.get(`sess:${token}`);
  return (sess as any)?.uid ?? null;
}

export default async function handler(req: any, res: any) {
  const kv = await getKv();
  if (!kv) return res.status(500).json({ error: 'not-configured' });

  const uid = await getUidFromSession(kv, req);
  if (!uid) return res.status(401).json({ error: 'unauthorized' });

  const key = `prefs:${uid}`;

  if (req.method === 'GET') {
    const prefs = await kv.get(key);
    return res.status(200).json({ prefs: prefs ?? {} });
  }

  if (req.method === 'POST') {
    let body: any = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    // Only allow known pref keys.
    const allowed = ['theme', 'iconPack', 'aura'];
    const prefs: Record<string, any> = {};
    for (const k of allowed) {
      if (body?.[k] !== undefined) prefs[k] = body[k];
    }
    // Merge with existing (don't wipe unset keys).
    const existing = (await kv.get(key)) as Record<string, any> ?? {};
    const merged = { ...existing, ...prefs };
    await kv.set(key, merged);
    return res.status(200).json({ ok: true, prefs: merged });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method-not-allowed' });
}
