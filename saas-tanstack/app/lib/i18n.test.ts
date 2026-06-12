import { describe, it, expect } from 'vitest';
import { getLocaleFromUrl, getLocaleFromHeaders, locales, defaultLocale } from '~/lib/i18n';

describe('i18n Functions', () => {
  describe('getLocaleFromUrl', () => {
    it('should return locale from URL with locale prefix', () => {
      expect(getLocaleFromUrl('http://localhost:3000/en/pricing')).toBe('en');
    });

    it('should return locale from URL with zh prefix', () => {
      expect(getLocaleFromUrl('http://localhost:3000/zh/pricing')).toBe('zh');
    });

    it('should return default locale for URL without locale prefix', () => {
      expect(getLocaleFromUrl('http://localhost:3000/pricing')).toBe(defaultLocale);
    });
  });

  describe('getLocaleFromHeaders', () => {
    it('should return locale from accept-language header', () => {
      const headers = new Headers({ 'accept-language': 'en-US,en;q=0.9' });
      expect(getLocaleFromHeaders(headers)).toBe('en');
    });

    it('should return default locale for missing header', () => {
      const headers = new Headers();
      expect(getLocaleFromHeaders(headers)).toBe(defaultLocale);
    });
  });

  describe('locales', () => {
    it('should have en and zh locales', () => {
      expect(locales).toContain('en');
      expect(locales).toContain('zh');
    });
  });
});
