import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

/**
 * UI/UX Visual Verification Tests
 *
 * These tests capture screenshots and verify the actual state of the game
 * to validate claims about implementation and identify visual/gameplay issues.
 */

test.describe('Visual State and UI/UX Verification', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:5173');

    // Wait for game to load
    await page.waitForTimeout(3000);
  });

  test('should capture initial game state screenshot', async () => {
    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/screenshots/01-initial-state.png',
      fullPage: true
    });

    // Check if canvas is visible
    const canvas = await page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should verify Sonic sprite loads correctly', async () => {
    await page.waitForTimeout(2000);

    // Take screenshot of player area
    await page.screenshot({
      path: 'test-results/screenshots/02-player-sprite.png',
      fullPage: true
    });

    // Get debug text to verify player state
    const debugText = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'Canvas not found';

      // Try to read debug info from screen
      return 'Debug info check - see screenshot';
    });

    console.log('Player state:', debugText);
  });

  test('should verify HUD elements are visible', async () => {
    await page.waitForTimeout(2000);

    // Screenshot showing HUD
    await page.screenshot({
      path: 'test-results/screenshots/03-hud-display.png',
      fullPage: true
    });

    // The HUD should show SCORE, TIME, RINGS, LIVES
    // Visual verification via screenshot
  });

  test('should test basic movement and capture movement screenshots', async () => {
    await page.waitForTimeout(2000);

    // Screenshot before movement
    await page.screenshot({
      path: 'test-results/screenshots/04-before-movement.png',
      fullPage: true
    });

    // Move right for 2 seconds
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    // Screenshot after movement
    await page.screenshot({
      path: 'test-results/screenshots/05-after-movement-right.png',
      fullPage: true
    });

    await page.waitForTimeout(500);
  });

  test('should test jump functionality and verify it works', async () => {
    await page.waitForTimeout(2000);

    // Screenshot before jump
    await page.screenshot({
      path: 'test-results/screenshots/06-before-jump.png',
      fullPage: true
    });

    // Try to jump
    await page.keyboard.press('z');
    await page.waitForTimeout(500);

    // Screenshot during/after jump
    await page.screenshot({
      path: 'test-results/screenshots/07-during-jump.png',
      fullPage: true
    });

    await page.waitForTimeout(1000);

    // Screenshot after landing
    await page.screenshot({
      path: 'test-results/screenshots/08-after-jump.png',
      fullPage: true
    });
  });

  test('should verify enemy positions and behavior', async () => {
    await page.waitForTimeout(2000);

    // Move to where enemies should be
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000); // Move for 5 seconds
    await page.keyboard.up('ArrowRight');

    // Screenshot showing enemies
    await page.screenshot({
      path: 'test-results/screenshots/09-enemy-encounter.png',
      fullPage: true
    });

    await page.waitForTimeout(2000);

    // Screenshot showing enemy movement
    await page.screenshot({
      path: 'test-results/screenshots/10-enemy-movement.png',
      fullPage: true
    });
  });

  test('should verify ring collection', async () => {
    await page.waitForTimeout(2000);

    // Move to collect rings
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');

    // Screenshot after collecting rings
    await page.screenshot({
      path: 'test-results/screenshots/11-ring-collection.png',
      fullPage: true
    });
  });

  test('should explore the level and verify size', async () => {
    await page.waitForTimeout(2000);

    // Move right for extended time to see level size
    await page.keyboard.down('ArrowRight');

    // Take screenshots at intervals
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: `test-results/screenshots/12-level-exploration-${i}.png`,
        fullPage: true
      });
    }

    await page.keyboard.up('ArrowRight');

    // Final position screenshot
    await page.screenshot({
      path: 'test-results/screenshots/13-level-end-position.png',
      fullPage: true
    });
  });

  test('should verify terrain and tileset visual quality', async () => {
    await page.waitForTimeout(2000);

    // Take close-up screenshots of terrain
    await page.screenshot({
      path: 'test-results/screenshots/14-terrain-tileset.png',
      fullPage: true
    });

    // Move to different terrain sections
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/screenshots/15-terrain-mid-level.png',
      fullPage: true
    });
  });

  test('should test loop-de-loop functionality', async () => {
    await page.waitForTimeout(2000);

    // Move to loop area (if exists)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000); // Move towards loop
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/screenshots/16-loop-approach.png',
      fullPage: true
    });

    // Try to go through loop with momentum
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/screenshots/17-loop-traversal.png',
      fullPage: true
    });
  });

  test('should verify springs and special objects', async () => {
    await page.waitForTimeout(2000);

    // Move to spring location
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(10000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/screenshots/18-spring-location.png',
      fullPage: true
    });

    // Try to use spring (if visible)
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'test-results/screenshots/19-spring-interaction.png',
      fullPage: true
    });
  });
});

test.describe('Level Completion User Story', () => {
  test('User Story: Player should be able to complete the level from start to finish', async ({ page }) => {
    // Start game
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'test-results/screenshots/20-level-start.png',
      fullPage: true
    });

    console.log('Starting level completion attempt...');

    // Attempt to traverse the entire level
    let completionAttempt = 0;
    const maxAttempts = 30; // 60 seconds of movement

    while (completionAttempt < maxAttempts) {
      // Move right
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(1000);

      // Try jumping occasionally to overcome obstacles
      if (completionAttempt % 5 === 0) {
        await page.keyboard.press('z');
        await page.waitForTimeout(200);
      }

      await page.keyboard.up('ArrowRight');
      await page.waitForTimeout(200);

      // Take periodic screenshots
      if (completionAttempt % 5 === 0) {
        await page.screenshot({
          path: `test-results/screenshots/21-completion-progress-${completionAttempt}.png`,
          fullPage: true
        });
      }

      completionAttempt++;
    }

    // Final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/22-level-completion-final.png',
      fullPage: true
    });

    console.log('Level completion attempt finished. Check screenshots for results.');
  });

  test('should verify goal post is visible and reachable', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Try to reach the goal post
    for (let i = 0; i < 40; i++) {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(500);
      await page.keyboard.up('ArrowRight');

      if (i % 10 === 0) {
        await page.screenshot({
          path: `test-results/screenshots/23-goal-search-${i}.png`,
          fullPage: true
        });
      }
    }

    await page.screenshot({
      path: 'test-results/screenshots/24-goal-post-location.png',
      fullPage: true
    });
  });
});

test.describe('Critical Bug Documentation', () => {
  test('should document continuous jumping bug', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Don't press any keys - observe if player jumps continuously
    await page.screenshot({
      path: 'test-results/screenshots/25-continuous-jump-bug-1.png',
      fullPage: true
    });

    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'test-results/screenshots/25-continuous-jump-bug-2.png',
      fullPage: true
    });

    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'test-results/screenshots/25-continuous-jump-bug-3.png',
      fullPage: true
    });

    console.log('Continuous jump bug documentation complete. Check if player Y position changes without input.');
  });

  test('should measure and document enemy speed', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Move to enemy location
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(7000);
    await page.keyboard.up('ArrowRight');

    // Take rapid screenshots to capture enemy movement
    for (let i = 0; i < 5; i++) {
      await page.screenshot({
        path: `test-results/screenshots/26-enemy-speed-${i}.png`,
        fullPage: true
      });
      await page.waitForTimeout(500);
    }

    console.log('Enemy speed documentation complete. Measure enemy position delta between screenshots.');
  });

  test('should document visible level boundaries', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Move right to find level boundary
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(15000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/screenshots/27-level-right-boundary.png',
      fullPage: true
    });

    // Try to move left to start
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(15000);
    await page.keyboard.up('ArrowLeft');

    await page.screenshot({
      path: 'test-results/screenshots/28-level-left-boundary.png',
      fullPage: true
    });

    console.log('Level boundary documentation complete. Check actual playable area size.');
  });
});
