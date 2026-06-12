import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency, generateId, slugify } from '~/lib/utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });
  });

  describe('formatDate', () => {
    it('should format a date', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in USD', () => {
      expect(formatCurrency(999)).toBe('$9.99');
    });

    it('should format currency with custom currency', () => {
      expect(formatCurrency(999, 'EUR')).toContain('€');
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('slugify', () => {
    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello! @World#')).toBe('hello-world');
    });
  });
});
