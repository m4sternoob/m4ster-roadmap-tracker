/**
 * Pure auth helpers shared by the API routes and unit tests.
 *
 * Lives under src/ (not api/) on purpose: Vercel ignores `_`-prefixed
 * files under /api at bundle time, so a shared module there crashes
 * serverless functions at runtime. A normal relative import from src/
 * is traced into the bundle like any other dependency.
 */

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;
export const SESSION_TTL_SECONDS = 30 * 24 * 3600;

export interface SessionUser {
  id: string;
  username: string;
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
