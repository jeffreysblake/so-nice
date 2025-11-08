import { test } from '@playwright/test';
import * as fs from 'fs';

test('capture screenshots with CDP', async ({ page, browser }) => {
  console.log('Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Page loaded');

  await page.waitForTimeout(1000);

  // Use CDP to capture screenshot
  const context = browser.contexts()[0];
  const cdpSession = await context.newCDPSession(page);

  console.log('Taking screenshot 1...');
  const screenshot1 = await cdpSession.send('Page.captureScreenshot');
  fs.writeFileSync('test-results/cdp-screenshot-1.png', Buffer.from(screenshot1.data, 'base64'));
  console.log('✓ Screenshot 1 saved');

  await page.waitForTimeout(1000);

  console.log('Taking screenshot 2...');
  const screenshot2 = await cdpSession.send('Page.captureScreenshot');
  fs.writeFileSync('test-results/cdp-screenshot-2.png', Buffer.from(screenshot2.data, 'base64'));
  console.log('✓ Screenshot 2 saved');

  await page.waitForTimeout(1000);

  console.log('Taking screenshot 3...');
  const screenshot3 = await cdpSession.send('Page.captureScreenshot');
  fs.writeFileSync('test-results/cdp-screenshot-3.png', Buffer.from(screenshot3.data, 'base64'));
  console.log('✓ Screenshot 3 saved');

  console.log('\n✅ All screenshots captured successfully!');
});
