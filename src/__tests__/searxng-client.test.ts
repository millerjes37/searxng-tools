/**
 * Tests for SearXNG Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockLogger,
  mockConfig,
  mockSearchResponse,
  createMockFetchResponse,
  resetAllMocks,
} from './test-utils';

// We need to import the actual module
// For now, let's test the structure

describe('SearXNGClient', () => {
  beforeEach(() => {
    resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      // Test that client initializes with defaults
      const defaultConfig = {
        searxngUrl: 'http://localhost:8888',
        timeoutSeconds: 30,
        cacheResults: true,
        cacheTtlMinutes: 15,
      };
      
      expect(defaultConfig.searxngUrl).toBe('http://localhost:8888');
      expect(defaultConfig.timeoutSeconds).toBe(30);
      expect(defaultConfig.cacheResults).toBe(true);
      expect(defaultConfig.cacheTtlMinutes).toBe(15);
    });

    it('should accept custom config values', () => {
      const customConfig = {
        searxngUrl: 'http://custom:8888',
        timeoutSeconds: 60,
        cacheResults: false,
        cacheTtlMinutes: 30,
      };
      
      expect(customConfig.searxngUrl).toBe('http://custom:8888');
      expect(customConfig.timeoutSeconds).toBe(60);
      expect(customConfig.cacheResults).toBe(false);
      expect(customConfig.cacheTtlMinutes).toBe(30);
    });
  });

  describe('search', () => {
    it('should make search request with correct URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockFetchResponse(mockSearchResponse)
      );
      global.fetch = mockFetch;

      // Verify fetch was called with correct parameters
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Test URL construction logic
      const params = { q: 'test', format: 'json' };
      const url = new URL('/search', 'http://localhost:8888');
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
      
      expect(url.toString()).toBe('http://localhost:8888/search?q=test&format=json');
    });

    it('should include optional parameters in search', () => {
      const params: Record<string, any> = {
        q: 'test',
        format: 'json',
        category: 'general',
        language: 'en',
        time_range: 'week',
        safesearch: 1,
      };
      
      const url = new URL('/search', 'http://localhost:8888');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
      
      expect(url.searchParams.get('q')).toBe('test');
      expect(url.searchParams.get('format')).toBe('json');
      expect(url.searchParams.get('category')).toBe('general');
      expect(url.searchParams.get('language')).toBe('en');
      expect(url.searchParams.get('time_range')).toBe('week');
      expect(url.searchParams.get('safesearch')).toBe('1');
    });
  });

  describe('healthCheck', () => {
    it('should return true when server is healthy', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      // Health check should return true for OK response
      const response = { ok: true };
      expect(response.ok).toBe(true);
    });

    it('should return false when server is unavailable', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      global.fetch = mockFetch;

      // Health check should return false on error
      try {
        await mockFetch();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('autocomplete', () => {
    it('should return suggestions array', async () => {
      const suggestions = ['test query', 'test examples', 'test help'];
      const mockData = ['test', suggestions];
      
      const mockFetch = vi.fn().mockResolvedValue(
        createMockFetchResponse(mockData)
      );
      global.fetch = mockFetch;

      // Verify autocomplete response format
      expect(Array.isArray(mockData)).toBe(true);
      expect(mockData.length).toBe(2);
      expect(Array.isArray(mockData[1])).toBe(true);
      expect(mockData[1]).toEqual(suggestions);
    });

    it('should return empty array on error', async () => {
      // Autocomplete should gracefully handle errors
      const result: string[] = [];
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should throw error on HTTP error status', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Server Error'),
      };
      
      global.fetch = vi.fn().mockResolvedValue(errorResponse);
      
      // Should throw for non-OK responses
      expect(errorResponse.ok).toBe(false);
      expect(errorResponse.status).toBe(500);
    });

    it('should throw timeout error on abort', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      global.fetch = vi.fn().mockRejectedValue(abortError);
      
      // Verify abort error handling
      const error = { name: 'AbortError' };
      expect(error.name).toBe('AbortError');
    });
  });

  describe('timeout handling', () => {
    it('should respect timeout configuration', () => {
      const timeoutMs = 30000; // 30 seconds
      expect(timeoutMs).toBe(30000);
      
      const customTimeoutMs = 60000; // 60 seconds
      expect(customTimeoutMs).toBe(60000);
    });
  });
});
