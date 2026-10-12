/**
 * GET /api/auth/me — who is signed in, if anyone.
 * 200 { user } when the session cookie is valid, otherwise 401.
 */
import { parseCookies, type SessionUser } from '../../src/sync/authShared';

let kvModule: typeof import('@vercel/kv') | null = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

async function getSessionUser(
  req: any,
  kv: NonNullable<Awaited<ReturnType<typeof getKv>>>
): Promise<SessionUser | null> {
  const token = parseCookies(req)['mt_session'];
  if (!token || token.length > 128) return null;
  const sess = (await kv.get<{ uid: string }>(`sess:${token}`)) ?? null;
  if (!sess) return null;
  const uname = (await kv.get<string>(`uid:${sess.uid}`)) ?? null;
  if (!uname) return null;
  const user = (await kv.get<{ id: string; username: string }>(`user:${uname}`)) ?? null;
  if (!user) return null;
  return { id: user.id, username: user.username };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const kv = await getKv();
  if (!kv) return res.status(503).json({ error: 'auth not configured' });
  try {
    const user = await getSessionUser(req, kv);
    if (!user) return res.status(401).json({ error: 'not signed in' });
    return res.status(200).json({ user });
  } catch (e) {
    console.error('me error', e);
    return res.status(500).json({ error: 'failed' });
  }
}
