import { test, expect } from '@playwright/test';

test.describe('Authentic Level Loading Debug', () => {
  test('should load authentic GHZ layout and show console output', async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log('[BROWSER]', text);
    });

    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for level to load

    // Get game state
    const gameState = await page.evaluate(() => {
      return (window as any).gameState || null;
    });

    console.log('\n=== GAME STATE ===');
    if (gameState) {
      console.log(`Position: x=${gameState.x}, y=${gameState.y}`);
      console.log(`Grounded: ${gameState.isGrounded}`);
      console.log(`Y Velocity: ${gameState.yVelocity}`);
    } else {
      console.log('⚠️ Game state not found! Game may have failed to load.');
    }

    console.log('\n=== CONSOLE LOGS ===');
    const relevantLogs = logs.filter(log =>
      log.includes('authentic') ||
      log.includes('Chunks') ||
      log.includes('Tiles') ||
      log.includes('Layout') ||
      log.includes('Building')
    );
    relevantLogs.forEach(log => console.log(log));

    // Basic assertions
    expect(logs.some(log => log.includes('Loading'))).toBe(true);
  });
});
