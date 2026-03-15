/**
 * Test utilities and mocks for SearXNG Tools plugin
 */

import { vi } from 'vitest';

// Mock logger
export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Mock plugin config
export const mockConfig = {
  searxngUrl: 'http://localhost:8888',
  defaultMaxResults: 10,
  timeoutSeconds: 30,
  cacheResults: true,
  cacheTtlMinutes: 15,
  logLevel: 'info',
};

// Mock API
export const mockApi = {
  registerTool: vi.fn(),
  registerHook: vi.fn(),
  on: vi.fn(),
  logger: mockLogger,
  config: {
    plugins: {
      entries: {
        'searxng-tools': {
          config: mockConfig,
        },
      },
    },
  },
};

// Sample search response
export const mockSearchResponse = {
  query: 'test query',
  number_of_results: 100,
  results: [
    {
      url: 'https://example.com/1',
      title: 'Test Result 1',
      content: 'This is test content for result 1',
      engine: 'google',
      engines: ['google', 'bing'],
      score: 0.95,
      category: 'general',
    },
    {
      url: 'https://example.com/2',
      title: 'Test Result 2',
      content: 'This is test content for result 2',
      engine: 'bing',
      engines: ['bing'],
      score: 0.85,
      category: 'general',
    },
  ],
  suggestions: ['test query help', 'test query examples'],
};

// Sample image search response
export const mockImageResponse = {
  query: 'cat',
  number_of_results: 50,
  results: [
    {
      url: 'https://example.com/image1',
      title: 'Cute Cat',
      img_src: 'https://example.com/cat1.jpg',
      thumbnail: 'https://example.com/cat1-thumb.jpg',
      engines: ['google images'],
      category: 'images',
    },
  ],
};

// Sample news response
export const mockNewsResponse = {
  query: 'technology',
  number_of_results: 25,
  results: [
    {
      url: 'https://news.example.com/1',
      title: 'Tech News Today',
      content: 'Latest technology news content',
      publishedDate: '2024-01-15',
      engines: ['google news'],
      category: 'news',
    },
  ],
};

// Sample video response
export const mockVideoResponse = {
  query: 'tutorial',
  number_of_results: 30,
  results: [
    {
      url: 'https://video.example.com/1',
      title: 'Programming Tutorial',
      thumbnail: 'https://video.example.com/thumb1.jpg',
      engines: ['youtube'],
      category: 'videos',
    },
  ],
};

// Sample autocomplete response
export const mockAutocompleteResponse = ['test query', 'test query examples', 'test query help'];

// Helper to create mock fetch responses
export function createMockFetchResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
  };
}

// Helper to wait for promises
export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.debug.mockClear();
  mockApi.registerTool.mockClear();
  mockApi.on.mockClear();
}
