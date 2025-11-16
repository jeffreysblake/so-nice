import { test } from '@playwright/test';

test('Quick screenshot', async ({ page }) => {
  await page.goto('http://localhost:5174');
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: 'test-results/quick-screenshot.png',
    fullPage: false,
    timeout: 30000
  });
  console.log('Screenshot saved to test-results/quick-screenshot.png');
});
