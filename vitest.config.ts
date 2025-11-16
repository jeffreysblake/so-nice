import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // Allow parallel execution for unit tests (lightweight, no Phaser game instances)
    // These tests run fast and don't consume significant resources
    threads: true,
    maxWorkers: undefined, // Use all available CPU cores
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/reference/**', // Exclude reference repos from tests
      '**/tests/e2e/**', // Exclude Playwright E2E tests (use npm run test:e2e)
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'reference/',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/main.ts',
        '**/scenes/**', // Exclude Phaser scenes from coverage
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
