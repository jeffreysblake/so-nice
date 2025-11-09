import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Sonic Platformer E2E tests
 * Tests user stories and gameplay scenarios in a real browser
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel - LIMITED to prevent resource exhaustion */
  fullyParallel: false, // Run test files sequentially

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Limit workers to prevent system lockup from multiple game instances
   * Each worker runs a full Phaser game at 60 FPS with physics/rendering
   * To scale up: set PLAYWRIGHT_WORKERS=2 environment variable
   * Example: PLAYWRIGHT_WORKERS=2 npm run test:e2e
   */
  workers: process.env.PLAYWRIGHT_WORKERS
    ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : 1, // Default: 1 worker (safe for all systems)

  /* Reporter to use - 'list' for console output, 'html' auto-opens browser (annoying!) */
  reporter: 'list',

  /* Global timeout for each test */
  timeout: 30000, // 30 seconds max per test

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5174',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Disable video to reduce memory/disk usage */
    video: 'off', // Changed from 'retain-on-failure' to prevent resource exhaustion

    /* Set action timeout */
    actionTimeout: 10000, // 10 seconds max for any action

    /* Set navigation timeout */
    navigationTimeout: 15000, // 15 seconds max for page loads
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
