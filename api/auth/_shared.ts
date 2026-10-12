/**
 * Shared auth helpers for the API routes.
 *
 * NOTE: kept as a plain text block duplicated per route file on purpose —
 * every file under /api becomes a serverless function, so a shared module
 * under /api would risk being deployed as its own route. Copy this block
 * verbatim into each auth route.
 */

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
export const SESSION_TTL_SECONDS = 30 * 24 * 3600;

let kvModule: typeof import('@vercel/kv') | null = null;

export async function getKv() {
  // Vercel KV uses KV_REST_API_*; Upstash marketplace uses UPSTASH_REDIS_REST_*.
  // @vercel/kv reads both — just need one pair present.
  const hasKv =
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasKv) return null;
  if (!kvModule) kvModule = await import('@vercel/kv');
  return kvModule.kv;
}

function b64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function unb64(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64'));
}

/** PBKDF2-SHA256, 100k iterations. Format: pbkdf2$100000$<salt>$<hash> */
export async function hashPassword(password: string): Promise<string> {
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
  return `pbkdf2$100000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
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
  // Constant-time compare.
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

export interface SessionUser {
  id: string;
  username: string;
}

export function parseCookies(req: any): Record<string, string> {
  const header = req.headers?.cookie;
  const out: Record<string, string> = {};
  if (typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  return `mt_session=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  return `mt_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/** Look up the session cookie and return the user, or null. */
export async function getSessionUser(
  req: any,
  kv: NonNullable<Awaited<ReturnType<typeof getKv>>>
): Promise<SessionUser | null> {
  const token = parseCookies(req)['mt_session'];
  if (!token || token.length > 128) return null;
  const sess = (await kv.get<{ uid: string }>(`sess:${token}`)) ?? null;
  if (!sess) return null;
  const uname = (await kv.get<string>(`uid:${sess.uid}`)) ?? null;
  if (!uname) return null;
  const user = (await kv.get<{ id: string; username: string }>(`user:${uname}`)) ?? null;
  if (!user) return null;
  return { id: user.id, username: user.username };
}

/** Create a session for a user id and return the token. */
export async function createSession(
  kv: NonNullable<Awaited<ReturnType<typeof getKv>>>,
  uid: string
): Promise<string> {
  const token = crypto.randomUUID();
  await kv.set(`sess:${token}`, { uid, createdAt: Date.now() }, { ex: SESSION_TTL_SECONDS });
  return token;
}
