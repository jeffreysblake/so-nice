import { test, expect, Page } from '@playwright/test';

/**
 * Diagnostic test to trace landing behavior
 */
test.describe('Landing Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('trace landing from jump', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    const initialState = await page.evaluate(() => (window as any).gameState);
    console.log('Initial (grounded):', { y: initialState.y, isGrounded: initialState.isGrounded });

    // Jump
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    const afterJump = await page.evaluate(() => (window as any).gameState);
    console.log('After jump (100ms):', { y: afterJump.y, isGrounded: afterJump.isGrounded, yVelocity: afterJump.yVelocity });
    expect(afterJump.isGrounded).toBe(false);

    // Sample every 100ms until landed or timeout
    let landed = false;
    let samples = 0;
    const maxSamples = 30; // 3 seconds max

    while (!landed && samples < maxSamples) {
      await page.waitForTimeout(100);
      samples++;

      const state = await page.evaluate(() => (window as any).gameState);
      console.log(`Sample ${samples} (${100 + samples*100}ms):`, {
        y: state.y.toFixed(2),
        isGrounded: state.isGrounded,
        yVelocity: state.yVelocity.toFixed(3)
      });

      if (state.isGrounded) {
        landed = true;
        console.log(`*** LANDED at ${100 + samples*100}ms ***`);
      }
    }

    // Check state at the time specified in failing test (1600ms after jump)
    if (samples < 15) {
      await page.waitForTimeout((15 - samples) * 100);
    }

    const at1600ms = await page.evaluate(() => (window as any).gameState);
    console.log('At 1600ms after jump:', {
      y: at1600ms.y.toFixed(2),
      isGrounded: at1600ms.isGrounded,
      yVelocity: at1600ms.yVelocity.toFixed(3)
    });

    expect(at1600ms.isGrounded).toBe(true);
  });
});
