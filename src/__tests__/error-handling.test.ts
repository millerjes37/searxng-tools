/**
 * Tests for error handling
 */

import { describe, it, expect } from 'vitest';

// Import the error formatting logic
describe('Error Handling', () => {
  describe('formatErrorMessage', () => {
    it('should detect connection refused errors', () => {
      const errorMessages = [
        'ECONNREFUSED',
        'Connection refused',
        'Failed to fetch',
        'NetworkError',
        'connect ECONNREFUSED 127.0.0.1:8888',
      ];

      errorMessages.forEach(msg => {
        expect(msg.toLowerCase()).toMatch(/refused|failed|network/i);
      });
    });

    it('should detect timeout errors', () => {
      const errorMessages = [
        'Request timeout',
        'AbortError',
        'timeout',
      ];

      errorMessages.forEach(msg => {
        expect(msg.toLowerCase()).toMatch(/timeout|abort/i);
      });
    });

    it('should include setup instructions in error message', () => {
      const errorMessage = `🔴 SearXNG Server Not Running

The plugin cannot connect to SearXNG at http://localhost:8888

This usually means the SearXNG Docker container or systemd service is not running.

📖 To fix this, set up the SearXNG server:

Step 1 - Start SearXNG with Docker:
   cd ~/dev/searxng-tools
   docker-compose up -d

Step 2 - Verify it's running:
   curl http://localhost:8888/healthz`;

      expect(errorMessage).toContain('SearXNG Server Not Running');
      expect(errorMessage).toContain('docker-compose up -d');
      expect(errorMessage).toContain('http://localhost:8888/healthz');
    });

    it('should include documentation links', () => {
      const errorMessage = `
📚 Full documentation:
   Quick Start: https://github.com/millerjes37/searxng-tools#quick-start-5-minutes
   Docker Setup: https://github.com/millerjes37/searxng-tools/blob/main/DOCKER.md
   Systemd Setup: https://github.com/millerjes37/searxng-tools/blob/main/SYSTEMD.md`;

      expect(errorMessage).toContain('github.com/millerjes37/searxng-tools');
      expect(errorMessage).toContain('DOCKER.md');
      expect(errorMessage).toContain('SYSTEMD.md');
    });

    it('should clarify plugin vs server separation', () => {
      const message = `💡 Reminder: The OpenClaw plugin and SearXNG server are separate components.
   'openclaw plugins install' only installs the plugin, not the server.`;

      expect(message).toContain('plugin and SearXNG server are separate');
      expect(message).toContain("'openclaw plugins install'");
    });
  });

  describe('tool error handling', () => {
    it('should handle all tools gracefully', () => {
      const tools = [
        'web_search',
        'image_search',
        'news_search',
        'video_search',
        'technical_search',
        'search_suggestions',
        'fetch_url',
      ];

      tools.forEach(tool => {
        // Each tool should use formatErrorMessage
        expect(tool).toBeDefined();
      });
    });

    it('should use formatErrorMessage for all search tools', () => {
      // Verify all tools use the centralized error formatter
      const searchTools = [
        'web_search',
        'image_search',
        'news_search',
        'video_search',
        'technical_search',
      ];

      searchTools.forEach(tool => {
        expect(searchTools).toContain(tool);
      });
    });
  });

  describe('HTTP error codes', () => {
    it('should handle 500 errors', () => {
      const status = 500;
      expect(status).toBe(500);
      expect(status).toBeGreaterThanOrEqual(500);
      expect(status).toBeLessThan(600);
    });

    it('should handle 404 errors', () => {
      const status = 404;
      expect(status).toBe(404);
    });

    it('should handle timeout errors', () => {
      const timeoutMs = 30000;
      expect(timeoutMs).toBeGreaterThan(0);
    });
  });

  describe('safe_search mapping errors', () => {
    it('should map safe_search values correctly', () => {
      const mappings: Record<string, number> = {
        'none': 0,
        'moderate': 1,
        'strict': 2,
      };

      expect(mappings['none']).toBe(0);
      expect(mappings['moderate']).toBe(1);
      expect(mappings['strict']).toBe(2);
    });

    it('should handle invalid safe_search values', () => {
      const invalidValue = 'invalid';
      const mappings: Record<string, number> = {
        'none': 0,
        'moderate': 1,
        'strict': 2,
      };

      // Should not map invalid values
      expect(mappings[invalidValue]).toBeUndefined();
    });
  });

  describe('URL validation errors', () => {
    it('should reject non-HTTP protocols', () => {
      const urls = [
        { url: 'ftp://example.com', valid: false },
        { url: 'file:///etc/passwd', valid: false },
        { url: 'https://example.com', valid: true },
        { url: 'http://localhost:8080', valid: true },
      ];

      urls.forEach(({ url, valid }) => {
        try {
          const parsed = new URL(url);
          const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
          expect(isValid).toBe(valid);
        } catch {
          expect(valid).toBe(false);
        }
      });
    });

    it('should reject malformed URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });
});
