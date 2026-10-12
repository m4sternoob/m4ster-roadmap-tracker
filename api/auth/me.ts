/**
 * GET /api/auth/me — who is signed in, if anyone.
 * 200 { user } when the session cookie is valid, otherwise 401.
 *
 * Fully self-contained (no imports): Vercel's function bundler has
 * repeatedly failed to resolve shared-module imports for these routes.
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

function parseCookies(req: any): Record<string, string> {
  const header = req.headers?.cookie;
  const out: Record<string, string> = {};
  if (typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const kv = await getKv();
  if (!kv) return res.status(503).json({ error: 'auth not configured' });
  try {
    const token = parseCookies(req)['mt_session'];
    if (!token || token.length > 128) return res.status(401).json({ error: 'not signed in' });
    const sess = (await kv.get(`sess:${token}`)) as { uid: string } | null;
    if (!sess) return res.status(401).json({ error: 'not signed in' });
    const uname = (await kv.get(`uid:${sess.uid}`)) as string | null;
    if (!uname) return res.status(401).json({ error: 'not signed in' });
    const user = (await kv.get(`user:${uname}`)) as { id: string; username: string } | null;
    if (!user) return res.status(401).json({ error: 'not signed in' });
    return res.status(200).json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error('me error', e);
    return res.status(500).json({ error: 'failed' });
  }
}
