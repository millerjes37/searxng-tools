/**
 * Integration test for the SearXNG Tools plugin
 * 
 * This test verifies that the plugin exports correctly and can be loaded
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the actual plugin
// Note: This tests the module structure, not full OpenClaw integration

describe('Plugin Module', () => {
  it('should export a default function', async () => {
    // Dynamic import to test the module structure
    const module = await import('../index');
    
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('should accept PluginApi parameter', async () => {
    const module = await import('../index');
    const plugin = module.default;
    
    const mockApi = {
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
              },
            },
          },
        },
      },
    };
    
    // Should not throw when called with valid API
    expect(() => plugin(mockApi)).not.toThrow();
    
    // Should register tools
    expect(mockApi.registerTool).toHaveBeenCalled();
  });

  it('should register 7 tools', async () => {
    const module = await import('../index');
    const plugin = module.default;
    
    const mockApi = {
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
              },
            },
          },
        },
      },
    };
    
    plugin(mockApi);
    
    expect(mockApi.registerTool).toHaveBeenCalledTimes(7);
  });

  it('should handle missing config gracefully', async () => {
    const module = await import('../index');
    const plugin = module.default;
    
    const mockApi = {
      registerTool: vi.fn(),
      registerHook: vi.fn(),
      on: vi.fn(),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      config: {}, // Missing plugin config
    };
    
    // Should not throw even with missing config (uses defaults)
    expect(() => plugin(mockApi)).not.toThrow();
  });
});
