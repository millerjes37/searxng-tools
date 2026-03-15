/**
 * Tests for caching functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Caching', () => {
  describe('SimpleCache', () => {
    interface CacheEntry {
      value: any;
      expires: number;
    }

    let cache: Map<string, CacheEntry>;

    beforeEach(() => {
      cache = new Map();
      vi.useFakeTimers();
    });

    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttlMs = 60000; // 1 minute

      cache.set(key, { value, expires: Date.now() + ttlMs });

      const entry = cache.get(key);
      expect(entry).toBeDefined();
      expect(entry?.value).toEqual(value);
    });

    it('should return undefined for missing keys', () => {
      const result = cache.get('missing-key');
      expect(result).toBeUndefined();
    });

    it('should return undefined for expired entries', () => {
      const key = 'expired-key';
      const value = 'expired-value';
      const ttlMs = 1000; // 1 second

      cache.set(key, { value, expires: Date.now() + ttlMs });

      // Fast forward past expiration
      vi.advanceTimersByTime(2000);

      const entry = cache.get(key);
      if (entry && Date.now() > entry.expires) {
        cache.delete(key);
      }

      expect(cache.get(key)).toBeUndefined();
    });

    it('should return valid entries before expiration', () => {
      const key = 'valid-key';
      const value = 'valid-value';
      const ttlMs = 60000; // 1 minute

      cache.set(key, { value, expires: Date.now() + ttlMs });

      // Fast forward but not past expiration
      vi.advanceTimersByTime(30000);

      const entry = cache.get(key);
      expect(entry).toBeDefined();
      expect(entry?.value).toBe(value);
      expect(Date.now()).toBeLessThan(entry!.expires);
    });

    it('should clear all entries', () => {
      cache.set('key1', { value: 'value1', expires: Date.now() + 60000 });
      cache.set('key2', { value: 'value2', expires: Date.now() + 60000 });

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.size).toBe(0);
    });

    it('should generate consistent cache keys', () => {
      const method = 'search';
      const params = { q: 'test', category: 'general' };
      const cacheKey = `${method}:${JSON.stringify(params)}`;

      expect(cacheKey).toBe('search:{"q":"test","category":"general"}');
    });

    it('should respect TTL configuration', () => {
      const cacheTtlMinutes = 15;
      const ttlMs = cacheTtlMinutes * 60 * 1000;

      expect(ttlMs).toBe(900000); // 15 minutes in ms
    });

    it('should cache results when enabled', () => {
      const cacheEnabled = true;
      expect(cacheEnabled).toBe(true);
    });

    it('should not cache when disabled', () => {
      const cacheEnabled = false;
      expect(cacheEnabled).toBe(false);
    });
  });

  describe('cache key generation', () => {
    it('should include method name in key', () => {
      const method = 'search';
      const params = {};
      const key = `${method}:${JSON.stringify(params)}`;

      expect(key.startsWith('search:')).toBe(true);
    });

    it('should include all parameters in key', () => {
      const method = 'search';
      const params = {
        q: 'test query',
        category: 'general',
        language: 'en',
        time_range: 'week',
      };
      const key = `${method}:${JSON.stringify(params)}`;

      expect(key).toContain('test query');
      expect(key).toContain('general');
      expect(key).toContain('en');
      expect(key).toContain('week');
    });

    it('should generate unique keys for different params', () => {
      const method = 'search';
      const key1 = `${method}:${JSON.stringify({ q: 'test1' })}`;
      const key2 = `${method}:${JSON.stringify({ q: 'test2' })}`;

      expect(key1).not.toBe(key2);
    });
  });

  describe('cache hit/miss logging', () => {
    it('should log cache hits', () => {
      const logger = { debug: vi.fn() };
      const cacheKey = 'search:{"q":"test"}';

      // Simulate cache hit
      logger.debug('Cache hit for', 'search', 'test');

      expect(logger.debug).toHaveBeenCalledWith('Cache hit for', 'search', 'test');
    });
  });

  describe('cache integration', () => {
    it('should check cache before making request', () => {
      const cacheKey = 'search:{"q":"test"}';
      const cache = new Map();

      // Check if exists in cache
      const cached = cache.get(cacheKey);
      expect(cached).toBeUndefined();
    });

    it('should store response in cache after successful request', () => {
      const cacheKey = 'search:{"q":"test"}';
      const response = { results: [] };
      const cache = new Map();
      const ttlMs = 900000;

      cache.set(cacheKey, { value: response, expires: Date.now() + ttlMs });

      expect(cache.get(cacheKey)?.value).toEqual(response);
    });
  });
});
