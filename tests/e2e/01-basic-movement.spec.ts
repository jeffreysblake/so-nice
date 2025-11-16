import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for User Story 1.1: Walking and Running
 * Tests basic player movement controls and physics
 */
test.describe('Story 1.1: Walking and Running', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for Phaser game to initialize
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for game scene to be ready and gameState to be available
    await page.waitForTimeout(2000);

    // Verify gameState is available
    await page.waitForFunction(() => (window as any).gameState !== undefined);
  });

  test.afterEach(async ({ page }) => {
    // Explicitly close page to free resources
    await page.close();
  });

  test('should load the game and display canvas', async ({ page }) => {
    const canvas = await page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has expected dimensions
    const canvasElement = await canvas.boundingBox();
    expect(canvasElement).not.toBeNull();
    expect(canvasElement!.width).toBeGreaterThan(0);
    expect(canvasElement!.height).toBeGreaterThan(0);
  });

  test('should show player starting position in debug overlay', async ({ page }) => {
    // Wait for game state to update
    await page.waitForTimeout(500);

    // Check that game state shows position
    const gameState = await getGameState(page);
    expect(gameState.x).toBeGreaterThan(0);
    expect(gameState.y).toBeGreaterThan(0);
    expect(gameState.groundSpeed).toBeDefined();
  });

  test('should accelerate when holding right arrow', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    // Get initial ground speed
    const initialSpeed = await getGroundSpeed(page);

    // Hold right arrow for 60 frames (~1 second at 60 FPS, but allow for lower FPS)
    // Test environments can run at 15-30 FPS, so wait 2s to ensure sufficient frames
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000); // Increased to 2000ms to account for low FPS in test environments

    // Get new ground speed
    const newSpeed = await getGroundSpeed(page);

    await page.keyboard.up('ArrowRight');

    // Verify acceleration occurred
    expect(newSpeed).toBeGreaterThan(initialSpeed);
    expect(newSpeed).toBeGreaterThan(0);

    // Should be moving at appreciable speed after acceleration
    // Lower threshold (0.7) accounts for very low FPS in test environments (12-20 FPS)
    expect(newSpeed).toBeGreaterThan(0.7);
  });

  test('should decelerate when releasing arrow keys', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    // Accelerate to running speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);

    // Get speed while running
    const runningSpeed = await getGroundSpeed(page);

    // Release key
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(1000);

    // Get speed after deceleration
    const deceleratedSpeed = await getGroundSpeed(page);

    // Verify deceleration occurred
    expect(deceleratedSpeed).toBeLessThan(runningSpeed);
  });

  test('should not exceed top speed on flat ground', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    // Hold right arrow for extended time to reach top speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000); // 3 seconds

    // Get final speed
    const finalSpeed = await getGroundSpeed(page);

    await page.keyboard.up('ArrowRight');

    // Top speed should be capped at 6.0 px/frame on flat ground
    expect(finalSpeed).toBeLessThanOrEqual(6.1); // Small tolerance for floating point
  });

  test('should face the direction of movement', async ({ page }) => {
    // Wait for initial state
    await page.waitForTimeout(500);

    // Initially should be facing right
    let isFacingRight = await page.evaluate(() => (window as any).gameState.isFacingRight);
    expect(isFacingRight).toBe(true);

    // Move right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    // Should still be facing right
    isFacingRight = await page.evaluate(() => (window as any).gameState.isFacingRight);
    expect(isFacingRight).toBe(true);

    // Move left
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');

    // Should now be facing left
    isFacingRight = await page.evaluate(() => (window as any).gameState.isFacingRight);
    expect(isFacingRight).toBe(false);
  });
});

/**
 * Helper function to get game state from window object
 */
async function getGameState(page: Page): Promise<any> {
  return await page.evaluate(() => (window as any).gameState);
}

/**
 * Helper function to extract ground speed from game state
 */
async function getGroundSpeed(page: Page): number {
  const gameState = await getGameState(page);
  return Math.abs(gameState.groundSpeed);
}
