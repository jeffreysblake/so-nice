const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs and errors
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('[CONSOLE]', text);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[ERROR]', error.message);
  });

  console.log('Loading game...');
  await page.goto('http://localhost:5174');

  // Wait a bit for game to load
  await page.waitForTimeout(5000);

  console.log('\n=== SUMMARY ===');
  console.log(`Logs: ${logs.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
  }

  // Take screenshot
  await page.screenshot({ path: 'chunk-render-test.png' });
  console.log('\nScreenshot saved to chunk-render-test.png');

  await page.waitForTimeout(2000);
  await browser.close();
})();
