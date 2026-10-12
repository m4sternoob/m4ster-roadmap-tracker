/**
 * POST /api/auth/signup — create an account.
 * Body: { username, password }. Sets the mt_session cookie on success.
 * Returns 503 when no KV/Upstash database is attached.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
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

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const b64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
  return `pbkdf2$100000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

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
      username,
      pass: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    const created = await kv.set(`user:${uname}`, user, { nx: true });
    if (!created) return res.status(409).json({ error: 'username is taken' });
    await kv.set(`uid:${id}`, uname);

    const token = crypto.randomUUID();
    await kv.set(`sess:${token}`, { uid: id, createdAt: Date.now() }, { ex: SESSION_TTL_SECONDS });
    const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `mt_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`
    );
    return res.status(201).json({ user: { id, username } });
  } catch (e) {
    console.error('signup error', e);
    return res.status(500).json({ error: 'signup failed' });
  }
}
