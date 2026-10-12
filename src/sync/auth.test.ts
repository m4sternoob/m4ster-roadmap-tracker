import { describe, it, expect } from 'vitest';
import {
  USERNAME_RE,
  hashPassword,
  verifyPassword,
  parseCookies,
  sessionCookie,
  clearSessionCookie,
} from '@/sync/authShared';

describe('auth helpers', () => {
  describe('USERNAME_RE', () => {
    it('accepts valid usernames', () => {
      expect(USERNAME_RE.test('m4ster')).toBe(true);
      expect(USERNAME_RE.test('a-b_c')).toBe(true);
      expect(USERNAME_RE.test('abc')).toBe(true);
    });
    it('rejects invalid usernames', () => {
      expect(USERNAME_RE.test('ab')).toBe(false); // too short
      expect(USERNAME_RE.test('a'.repeat(21))).toBe(false); // too long
      expect(USERNAME_RE.test('has space')).toBe(false);
      expect(USERNAME_RE.test('semi;colon')).toBe(false);
    });
  });

  describe('password hashing', () => {
    it('hashes and verifies a password', async () => {
      const hash = await hashPassword('correct-horse-123');
      expect(hash.startsWith('pbkdf2$')).toBe(true);
      expect(await verifyPassword('correct-horse-123', hash)).toBe(true);
    });
    it('rejects a wrong password', async () => {
      const hash = await hashPassword('correct-horse-123');
      expect(await verifyPassword('wrong-password', hash)).toBe(false);
    });
    it('produces different hashes for the same password (salted)', async () => {
      const a = await hashPassword('same-password');
      const b = await hashPassword('same-password');
      expect(a).not.toBe(b);
      expect(await verifyPassword('same-password', a)).toBe(true);
      expect(await verifyPassword('same-password', b)).toBe(true);
    });
    it('rejects malformed stored hashes', async () => {
      expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
      expect(await verifyPassword('x', 'pbkdf2$abc$def')).toBe(false);
    });
  });

  describe('cookies', () => {
    it('parses the session cookie', () => {
      const cookies = parseCookies({ headers: { cookie: 'a=1; mt_session=tok123; b=2' } });
      expect(cookies['mt_session']).toBe('tok123');
    });
    it('returns empty for missing cookie header', () => {
      expect(parseCookies({ headers: {} })).toEqual({});
    });
    it('session cookie is HttpOnly', () => {
      const c = sessionCookie('tok123');
      expect(c).toContain('mt_session=tok123');
      expect(c).toContain('HttpOnly');
      expect(c).toContain('SameSite=Lax');
    });
    it('clear cookie expires immediately', () => {
      expect(clearSessionCookie()).toContain('Max-Age=0');
    });
  });
});
