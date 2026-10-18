/**
 * POST /api/auth/desktop/exchange — trade a desktop one-time code for a session.
 * Body: { code: string }. Returns: { sessionToken, uid } or 400.
 * The OTC is single-use and expires in 5 minutes.
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
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  const kv = await getKv();
  if (!kv) return res.status(500).json({ error: 'not-configured' });

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const code = body?.code;
  if (typeof code !== 'string' || !code) {
    return res.status(400).json({ error: 'missing-code' });
  }

  // Single-use: get then delete.
  const data = await kv.get(`desktop_otc:${code}`);
  if (!data) return res.status(400).json({ error: 'invalid-or-expired' });
  await kv.del(`desktop_otc:${code}`);

  const { uid, sessionToken } = data as { uid: string; sessionToken: string };
  if (!uid || !sessionToken) return res.status(400).json({ error: 'invalid' });

  return res.status(200).json({ sessionToken, uid });
}
