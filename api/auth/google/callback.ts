/**
 * GET /api/auth/google/callback — Google OAuth callback.
 * Verifies state, exchanges the code, finds-or-creates the user,
 * sets the session cookie, and redirects home.
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

function getCookie(req: any, name: string): string | null {
  const header = req.headers?.cookie;
  if (typeof header !== 'string') return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function fail(res: any, reason: string) {
  res.writeHead(302, { Location: `/?auth=${reason}` });
  return res.end();
}

/** Turn "Jane.Doe+spam@gmail.com" into a valid, unique username. */
async function uniqueUsername(kv: any, email: string): Promise<string> {
  let base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  if (base.length < 3) base = `user-${base}`;
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 17)}-${i + 1}`;
    const exists = await kv.get(`user:${candidate}`);
    if (!exists) return candidate;
  }
  return `${base.slice(0, 13)}-${crypto.randomUUID().slice(0, 6)}`;
}

export default async function handler(req: any, res: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(res, 'not-configured');

  const kv = await getKv();
  if (!kv) return fail(res, 'not-configured');

  const { code, state, error } = req.query ?? {};
  if (error || typeof code !== 'string' || typeof state !== 'string') {
    return fail(res, error === 'access_denied' ? 'cancelled' : 'error');
  }

  // CSRF check.
  const expectedState = getCookie(req, 'mt_oauth_state');
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `mt_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
  );
  if (!expectedState || expectedState !== state) return fail(res, 'error');

  try {
    const host = req.headers?.host || 'm4ster-tracker.vercel.app';
    const redirectUri = `https://${host}/api/auth/google/callback`;

    // Exchange the code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail(res, 'error');
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return fail(res, 'error');

    // Who just signed in?
    const meRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meRes.ok) return fail(res, 'error');
    const profile = (await meRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (!profile.sub || !profile.email) return fail(res, 'error');

    // Find or create the user.
    let uid = (await kv.get(`google:${profile.sub}`)) as string | null;
    let username: string;
    if (uid) {
      const uname = (await kv.get(`uid:${uid}`)) as string | null;
      const existing = uname ? ((await kv.get(`user:${uname}`)) as any) : null;
      if (!existing) return fail(res, 'error');
      username = existing.username;
    } else {
      username = await uniqueUsername(kv, profile.email);
      uid = crypto.randomUUID();
      const user = {
        id: uid,
        username,
        email: profile.email,
        name: profile.name ?? '',
        avatar: profile.picture ?? '',
        googleId: profile.sub,
        pass: '', // Google-only account — password login always fails.
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:${username.toLowerCase()}`, user);
      await kv.set(`uid:${uid}`, username.toLowerCase());
      await kv.set(`google:${profile.sub}`, uid);
    }

    // Session cookie, then home (or deep link for desktop).
    const sessionToken = crypto.randomUUID();
    await kv.set(
      `sess:${sessionToken}`,
      { uid, createdAt: Date.now() },
      { ex: SESSION_TTL_SECONDS }
    );

    // Desktop app (Tauri): use one-time code via deep link, not raw token.
    const isDesktop = getCookie(req, 'mt_oauth_desktop') === '1';
    if (isDesktop) {
      const otc = crypto.randomUUID();
      await kv.set(
        `desktop_otc:${otc}`,
        { uid, sessionToken, createdAt: Date.now() },
        { ex: 300 } // 5 minutes
      );
      res.setHeader('Set-Cookie', [
        `mt_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`,
        `mt_oauth_desktop=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`,
      ]);
      res.writeHead(302, { Location: `m4ster-tracker://auth/callback?code=${otc}&state=${state}` });
      return res.end();
    }

    res.setHeader('Set-Cookie', [
      `mt_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`,
      `mt_session=${sessionToken}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`,
    ]);
    res.writeHead(302, { Location: '/' });
    return res.end();
  } catch (e) {
    console.error('google oauth error', e);
    return fail(res, 'error');
  }
}
