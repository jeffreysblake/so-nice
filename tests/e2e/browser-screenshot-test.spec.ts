import { test } from '@playwright/test';

test('test screenshot capability', async ({ page, browserName }) => {
  console.log(`Testing with browser: ${browserName}`);

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('✓ Page loaded');

  await page.waitForTimeout(1000);
  console.log('Attempting screenshot...');

  try {
    await page.screenshot({
      path: `test-results/screenshot-${browserName}-1sec.png`,
      fullPage: false
    });
    console.log(`✅ SUCCESS: ${browserName} captured screenshot after 1 second`);

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `test-results/screenshot-${browserName}-3sec.png`,
      fullPage: false
    });
    console.log(`✅ SUCCESS: ${browserName} captured screenshot after 3 seconds`);

  } catch (error) {
    console.error(`❌ FAILED: ${browserName} crashed - ${error}`);
    throw error;
  }
});
