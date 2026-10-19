/**
 * GET /api/wealth/sync — get synced wealth data for the Google user.
 * POST /api/wealth/sync — save wealth data (last-write-wins by updatedAt).
 *
 * Auth: Authorization: Bearer <Google ID token> issued for the m4ster-tracker
 * OAuth client (used by GIS on https://m4ster-wealth.pages.dev).
 * CORS: allows https://m4ster-wealth.pages.dev.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

const GOOGLE_CLIENT_ID =
  '423719961597-fhqtifuaaann7sd7migt3u3434q6coe0.apps.googleusercontent.com';
const ALLOW_ORIGIN = 'https://m4ster-wealth.pages.dev';

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

async function verifyIdToken(token: string): Promise<any | null> {
  try {
    const r = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token)
    );
    if (!r.ok) return null;
    const p: any = await r.json();
    if (p.aud !== GOOGLE_CLIENT_ID) return null;
    if (p.iss !== 'https://accounts.google.com' && p.iss !== 'accounts.google.com') return null;
    const exp = parseInt(p.exp, 10);
    if (!exp || exp * 1000 < Date.now()) return null;
    if (!p.sub) return null;
    return p;
  } catch {
    return null;
  }
}

function sanitizeHoldings(v: any): any[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 200)
    .map((h: any) => ({
      id: String(h?.id ?? '').slice(0, 32),
      name: String(h?.name ?? '').slice(0, 40),
      cat: String(h?.cat ?? 'Other').slice(0, 20),
      value: Math.max(0, Number(h?.value) || 0),
    }))
    .filter((h: any) => h.id && h.name);
}

function sanitizeLiabs(v: any): any[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 200)
    .map((l: any) => ({
      id: String(l?.id ?? '').slice(0, 32),
      name: String(l?.name ?? '').slice(0, 40),
      value: Math.max(0, Number(l?.value) || 0),
    }))
    .filter((l: any) => l.id && l.name);
}

function sanitizeHist(v: any): any[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(-365)
    .map((p: any) => ({
      d: String(p?.d ?? '').slice(0, 10),
      v: Math.max(0, Number(p?.v) || 0),
    }))
    .filter((p: any) => /^\d{4}-\d{2}-\d{2}$/.test(p.d));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const kv = await getKv();
  if (!kv) return res.status(500).json({ error: 'not-configured' });

  const auth = req.headers?.authorization;
  const token =
    typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  const claims = await verifyIdToken(token);
  if (!claims) return res.status(401).json({ error: 'bad-token' });

  const key = `wealth:${claims.sub}`;

  if (req.method === 'GET') {
    const data = await kv.get(key);
    return res.status(200).json({ data: data ?? null });
  }

  if (req.method === 'POST') {
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const data = {
      holdings: sanitizeHoldings(body?.holdings),
      liabs: sanitizeLiabs(body?.liabs),
      hist: sanitizeHist(body?.hist),
      updatedAt: Math.max(0, Number(body?.updatedAt) || Date.now()),
    };
    const existing: any = await kv.get(key);
    if (existing?.updatedAt && existing.updatedAt > data.updatedAt) {
      return res.status(200).json({ ok: true, data: existing, kept: 'server' });
    }
    await kv.set(key, data);
    return res.status(200).json({ ok: true, data, kept: 'client' });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'method-not-allowed' });
}
