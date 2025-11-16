const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Loading game...');
  await page.goto('http://localhost:5174');

  // Wait for canvas to appear
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('Canvas loaded!');

  // Wait for game to initialize
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'game-screenshot.png', fullPage: false });
  console.log('Screenshot saved to game-screenshot.png');

  // Get game state
  const gameState = await page.evaluate(() => {
    return window.gameState || null;
  });

  console.log('\n=== GAME STATE ===');
  console.log(`Position: x=${gameState?.x}, y=${gameState?.y}`);
  console.log(`Grounded: ${gameState?.isGrounded}`);
  console.log(`FPS: ${gameState?.fps}`);

  await browser.close();
})();
