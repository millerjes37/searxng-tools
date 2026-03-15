import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.*',
        '**/*.d.ts',
        'src/__tests__/**',
      ],
      // Thresholds disabled - coverage reporting only
      // Full coverage requires OpenClaw runtime integration
      // Current coverage: ~7% (module loading + plugin registration tested)
    },
    mockReset: true,
    restoreMocks: true,
  },
});
