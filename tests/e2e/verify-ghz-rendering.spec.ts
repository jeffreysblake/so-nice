import { test, expect } from '@playwright/test';

test('Verify GHZ rendering', async ({ page }) => {
  const consoleMessages: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  await page.goto('http://localhost:5174');

  // Wait for the terrain to be rendered
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas !== null;
  }, { timeout: 10000 });

  // Wait a bit more for rendering to complete
  await page.waitForTimeout(4000);

  // Check if terrain was rendered
  const terrainRendered = consoleMessages.some(msg =>
    msg.includes('Authentic GHZ terrain rendered')
  );

  console.log('Terrain rendered:', terrainRendered);

  // Check if blocks were loaded
  const blocksLoaded = consoleMessages.find(msg =>
    msg.includes('Loaded') && msg.includes('blocks')
  );

  console.log('Blocks loaded:', blocksLoaded);

  // Get the final message about rendering
  const renderingMsg = consoleMessages.find(msg =>
    msg.includes('Authentic GHZ terrain rendered')
  );

  console.log('Rendering message:', renderingMsg);

  expect(terrainRendered).toBeTruthy();
});
