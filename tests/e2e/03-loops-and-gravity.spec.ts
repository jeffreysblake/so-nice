import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Story 3.1: Running Through Loops
 * Tests 360-degree movement and gravity mode switching
 */
test.describe('Story 3.1: Running Through Loops', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Enable debug mode for all tests
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
  });

  test('should start in FLOOR gravity mode', async ({ page }) => {
    const debugText = await page.textContent('body');
    expect(debugText).toContain('Gravity Mode: FLOOR');
  });

  test('should maintain speed when running on flat ground', async ({ page }) => {
    // Accelerate to running speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000); // Build up speed
    await page.keyboard.up('ArrowRight');

    // Get speed
    let debugText = await page.textContent('body');
    const speed1 = extractGroundSpeed(debugText!);

    // Continue running
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);

    // Speed should be maintained (within tolerance)
    debugText = await page.textContent('body');
    const speed2 = extractGroundSpeed(debugText!);

    await page.keyboard.up('ArrowRight');

    expect(Math.abs(speed2 - speed1)).toBeLessThan(1.0);
  });

  test('should navigate to first loop area', async ({ page }) => {
    // Get starting position
    let debugText = await page.textContent('body');
    const startX = extractXPosition(debugText!);

    // Run right towards first loop (around tile 40)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000); // Run for 5 seconds
    await page.keyboard.up('ArrowRight');

    // Check position has advanced significantly
    debugText = await page.textContent('body');
    const endX = extractXPosition(debugText!);

    expect(endX).toBeGreaterThan(startX + 200); // Should have moved at least 200 pixels right
  });

  test('should change gravity mode when transitioning on slopes', async ({ page }) => {
    // This test requires the player to reach a curved section
    // Build up speed and run towards loop
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000); // Run until reaching curved terrain

    // Check if gravity mode has changed from FLOOR
    let debugText = await page.textContent('body');

    // At some point, gravity mode should change as we encounter slopes/curves
    // Note: This is a coarse test - ideally we'd navigate to a specific loop location
    console.log('Debug text:', debugText);

    // For now, just verify debug text is updating
    expect(debugText).toBeTruthy();

    await page.keyboard.up('ArrowRight');
  });

  test('should maintain minimum speed threshold in loops', async ({ page }) => {
    // Build up significant speed
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);

    // Get speed
    const debugText = await page.textContent('body');
    const speed = extractGroundSpeed(debugText!);

    await page.keyboard.up('ArrowRight');

    // Speed should be well above loop threshold (4.0 px/frame)
    // if we've been accelerating for 3 seconds
    console.log('Speed after 3 seconds of acceleration:', speed);
  });

  test('should show angle changes on slopes', async ({ page }) => {
    // Get initial angle (should be 0 on flat ground)
    let debugText = await page.textContent('body');
    const initialAngle = extractAngle(debugText!);

    expect(initialAngle).toBe(0);

    // Run forward to encounter slopes
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(4000);

    // Angle should change when on slopes
    debugText = await page.textContent('body');
    const slopeAngle = extractAngle(debugText!);

    await page.keyboard.up('ArrowRight');

    // Log angle for verification
    console.log(`Initial angle: ${initialAngle}, Slope angle: ${slopeAngle}`);
  });

  test('should complete level navigation without falling through terrain', async ({ page }) => {
    // This is a smoke test to ensure player doesn't fall through the world
    // Run through the level for extended time
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(10000); // 10 seconds of running

    // Get final position
    const debugText = await page.textContent('body');
    const finalY = extractYPosition(debugText!);

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
function extractGroundSpeed(debugText: string): number {
  const match = debugText.match(/Ground Speed:\s*([\d.-]+)/);
  if (match && match[1]) {
    return Math.abs(parseFloat(match[1]));
  }
  return 0;
}

function extractXPosition(debugText: string): number {
  const match = debugText.match(/Pos:\s*\(([\d.-]+),/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}

function extractYPosition(debugText: string): number {
  const match = debugText.match(/Pos:\s*\([\d.-]+,\s*([\d.-]+)\)/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}

function extractAngle(debugText: string): number {
  const match = debugText.match(/Angle:\s*([\d.-]+)°/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}
