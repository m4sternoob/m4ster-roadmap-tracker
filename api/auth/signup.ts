/**
 * POST /api/auth/signup — create an account.
 * Body: { username, password }. Sets the mt_session cookie on success.
 * Returns 503 when no KV/Upstash database is attached.
 */
import { USERNAME_RE, getKv, hashPassword, createSession, sessionCookie } from './_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const kv = await getKv();
  if (!kv) return res.status(503).json({ error: 'auth not configured' });

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'username must be 3-20 letters, numbers, _ or -' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'password must be 8-128 characters' });
  }

  try {
    const uname = username.toLowerCase();
    const id = crypto.randomUUID();
    const user = {
      id,
      username, // preserve the casing they typed
      pass: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    // Atomic create — NX fails if the username key already exists.
    const created = await kv.set(`user:${uname}`, user, { nx: true });
    if (!created) return res.status(409).json({ error: 'username is taken' });
    await kv.set(`uid:${id}`, uname);

    const token = await createSession(kv, id);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(201).json({ user: { id, username } });
  } catch (e) {
    console.error('signup error', e);
    return res.status(500).json({ error: 'signup failed' });
  }
}
