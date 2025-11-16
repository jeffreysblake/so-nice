import { test, expect, Page } from '@playwright/test';

/**
 * Diagnostic test to trace acceleration behavior
 */
test.describe('Acceleration Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('trace acceleration over time', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    const initialState = await page.evaluate(() => (window as any).gameState);
    console.log('Initial:', {
      groundSpeed: initialState.groundSpeed,
      fps: initialState.fps,
      isGrounded: initialState.isGrounded
    });

    // Hold right arrow
    await page.keyboard.down('ArrowRight');

    // Sample every 100ms for 2 seconds
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => (window as any).gameState);
      console.log(`Sample ${i+1} (${(i+1)*100}ms):`, {
        speed: state.groundSpeed.toFixed(3),
        fps: state.fps,
        isGrounded: state.isGrounded,
        x: state.x
      });
    }

    await page.keyboard.up('ArrowRight');

    // Get final state
    const finalState = await page.evaluate(() => (window as any).gameState);
    console.log('Final (after 2s):', {
      groundSpeed: finalState.groundSpeed.toFixed(3),
      fps: finalState.fps
    });

    // After 1.5s at 60 FPS with acceleration 0.046875/frame
    // Expected: ~4.2 px/frame (90 frames * 0.046875)
    // Minimum acceptable: > 1.0
    expect(finalState.groundSpeed).toBeGreaterThan(1.0);
  });
});
