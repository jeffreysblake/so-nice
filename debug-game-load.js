// Simple script to load game and capture console output
const playwright = require('@playwright/test');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}]`, text);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
    console.error(error.stack);
  });

  console.log('🌐 Opening http://localhost:5174...\n');
  await page.goto('http://localhost:5174');

  console.log('\n⏳ Waiting 5 seconds...\n');
  await page.waitForTimeout(5000);

  // Check if gameState exists
  const hasGameState = await page.evaluate(() => {
    return typeof (window as any).gameState !== 'undefined';
  });

  console.log('\n✅ GameState exists:', hasGameState);

  if (hasGameState) {
    const playerPos = await page.evaluate(() => {
      const state = (window as any).gameState;
      return {
        x: state.player?.x,
        y: state.player?.y,
        grounded: state.player?.physicsState?.isGrounded
      };
    });
    console.log('📍 Player position:', playerPos);
  }

  console.log('\n✅ Browser will stay open for manual inspection...');
  console.log('   Press Ctrl+C to close\n');

  // Keep alive
  await new Promise(() => {});
})();
