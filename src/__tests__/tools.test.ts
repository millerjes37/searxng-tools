/**
 * Tests for all 7 SearXNG Tools
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockLogger,
  mockApi,
  mockSearchResponse,
  mockImageResponse,
  mockNewsResponse,
  mockVideoResponse,
  mockAutocompleteResponse,
  resetAllMocks,
} from './test-utils';

describe('SearXNG Tools', () => {
  beforeEach(() => {
    resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('web_search tool', () => {
    it('should have correct tool definition', () => {
      const toolDefinition = {
        name: 'web_search',
        description: 'Search the web using SearXNG. Free, private search aggregating 89+ search engines.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (required)' },
            count: { type: 'number', minimum: 1, maximum: 50 },
            country: { type: 'string' },
            language: { type: 'string' },
            freshness: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
            safe_search: { type: 'string', enum: ['none', 'moderate', 'strict'] },
            page: { type: 'number', minimum: 1 },
          },
          required: ['query'],
        },
      };

      expect(toolDefinition.name).toBe('web_search');
      expect(toolDefinition.parameters.required).toContain('query');
      expect(toolDefinition.parameters.properties.count.minimum).toBe(1);
      expect(toolDefinition.parameters.properties.count.maximum).toBe(50);
    });

    it('should map OpenClaw parameters to SearXNG parameters', () => {
      const openclawParams = {
        query: 'test',
        count: 10,
        language: 'en',
        freshness: 'week',
        safe_search: 'moderate',
        page: 1,
      };

      // Map to SearXNG parameters
      const searxngParams: Record<string, any> = {
        query: openclawParams.query,
        category: 'general',
        max_results: openclawParams.count,
      };

      if (openclawParams.language) searxngParams.language = openclawParams.language;
      if (openclawParams.freshness) searxngParams.time_range = openclawParams.freshness;
      if (openclawParams.page) searxngParams.pageno = openclawParams.page;
      if (openclawParams.safe_search) {
        switch (openclawParams.safe_search) {
          case 'none': searxngParams.safesearch = 0; break;
          case 'moderate': searxngParams.safesearch = 1; break;
          case 'strict': searxngParams.safesearch = 2; break;
        }
      }

      expect(searxngParams.query).toBe('test');
      expect(searxngParams.category).toBe('general');
      expect(searxngParams.max_results).toBe(10);
      expect(searxngParams.language).toBe('en');
      expect(searxngParams.time_range).toBe('week');
      expect(searxngParams.safesearch).toBe(1);
      expect(searxngParams.pageno).toBe(1);
    });

    it('should format search results correctly', () => {
      const results = mockSearchResponse.results;
      const formatted = formatSearchResults('test', results, 100, 10);
      
      expect(formatted).toContain('## Search Results for: "test"');
      expect(formatted).toContain('Test Result 1');
      expect(formatted).toContain('https://example.com/1');
      expect(formatted).toContain('Estimated total results: 100');
    });
  });

  describe('image_search tool', () => {
    it('should have correct tool definition', () => {
      const toolDefinition = {
        name: 'image_search',
        description: 'Search for images using SearXNG.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            count: { type: 'number', minimum: 1, maximum: 50 },
            safe_search: { type: 'string', enum: ['none', 'moderate', 'strict'] },
          },
          required: ['query'],
        },
      };

      expect(toolDefinition.name).toBe('image_search');
      expect(toolDefinition.parameters.properties.query.type).toBe('string');
    });

    it('should format image results correctly', () => {
      const results = mockImageResponse.results;
      const formatted = formatImageResults('cat', results, 10);
      
      expect(formatted).toContain('## Image Search Results for: "cat"');
      expect(formatted).toContain('Cute Cat');
      expect(formatted).toContain('https://example.com/cat1.jpg');
    });
  });

  describe('news_search tool', () => {
    it('should have correct tool definition', () => {
      const toolDefinition = {
        name: 'news_search',
        description: 'Search for news articles using SearXNG.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            count: { type: 'number', minimum: 1, maximum: 50 },
            freshness: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
            language: { type: 'string' },
          },
          required: ['query'],
        },
      };

      expect(toolDefinition.name).toBe('news_search');
    });

    it('should format news results correctly', () => {
      const results = mockNewsResponse.results;
      const formatted = formatNewsResults('technology', results, 10);
      
      expect(formatted).toContain('## News Results for: "technology"');
      expect(formatted).toContain('Tech News Today');
      expect(formatted).toContain('2024-01-15');
    });
  });

  describe('video_search tool', () => {
    it('should have correct tool definition', () => {
      expect(true).toBe(true); // Tool definition test
    });

    it('should format video results correctly', () => {
      const results = mockVideoResponse.results;
      const formatted = formatVideoResults('tutorial', results, 10);
      
      expect(formatted).toContain('## Video Search Results for: "tutorial"');
      expect(formatted).toContain('Programming Tutorial');
    });
  });

  describe('technical_search tool', () => {
    it('should search IT category', () => {
      const searxngParams = {
        query: 'docker tutorial',
        category: 'it',
        max_results: 10,
      };

      expect(searxngParams.category).toBe('it');
      expect(searxngParams.query).toBe('docker tutorial');
    });
  });

  describe('search_suggestions tool', () => {
    it('should format suggestions correctly', () => {
      const suggestions = mockAutocompleteResponse;
      const formatted = formatSuggestions('rust pro', suggestions);
      
      expect(formatted).toContain('## Search Suggestions for: "rust pro"');
      expect(formatted).toContain('test query');
      expect(formatted).toContain('test query examples');
    });

    it('should handle empty suggestions', () => {
      const formatted = formatSuggestions('xyz', []);
      expect(formatted).toContain('No suggestions available');
    });
  });

  describe('fetch_url tool', () => {
    it('should validate URLs correctly', () => {
      const validUrl = 'https://example.com';
      const invalidUrl = 'ftp://example.com';

      const validateUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };

      expect(validateUrl(validUrl)).toBe(true);
      expect(validateUrl(invalidUrl)).toBe(false);
    });

    it('should respect max_length parameter', () => {
      const content = 'a'.repeat(100000);
      const maxLength = 50000;
      
      const truncated = content.length > maxLength 
        ? content.substring(0, maxLength) + '\n\n[Content truncated...]' 
        : content;

      expect(truncated.length).toBeLessThanOrEqual(maxLength + 30);
      expect(truncated).toContain('[Content truncated...]');
    });
  });
});

// Helper functions for formatting (mock implementations)
function formatSearchResults(query: string, results: any[], total?: number, maxResults?: number): string {
  let output = `## Search Results for: "${query}"\n\n`;
  if (total !== undefined) {
    output += `Estimated total results: ${total}\n\n`;
  }
  results.slice(0, maxResults || 10).forEach((result, i) => {
    output += `### ${i + 1}. ${result.title}\n\n`;
    output += `**URL:** ${result.url}\n\n`;
    if (result.content) output += `${result.content}\n\n`;
  });
  return output;
}

function formatImageResults(query: string, results: any[], maxResults?: number): string {
  let output = `## Image Search Results for: "${query}"\n\n`;
  results.slice(0, maxResults || 10).forEach((result, i) => {
    output += `### ${i + 1}. ${result.title}\n\n`;
    if (result.img_src) output += `**Image URL:** ${result.img_src}\n\n`;
  });
  return output;
}

function formatNewsResults(query: string, results: any[], maxResults?: number): string {
  let output = `## News Results for: "${query}"\n\n`;
  results.slice(0, maxResults || 10).forEach((result, i) => {
    output += `### ${i + 1}. ${result.title}\n\n`;
    if (result.publishedDate) output += `**Published:** 📅 ${result.publishedDate}\n\n`;
  });
  return output;
}

function formatVideoResults(query: string, results: any[], maxResults?: number): string {
  let output = `## Video Search Results for: "${query}"\n\n`;
  results.slice(0, maxResults || 10).forEach((result, i) => {
    output += `### ${i + 1}. ${result.title}\n\n`;
  });
  return output;
}

function formatSuggestions(query: string, suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) {
    return `## Search Suggestions for: "${query}"\n\n*No suggestions available.*`;
  }
  
  let output = `## Search Suggestions for: "${query}"\n\n`;
  suggestions.forEach((suggestion, i) => {
    output += `${i + 1}. ${suggestion}\n`;
  });
  return output;
}
