import { test } from '@playwright/test';

test.describe('Reposition Log - Capture console output', () => {
  test('should show repositioning logs', async ({ page }) => {
    const logs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[REPOSITION]') || text.includes('[COLLISION]') || text.includes('[SENSOR CALC]')) {
        console.log(text);
        logs.push(text);
      }
    });

    await page.goto('http://localhost:5174');

    await page.waitForFunction(
      () => typeof (window as any).gameState !== 'undefined',
      { timeout: 10000 }
    );

    // Wait for landing and repositioning
    await page.waitForTimeout(3000);

    console.log(`\nTotal reposition calls: ${logs.length}`);

    if (logs.length === 0) {
      console.log('❌ NO REPOSITIONING CALLS! adjustPositionToSurface never called!');
    }
  });
});
