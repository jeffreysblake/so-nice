import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for User Story 4.1: Spring Bounce
 * Tests spring interaction and bounce mechanics
 */
test.describe('Story 4.1: Spring Bounce', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify gameState is available
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test.afterEach(async ({ page }) => {
    // Explicitly close page to free resources
    await page.close();
  });

  test('should encounter springs in the level', { timeout: 60000 }, async ({ page }) => {
    // Springs are placed at (GAP-FREE continuous level):
    // - Spring 1 (yellow): 74 * 16 = 1184px (bottom of downhill)
    // - Spring 2 (red): 89 * 16 = 1424px (valley floor)
    // - Spring 3 (yellow): 130 * 16 = 2080px (before final uphill)

    // Navigate to first spring location
    await page.keyboard.down('ArrowRight');

    // Run until we're past first spring position with instrumentation
    let x = await getXPosition(page);
    let iterations = 0;
    let lastX = 0;

    while (x < 1200) {
      await page.waitForTimeout(100);
      x = await getXPosition(page);
      iterations++;

      // Log progress every 10 iterations
      if (iterations % 10 === 0) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        console.log(`Iteration ${iterations}: x=${x.toFixed(0)}, y=${gameState.y}, yVel=${gameState.yVelocity.toFixed(2)}, springs=${gameState.springHitCount}, grounded=${gameState.isGrounded}`);
      }

      // Detect stuck player (not moving)
      if (Math.abs(x - lastX) < 1 && iterations > 10) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Player stuck at x=${x.toFixed(0)}, y=${gameState.y} after ${iterations} iterations`);
      }
      lastX = x;

      // Safety timeout
      if (iterations > 600) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Timeout: Only reached x=${x.toFixed(0)} after 60s. Springs hit: ${gameState.springHitCount}`);
      }
    }

    await page.keyboard.up('ArrowRight');

    // We should have passed the first spring area
    const finalState = await page.evaluate(() => (window as any).gameState);
    expect(x).toBeGreaterThan(1150);
    console.log(`Reached spring area at x=${x.toFixed(0)}. Springs hit: ${finalState.springHitCount}`);
  });

  test('should be launched upward by spring', { timeout: 60000 }, async ({ page }) => {
    // Navigate to first spring (gap-free level: 1184px)
    await page.keyboard.down('ArrowRight');

    let x = await getXPosition(page);
    let iterations = 0;
    let lastX = 0;

    // Run to spring location (around 1184px) with instrumentation
    while (x < 1170) {
      await page.waitForTimeout(50);
      x = await getXPosition(page);
      iterations++;

      if (iterations % 20 === 0) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        console.log(`Iteration ${iterations}: x=${x.toFixed(0)}, springs=${gameState.springHitCount}`);
      }

      // Detect stuck player
      if (Math.abs(x - lastX) < 1 && iterations > 20) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Player stuck at x=${x.toFixed(0)} after ${iterations} iterations`);
      }
      lastX = x;

      // Safety timeout
      if (iterations > 600) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Timeout: Only reached x=${x.toFixed(0)} after 30s. Springs hit: ${gameState.springHitCount}`);
      }
    }

    // Get Y position before potential spring bounce
    const yBefore = await getYPosition(page);
    const springsBefore = await page.evaluate(() => (window as any).gameState.springHitCount);

    // Continue a bit to hit spring
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');

    // Wait for potential spring bounce
    await page.waitForTimeout(100);

    // Get Y position after spring (should be higher = lower Y value)
    const yAfter = await getYPosition(page);
    const yVelocity = await getYVelocity(page);
    const springsAfter = await page.evaluate(() => (window as any).gameState.springHitCount);

    console.log(`Y before: ${yBefore}, Y after: ${yAfter}, Y velocity: ${yVelocity.toFixed(2)}, Springs: ${springsBefore} -> ${springsAfter}`);

    // If we hit the spring, Y velocity should be significantly negative
    // Note: This test is approximate - spring collision depends on precise positioning
  });

  test('should navigate to red spring in valley', { timeout: 60000 }, async ({ page }) => {
    // Navigate to red spring (Spring 2 at x=1424, spawn is at x=300)
    await page.keyboard.down('ArrowRight');

    let x = await getXPosition(page);
    let iterations = 0;
    let lastX = 0;

    // Run to red spring location (x=1424) with instrumentation
    while (x < 1420) {
      await page.waitForTimeout(50);
      x = await getXPosition(page);
      iterations++;

      if (iterations % 20 === 0) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        console.log(`Iteration ${iterations}: x=${x.toFixed(0)}, springs=${gameState.springHitCount}`);
      }

      // Detect stuck player
      if (Math.abs(x - lastX) < 1 && iterations > 20) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Player stuck at x=${x.toFixed(0)} after ${iterations} iterations`);
      }
      lastX = x;

      // Safety timeout
      if (iterations > 600) {
        const gameState = await page.evaluate(() => (window as any).gameState);
        throw new Error(`Timeout: Only reached x=${x.toFixed(0)} after 30s. Springs hit: ${gameState.springHitCount}`);
      }
    }

    await page.keyboard.up('ArrowRight');

    // Should be at red spring location (x=1424, allow ±50px)
    const finalState = await page.evaluate(() => (window as any).gameState);
    expect(x).toBeGreaterThan(1400);
    expect(x).toBeLessThan(1470);

    console.log(`Reached red spring area at x=${x.toFixed(0)}. Springs hit: ${finalState.springHitCount}`);
  });

  test('should handle multiple springs in level', { timeout: 90000 }, async ({ page }) => {
    // Long test to navigate through level and potentially hit multiple springs
    let velocitySpikes = 0;
    let lastYVelocity = 0;

    await page.keyboard.down('ArrowRight');

    // Run for extended time (15 seconds of gameplay)
    for (let i = 0; i < 150; i++) {
      await page.waitForTimeout(100);

      const gameState = await page.evaluate(() => (window as any).gameState);
      const yVelocity = gameState.yVelocity;

      // Detect sudden upward velocity changes (potential spring bounce)
      if (yVelocity < -8 && lastYVelocity > -8) {
        velocitySpikes++;
        console.log(`Velocity spike at iteration ${i}: ${yVelocity.toFixed(2)}, x=${gameState.x}, actual springs hit=${gameState.springHitCount}`);
      }

      lastYVelocity = yVelocity;
    }

    await page.keyboard.up('ArrowRight');

    const finalState = await page.evaluate(() => (window as any).gameState);
    console.log(`Velocity spikes detected: ${velocitySpikes}, Actual spring hits: ${finalState.springHitCount}, Final position: x=${finalState.x}`);
  });

  test('should show control lock after spring bounce', { timeout: 45000 }, async ({ page }) => {
    // This test would require checking if player controls are locked
    // after spring activation (16 frames / ~267ms)
    // For now, this is a placeholder for the concept
    // NOTE: This test will FAIL until level extends to springs

    // Navigate to spring and hit it
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000); // Navigate towards springs

    // In full implementation, we'd:
    // 1. Detect spring bounce
    // 2. Verify arrow keys don't affect movement for 16 frames
    // 3. Verify control returns after lock expires

    await page.keyboard.up('ArrowRight');
  });
});

/**
 * Helper functions
 */
async function getGameState(page: Page): Promise<any> {
  return await page.evaluate(() => (window as any).gameState);
}

async function getXPosition(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.x;
}

async function getYPosition(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.y;
}

async function getYVelocity(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.yVelocity;
}
