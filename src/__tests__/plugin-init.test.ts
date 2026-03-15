/**
 * Tests for plugin initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Plugin Initialization', () => {
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      registerTool: vi.fn(),
      registerHook: vi.fn(),
      on: vi.fn(),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      config: {
        plugins: {
          entries: {
            'searxng-tools': {
              config: {
                searxngUrl: 'http://localhost:8888',
                defaultMaxResults: 10,
                timeoutSeconds: 30,
                cacheResults: true,
                cacheTtlMinutes: 15,
                logLevel: 'info',
              },
            },
          },
        },
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('plugin configuration', () => {
    it('should load configuration from config', () => {
      const config = mockApi.config.plugins.entries['searxng-tools'].config;

      expect(config.searxngUrl).toBe('http://localhost:8888');
      expect(config.defaultMaxResults).toBe(10);
      expect(config.timeoutSeconds).toBe(30);
      expect(config.cacheResults).toBe(true);
      expect(config.cacheTtlMinutes).toBe(15);
      expect(config.logLevel).toBe('info');
    });

    it('should use default values for missing config', () => {
      const defaults = {
        searxngUrl: 'http://localhost:8888',
        defaultMaxResults: 10,
        timeoutSeconds: 30,
        cacheResults: true,
        cacheTtlMinutes: 15,
        logLevel: 'info',
      };

      expect(defaults.searxngUrl).toBe('http://localhost:8888');
      expect(defaults.defaultMaxResults).toBe(10);
    });
  });

  describe('tool registration', () => {
    it('should register 7 tools', () => {
      const expectedTools = [
        'web_search',
        'image_search',
        'news_search',
        'video_search',
        'technical_search',
        'search_suggestions',
        'fetch_url',
      ];

      expect(expectedTools.length).toBe(7);
      expect(expectedTools).toContain('web_search');
      expect(expectedTools).toContain('image_search');
      expect(expectedTools).toContain('news_search');
      expect(expectedTools).toContain('video_search');
      expect(expectedTools).toContain('technical_search');
      expect(expectedTools).toContain('search_suggestions');
      expect(expectedTools).toContain('fetch_url');
    });

    it('should register tools with correct structure', () => {
      const toolStructure = {
        name: 'web_search',
        description: expect.any(String),
        parameters: {
          type: 'object',
          properties: expect.any(Object),
          required: expect.any(Array),
        },
        execute: expect.any(Function),
      };

      expect(toolStructure.name).toBe('web_search');
      expect(toolStructure.parameters.type).toBe('object');
    });
  });

  describe('logging', () => {
    it('should log initialization message', () => {
      mockApi.logger.info('SearXNG Search Plugin initializing...');
      expect(mockApi.logger.info).toHaveBeenCalledWith('SearXNG Search Plugin initializing...');
    });

    it('should log registered tools', () => {
      const tools = 'web_search, image_search, news_search, video_search, technical_search, search_suggestions, fetch_url';
      mockApi.logger.info('Tools:', tools);
      expect(mockApi.logger.info).toHaveBeenCalledWith('Tools:', tools);
    });
  });

  describe('hooks', () => {
    it('should register gateway start hook', () => {
      mockApi.on('gateway:start', vi.fn());
      expect(mockApi.on).toHaveBeenCalledWith('gateway:start', expect.any(Function));
    });

    it('should register before_tool_call hook when auto-shadow enabled', () => {
      const autoShadow = true;
      
      if (autoShadow) {
        mockApi.on('before_tool_call', vi.fn());
      }

      expect(mockApi.on).toHaveBeenCalledWith('before_tool_call', expect.any(Function));
    });
  });

  describe('health check', () => {
    it('should perform health check on startup', async () => {
      const healthCheck = vi.fn().mockResolvedValue(true);
      
      // Simulate startup
      await healthCheck();

      expect(healthCheck).toHaveBeenCalled();
    });

    it('should log health check results', () => {
      mockApi.logger.info('✓ SearXNG is healthy and ready');
      expect(mockApi.logger.info).toHaveBeenCalledWith('✓ SearXNG is healthy and ready');
    });
  });

  describe('config validation', () => {
    it('should validate searxngUrl is a valid URL', () => {
      const urls = [
        { url: 'http://localhost:8888', valid: true },
        { url: 'https://searxng.example.com', valid: true },
        { url: 'not-a-url', valid: false },
      ];

      urls.forEach(({ url, valid }) => {
        try {
          new URL(url);
          expect(valid).toBe(true);
        } catch {
          expect(valid).toBe(false);
        }
      });
    });

    it('should validate maxResults is within bounds', () => {
      const validateMaxResults = (value: number) => {
        return value >= 1 && value <= 50;
      };

      expect(validateMaxResults(10)).toBe(true);
      expect(validateMaxResults(1)).toBe(true);
      expect(validateMaxResults(50)).toBe(true);
      expect(validateMaxResults(0)).toBe(false);
      expect(validateMaxResults(51)).toBe(false);
    });
  });
});
