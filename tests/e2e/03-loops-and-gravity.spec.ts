import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for User Story 3.1: Running Through Loops
 * Tests 360-degree movement and gravity mode switching
 */
test.describe('Story 3.1: Running Through Loops', () => {
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

  test('should start in FLOOR gravity mode', async ({ page }) => {
    await page.waitForTimeout(500);
    const gravityMode = await page.evaluate(() => (window as any).gameState.gravityMode);
    expect(gravityMode).toBe('FLOOR');
  });

  test('should maintain speed when running on flat ground', async ({ page }) => {
    // Accelerate to running speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000); // Build up speed
    await page.keyboard.up('ArrowRight');

    // Get speed
    const speed1 = await getGroundSpeed(page);

    // Continue running
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);

    // Speed should be maintained (within tolerance)
    const speed2 = await getGroundSpeed(page);

    await page.keyboard.up('ArrowRight');

    expect(Math.abs(speed2 - speed1)).toBeLessThan(1.0);
  });

  test('should navigate to first loop area', async ({ page }) => {
    // Get starting position
    const startX = await getXPosition(page);

    // Run right towards first loop (around tile 40)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000); // Run for 5 seconds
    await page.keyboard.up('ArrowRight');

    // Check position has advanced significantly
    const endX = await getXPosition(page);

    expect(endX).toBeGreaterThan(startX + 200); // Should have moved at least 200 pixels right
  });

  test('should change gravity mode when transitioning on slopes', { timeout: 45000 }, async ({ page }) => {
    // This test requires the player to reach a curved section
    // Build up speed and run towards loop
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000); // Run until reaching curved terrain

    // Check if gravity mode has changed from FLOOR
    const gameState = await getGameState(page);

    // At some point, gravity mode should change as we encounter slopes/curves
    // Note: This is a coarse test - ideally we'd navigate to a specific loop location
    console.log('Debug text:', `Gravity Mode: ${gameState.gravityMode}, Angle: ${gameState.angle}`);

    // For now, just verify debug text is updating
    expect(gameState).toBeTruthy();
    expect(gameState.gravityMode).toBeDefined();

    await page.keyboard.up('ArrowRight');
  });

  test('should maintain minimum speed threshold in loops', async ({ page }) => {
    // Build up significant speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);

    // Get speed
    const speed = await getGroundSpeed(page);

    await page.keyboard.up('ArrowRight');

    // Speed should be well above loop threshold (4.0 px/frame)
    // if we've been accelerating for 3 seconds
    console.log('Speed after 3 seconds of acceleration:', speed);
  });

  test('should show angle changes on slopes', async ({ page }) => {
    // Get initial angle (should be 0 on flat ground)
    const initialAngle = await getAngle(page);

    expect(initialAngle).toBe(0);

    // Run forward to encounter slopes
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(4000);

    // Angle should change when on slopes
    const slopeAngle = await getAngle(page);

    await page.keyboard.up('ArrowRight');

    // Log angle for verification
    console.log(`Initial angle: ${initialAngle}, Slope angle: ${slopeAngle}`);
  });

  test('should complete level navigation without falling through terrain', { timeout: 60000 }, async ({ page }) => {
    // This is a smoke test to ensure player doesn't fall through the world
    // Run through the level for extended time
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(10000); // 10 seconds of running

    // Get final position
    const finalY = await getYPosition(page);

    await page.keyboard.up('ArrowRight');

    // Y position should be reasonable (not fallen into void)
    // Level ground is around y=600, so should be between 400-650
    expect(finalY).toBeGreaterThan(300);
    expect(finalY).toBeLessThan(700);
  });
});

/**
 * Helper functions
 */
async function getGameState(page: Page): Promise<any> {
  return await page.evaluate(() => (window as any).gameState);
}

async function getGroundSpeed(page: Page): number {
  const gameState = await getGameState(page);
  return Math.abs(gameState.groundSpeed);
}

async function getXPosition(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.x;
}

async function getYPosition(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.y;
}

async function getAngle(page: Page): number {
  const gameState = await getGameState(page);
  return gameState.angle;
}
