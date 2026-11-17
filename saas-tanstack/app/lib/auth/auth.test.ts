import { describe, it, expect } from 'vitest';
import {
  generateId,
  generateSessionToken,
  nextMonthlyReset,
  parseCookie,
  sha256Base64Url,
  timingSafeEqual,
} from './index';

describe('auth primitives', () => {
  describe('token generation', () => {
    it('produces a 256-bit session token', () => {
      expect(generateSessionToken()).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces distinct values across calls', () => {
      const tokens = new Set(Array.from({ length: 50 }, () => generateSessionToken()));
      expect(tokens.size).toBe(50);
    });

    it('produces a 128-bit id', () => {
      expect(generateId()).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('parseCookie', () => {
    it('reads a value by name', () => {
      expect(parseCookie('a=1; session_token=abc; b=2', 'session_token')).toBe('abc');
    });

    it('does not truncate values containing "="', () => {
      // base64 值带 '=' 补位，用 split('=')[1] 解析会截断
      expect(parseCookie('session_token=YWJjZA==', 'session_token')).toBe('YWJjZA==');
    });

    it('does not match on a name prefix', () => {
      expect(parseCookie('session_token_old=nope', 'session_token')).toBeUndefined();
    });

    it('returns undefined when absent', () => {
      expect(parseCookie('a=1; b=2', 'session_token')).toBeUndefined();
      expect(parseCookie('', 'session_token')).toBeUndefined();
    });

    it('url-decodes the value', () => {
      expect(parseCookie('next=%2Fdashboard', 'next')).toBe('/dashboard');
    });
  });

  describe('timingSafeEqual', () => {
    it('matches identical strings', () => {
      expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
    });

    it('rejects different strings of equal length', () => {
      expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
    });

    it('rejects different lengths', () => {
      expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    });
  });

  describe('sha256Base64Url (PKCE challenge)', () => {
    it('matches the RFC 7636 reference vector', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      await expect(sha256Base64Url(verifier)).resolves.toBe(
        'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
      );
    });

    it('emits url-safe base64 with no padding', async () => {
      const challenge = await sha256Base64Url('some-verifier-value');
      expect(challenge).not.toMatch(/[+/=]/);
    });
  });

  describe('nextMonthlyReset', () => {
    it('returns the first day of the following month at UTC midnight', () => {
      const reset = nextMonthlyReset(new Date('2026-08-17T13:45:00Z'));
      expect(reset.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    });

    it('rolls over the year boundary', () => {
      const reset = nextMonthlyReset(new Date('2026-12-31T23:59:59Z'));
      expect(reset.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    });

    it('is always in the future relative to its input', () => {
      const now = new Date('2026-02-01T00:00:00Z');
      expect(nextMonthlyReset(now).getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
