/**
 * POST /api/auth/logout — destroy the current session.
 * Always succeeds (idempotent), even without a session cookie.
 */
import { getKv, parseCookies, clearSessionCookie } from './_shared';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  const kv = await getKv();
  if (!kv) return res.status(200).json({ ok: true });
  try {
    const token = parseCookies(req)['mt_session'];
    if (token) await kv.del(`sess:${token}`);
  } catch (e) {
    console.error('logout error', e);
  }
  return res.status(200).json({ ok: true });
}
