import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Story 1.1: Walking and Running
 * Tests basic player movement controls and physics
 */
test.describe('Story 1.1: Walking and Running', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for Phaser game to initialize
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for game scene to be ready (check for debug text)
    await page.waitForTimeout(2000);
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
    // Enable debug mode by pressing 'D'
    await page.keyboard.press('d');

    // Wait for debug text to update
    await page.waitForTimeout(500);

    // Check that debug text shows position
    const debugText = await page.textContent('body');
    expect(debugText).toContain('Pos:');
    expect(debugText).toContain('Ground Speed:');
  });

  test('should accelerate when holding right arrow', async ({ page }) => {
    // Press D to enable debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    // Get initial ground speed
    let debugText = await page.textContent('body');
    const initialSpeed = extractGroundSpeed(debugText!);

    // Hold right arrow for 60 frames (~1 second)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);

    // Get new ground speed
    debugText = await page.textContent('body');
    const newSpeed = extractGroundSpeed(debugText!);

    await page.keyboard.up('ArrowRight');

    // Verify acceleration occurred
    expect(newSpeed).toBeGreaterThan(initialSpeed);
    expect(newSpeed).toBeGreaterThan(0);

    // Should be moving at appreciable speed after 1 second
    expect(newSpeed).toBeGreaterThan(1.0);
  });

  test('should decelerate when releasing arrow keys', async ({ page }) => {
    // Enable debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    // Accelerate to running speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);

    // Get speed while running
    let debugText = await page.textContent('body');
    const runningSpeed = extractGroundSpeed(debugText!);

    // Release key
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(1000);

    // Get speed after deceleration
    debugText = await page.textContent('body');
    const deceleratedSpeed = extractGroundSpeed(debugText!);

    // Verify deceleration occurred
    expect(deceleratedSpeed).toBeLessThan(runningSpeed);
  });

  test('should not exceed top speed on flat ground', async ({ page }) => {
    // Enable debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    // Hold right arrow for extended time to reach top speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000); // 3 seconds

    // Get final speed
    const debugText = await page.textContent('body');
    const finalSpeed = extractGroundSpeed(debugText!);

    await page.keyboard.up('ArrowRight');

    // Top speed should be capped at 6.0 px/frame on flat ground
    expect(finalSpeed).toBeLessThanOrEqual(6.1); // Small tolerance for floating point
  });

  test('should face the direction of movement', async ({ page }) => {
    // Enable debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    // Move right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    // Note: Direction checking would require reading the isFacingRight state
    // This is a placeholder for visual verification
    // In a full implementation, we could expose game state to window object for testing
  });
});

/**
 * Helper function to extract ground speed from debug text
 */
function extractGroundSpeed(debugText: string): number {
  const match = debugText.match(/Ground Speed:\s*([\d.-]+)/);
  if (match && match[1]) {
    return Math.abs(parseFloat(match[1]));
  }
  return 0;
}
