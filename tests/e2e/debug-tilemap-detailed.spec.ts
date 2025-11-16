import { test } from '@playwright/test';

test('Debug tilemap rendering with errors', async ({ page }) => {
  test.setTimeout(60000);

  // Capture console logs AND errors
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);
    console.log(`${msg.type()}: ${text}`);
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    logs.push(`PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5174');

  // Wait for game to initialize
  await page.waitForTimeout(8000);

  console.log('\n=== RENDER TERRAIN LOGS ===');
  const renderLogs = logs.filter(log =>
    log.includes('renderTerrain') ||
    log.includes('Tilemap') ||
    log.includes('tileset') ||
    log.includes('tilemap') ||
    log.includes('tile layer')
  );
  renderLogs.forEach(log => console.log(log));
  console.log('=== END ===\n');
});
