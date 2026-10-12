/**
 * POST /api/auth/login — sign in.
 * Body: { username, password }. Sets the mt_session cookie on success.
 * Returns 503 when no KV/Upstash database is attached.
 */
import { SESSION_TTL_SECONDS, verifyPassword, sessionCookie } from '../../src/sync/authShared';

let kvModule: typeof import('@vercel/kv') | null = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

async function createSession(kv: NonNullable<Awaited<ReturnType<typeof getKv>>>, uid: string) {
  const token = crypto.randomUUID();
  await kv.set(`sess:${token}`, { uid, createdAt: Date.now() }, { ex: SESSION_TTL_SECONDS });
  return token;
}

interface StoredUser {
  id: string;
  username: string;
  pass: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const kv = await getKv();
  if (!kv) return res.status(503).json({ error: 'auth not configured' });

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password required' });
  }

  try {
    const user = (await kv.get<StoredUser>(`user:${username.toLowerCase()}`)) ?? null;
    const ok = user ? await verifyPassword(password, user.pass) : false;
    if (!user || !ok) {
      return res.status(401).json({ error: 'wrong username or password' });
    }
    const token = await createSession(kv, user.id);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
}
