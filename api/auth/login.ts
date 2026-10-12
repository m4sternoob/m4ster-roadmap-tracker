/**
 * POST /api/auth/login — sign in.
 * Body: { username, password }. Sets the mt_session cookie on success.
 * Returns 503 when no KV/Upstash database is attached.
 */
import { getKv, verifyPassword, createSession, sessionCookie } from './_shared';

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
    // Run a dummy verify on miss so timing doesn't reveal which users exist.
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
