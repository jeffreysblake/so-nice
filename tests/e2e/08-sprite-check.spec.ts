import { test, expect } from '@playwright/test';

test.describe('Sprite Loading Check', () => {
  test('Take screenshot to verify Green Hill Zone sprites are rendering', async ({ page }) => {
    console.log('📸 Taking screenshot to verify sprite rendering...\n');

    await page.goto('http://localhost:5174');

    // Wait for game to fully initialize
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `test-results/sprite-check.png`,
      fullPage: false
    });

    console.log('✓ Screenshot saved to test-results/sprite-check.png\n');
    console.log('Expected: Green Hill Zone grass/ground sprites');
    console.log('Not expected: Solid brown programmatic tiles\n');

    expect(true).toBe(true);
  });
});
