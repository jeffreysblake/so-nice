import { test, expect } from '@playwright/test';

test.describe('Collision Tolerance Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('should log sensor results at x=500-600', async ({ page }) => {
    // Enable keyboard inputs
    await page.keyboard.down('ArrowRight');

    let iterations = 0;
    let lastX = 0;

    while (iterations < 200) {
      await page.waitForTimeout(50);
      iterations++;

      const gameState = await page.evaluate(() => {
        const state = (window as any).gameState;
        return {
          x: state.x,
          y: state.y,
          grounded: state.isGrounded,
          yVel: state.yVelocity
        };
      });

      // Log when entering the problem zone
      if (gameState.x >= 500 && gameState.x <= 650) {
        if (iterations % 5 === 0) {
          console.log(`[${iterations}] x=${Math.round(gameState.x)}, y=${Math.round(gameState.y)}, grounded=${gameState.grounded}, yVel=${gameState.yVel.toFixed(2)}`);
        }
      }

      // Check if stuck
      if (Math.abs(gameState.x - lastX) < 1 && iterations > 20) {
        console.log(`\n🛑 STUCK at x=${Math.round(gameState.x)}, y=${Math.round(gameState.y)}`);
        break;
      }

      lastX = gameState.x;

      // Exit after passing the problem zone
      if (gameState.x > 650) {
        console.log(`\n✅ Successfully passed x=500-650 zone, now at x=${Math.round(gameState.x)}`);
        break;
      }
    }

    expect(lastX).toBeGreaterThan(600);
  });
});
