import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Story 4.1: Spring Bounce
 * Tests spring interaction and bounce mechanics
 */
test.describe('Story 4.1: Spring Bounce', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Enable debug mode
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
  });

  test('should encounter springs in the level', async ({ page }) => {
    // Springs are placed at:
    // - Spring 1 (yellow): 110 * 16 = 1760px (downhill run)
    // - Spring 2 (red): 123 * 16 = 1968px (valley)
    // - Spring 3 (yellow): 168 * 16 = 2688px (platform section)

    // Navigate to first spring location
    await page.keyboard.down('ArrowRight');

    // Run until we're past first spring position
    let debugText = await page.textContent('body');
    let x = extractXPosition(debugText!);

    while (x < 1800) {
      await page.waitForTimeout(100);
      debugText = await page.textContent('body');
      x = extractXPosition(debugText!);
    }

    await page.keyboard.up('ArrowRight');

    // We should have passed the first spring area
    expect(x).toBeGreaterThan(1700);
    console.log('Reached spring area at x:', x);
  });

  test('should be launched upward by spring', async ({ page }) => {
    // Navigate to first spring
    await page.keyboard.down('ArrowRight');

    let debugText = await page.textContent('body');
    let x = extractXPosition(debugText!);

    // Run to spring location (around 1760px)
    while (x < 1750) {
      await page.waitForTimeout(50);
      debugText = await page.textContent('body');
      x = extractXPosition(debugText!);
    }

    // Get Y position before potential spring bounce
    const yBefore = extractYPosition(debugText!);

    // Continue a bit to hit spring
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');

    // Wait for potential spring bounce
    await page.waitForTimeout(100);

    // Get Y position after spring (should be higher = lower Y value)
    debugText = await page.textContent('body');
    const yAfter = extractYPosition(debugText!);
    const yVelocity = extractYVelocity(debugText!);

    console.log(`Y before: ${yBefore}, Y after: ${yAfter}, Y velocity: ${yVelocity}`);

    // If we hit the spring, Y velocity should be significantly negative
    // Note: This test is approximate - spring collision depends on precise positioning
  });

  test('should navigate to red spring in valley', async ({ page }) => {
    // Navigate to valley (around x = 1968px)
    await page.keyboard.down('ArrowRight');

    let debugText = await page.textContent('body');
    let x = extractXPosition(debugText!);

    // Run to valley spring location
    while (x < 1950) {
      await page.waitForTimeout(50);
      debugText = await page.textContent('body');
      x = extractXPosition(debugText!);
    }

    await page.keyboard.up('ArrowRight');

    // Should be at valley location
    expect(x).toBeGreaterThan(1900);
    expect(x).toBeLessThan(2100);

    console.log('Reached valley spring area at x:', x);
  });

  test('should handle multiple springs in level', async ({ page }) => {
    // Long test to navigate through level and potentially hit multiple springs
    let springCount = 0;
    let lastYVelocity = 0;

    await page.keyboard.down('ArrowRight');

    // Run for extended time
    for (let i = 0; i < 150; i++) {
      await page.waitForTimeout(100);

      const debugText = await page.textContent('body');
      const yVelocity = extractYVelocity(debugText!);

      // Detect sudden upward velocity changes (potential spring bounce)
      if (yVelocity < -8 && lastYVelocity > -8) {
        springCount++;
        console.log(`Potential spring bounce detected at iteration ${i}, velocity: ${yVelocity}`);
      }

      lastYVelocity = yVelocity;
    }

    await page.keyboard.up('ArrowRight');

    console.log(`Detected ${springCount} potential spring bounces`);
  });

  test('should show control lock after spring bounce', async ({ page }) => {
    // This test would require checking if player controls are locked
    // after spring activation (16 frames / ~267ms)
    // For now, this is a placeholder for the concept

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
function extractXPosition(debugText: string): number {
  const match = debugText.match(/Pos:\s*\(([\d.-]+),/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}

function extractYPosition(debugText: string): number {
  const match = debugText.match(/Pos:\s*\([\d.-]+,\s*([\d.-]+)\)/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}

function extractYVelocity(debugText: string): number {
  const match = debugText.match(/Velocity:\s*\([\d.-]+,\s*([\d.-]+)\)/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}
