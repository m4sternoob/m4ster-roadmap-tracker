/**
 * GET /api/auth/me — who is signed in, if anyone.
 * 200 { user } when the session cookie is valid, otherwise 401.
 */
import { getKv, getSessionUser } from './_shared';

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
