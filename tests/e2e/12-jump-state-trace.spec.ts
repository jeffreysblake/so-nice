import { test, expect, Page } from '@playwright/test';

/**
 * Diagnostic test to trace jump state changes frame-by-frame
 */
test.describe('Jump State Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('trace isGrounded state during jump', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    // Get initial state
    const initialState = await page.evaluate(() => (window as any).gameState);
    console.log('Initial:', { y: initialState.y, isGrounded: initialState.isGrounded, yVelocity: initialState.yVelocity });
    expect(initialState.isGrounded).toBe(true);

    // Press jump
    await page.keyboard.press('z');

    // Sample state every 50ms for 1 second
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(50);
      const state = await page.evaluate(() => (window as any).gameState);
      console.log(`Frame ${i+1} (${(i+1)*50}ms):`, {
        y: state.y.toFixed(2),
        isGrounded: state.isGrounded,
        yVelocity: state.yVelocity.toFixed(3),
        isJumping: state.isJumping
      });
    }

    // Check specific timepoints mentioned in failing tests
    await page.keyboard.press('z');
    await page.waitForTimeout(200);
    const at200ms = await page.evaluate(() => (window as any).gameState);
    console.log('At 200ms after second jump:', {
      y: at200ms.y.toFixed(2),
      isGrounded: at200ms.isGrounded,
      yVelocity: at200ms.yVelocity.toFixed(3)
    });
  });
});
