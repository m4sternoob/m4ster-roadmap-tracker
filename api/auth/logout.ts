/**
 * POST /api/auth/logout — destroy the current session.
 * Always succeeds (idempotent), even without a session cookie.
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `mt_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
  const kv = await getKv();
  if (!kv) return res.status(200).json({ ok: true });
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
    if (token) await kv.del(`sess:${token}`);
  } catch (e) {
    console.error('logout error', e);
  }
  return res.status(200).json({ ok: true });
}
