/**
 * GET /api/auth/google — start "Sign in with Google".
 * Sets a CSRF state cookie, then redirects to Google's consent screen.
 * Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars. Deployed 2026-10-12 10:06.
 *
 * Fully self-contained (no imports): Vercel's function bundler does not
 * resolve shared-module imports for these routes (500s at runtime).
 */

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.writeHead(302, { Location: '/?auth=not-configured' });
    return res.end();
  }
  const host = req.headers?.host || 'm4ster-tracker.vercel.app';
  const redirectUri = `https://${host}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  const secure = process.env.VERCEL_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `mt_oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${secure}`
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  return res.end();
}
