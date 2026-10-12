/**
 * POST /api/auth/login — sign in.
 * Body: { username, password }. Sets the mt_session cookie on success.
 * Returns 503 when no KV/Upstash database is attached.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

const SESSION_TTL_SECONDS = 30 * 24 * 3600;

let kvModule: any = null;
async function getKv() {
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const unb64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64'));
  const salt = unb64(parts[2]);
  const expected = unb64(parts[3]);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8
    )
  );
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
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
    const user = (await kv.get(`user:${username.toLowerCase()}`)) as {
      id: string;
      username: string;
      pass: string;
    } | null;
    const ok = user ? await verifyPassword(password, user.pass) : false;
    if (!user || !ok) {
      return res.status(401).json({ error: 'wrong username or password' });
    }
    const token = crypto.randomUUID();
    await kv.set(
      `sess:${token}`,
      { uid: user.id, createdAt: Date.now() },
      { ex: SESSION_TTL_SECONDS }
    );
    const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `mt_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`
    );
    return res.status(200).json({ user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'login failed' });
  }
}
