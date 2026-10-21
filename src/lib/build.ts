/**
 * Build variant flag. Test/preview deployments set VITE_TEST_BUILD=true
 * (Vercel Preview environment), so the test copy carries TEST branding —
 * tab title + a TEST pill by the logo — while production stays clean.
 * Standing rule: TEST deployments are named/branded "Test"; production
 * keeps the clean name.
 */
export const IS_TEST_BUILD =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_TEST_BUILD === 'true';
