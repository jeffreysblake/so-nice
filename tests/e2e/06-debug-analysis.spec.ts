import { test, expect } from '@playwright/test';

/**
 * Debug Analysis Tests - Optimized for Claude's image review
 *
 * Takes screenshots at specific intervals to diagnose bugs:
 * - Player sprite loading
 * - Continuous jumping
 * - Enemy speed
 * - Level boundaries
 * - Jump functionality
 */

test.describe('Debug Analysis with Screenshots', () => {
  test('ANALYSIS 1: Initial state and sprite loading', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for game to fully load
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/debug/01-initial-state.png',
      fullPage: false
    });

    console.log('✓ Screenshot 1: Initial game state captured');

    // Wait a bit more to see if anything changes
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'test-results/debug/02-after-1sec.png',
      fullPage: false
    });

    console.log('✓ Screenshot 2: After 1 second');

    // Check if player is moving/jumping without input
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/debug/03-after-3sec-no-input.png',
      fullPage: false
    });

    console.log('✓ Screenshot 3: After 3 seconds (no input)');
  });

  test('ANALYSIS 2: Continuous jumping bug - frame by frame', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Take 10 screenshots in rapid succession to see if player is jumping
    console.log('Taking rapid screenshots to detect continuous jumping...');

    for (let i = 0; i < 10; i++) {
      await page.screenshot({
        path: `test-results/debug/04-jump-test-frame-${i}.png`,
        fullPage: false
      });

      await page.waitForTimeout(200); // 200ms between shots = 5 fps
    }

    console.log('✓ 10 frames captured - check Y position of player');
  });

  test('ANALYSIS 3: Player sprite - is it Sonic or a box?', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Full page screenshot to see entire game
    await page.screenshot({
      path: 'test-results/debug/05-full-game-view.png',
      fullPage: true
    });

    // Zoomed view of player area (center of screen)
    await page.screenshot({
      path: 'test-results/debug/06-player-closeup.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    console.log('✓ Player sprite screenshots captured');
  });

  test('ANALYSIS 4: Enemy speed measurement', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('Moving to enemy location...');

    // Move right to reach enemies (should be around x=30*16 = 480px)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/07-enemy-initial.png',
      fullPage: false
    });

    // Take rapid screenshots to measure enemy speed
    console.log('Measuring enemy speed...');

    for (let i = 0; i < 10; i++) {
      await page.screenshot({
        path: `test-results/debug/08-enemy-speed-${i}.png`,
        fullPage: false
      });

      await page.waitForTimeout(200);
    }

    console.log('✓ Enemy speed screenshots captured - measure pixel delta');
  });

  test('ANALYSIS 5: Jump functionality test', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Before jump
    await page.screenshot({
      path: 'test-results/debug/09-before-jump.png',
      fullPage: false
    });

    console.log('Pressing Z to jump...');

    // Press jump
    await page.keyboard.press('z');

    // Capture jump arc frame by frame
    for (let i = 0; i < 20; i++) {
      await page.screenshot({
        path: `test-results/debug/10-jump-arc-${i}.png`,
        fullPage: false
      });

      await page.waitForTimeout(50); // 50ms = 20 fps
    }

    console.log('✓ Jump arc captured - 20 frames over 1 second');
  });

  test('ANALYSIS 6: HUD visibility and updates', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Capture HUD area (top-left corner)
    await page.screenshot({
      path: 'test-results/debug/11-hud-initial.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 600, height: 100 }
    });

    // Move for 5 seconds and check if timer updates
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/12-hud-after-5sec.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 600, height: 100 }
    });

    console.log('✓ HUD screenshots - check if TIME updates');
  });

  test('ANALYSIS 7: Level size measurement', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('Measuring level size - moving right for 15 seconds...');

    // Move right continuously for 15 seconds
    await page.keyboard.down('ArrowRight');

    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);

      if (i % 5 === 0) {
        await page.screenshot({
          path: `test-results/debug/13-level-size-${i}sec.png`,
          fullPage: false
        });
      }
    }

    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/14-level-right-edge.png',
      fullPage: false
    });

    console.log('✓ Level size screenshots - check camera bounds and position');
  });

  test('ANALYSIS 8: Terrain and tileset quality', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Initial terrain view
    await page.screenshot({
      path: 'test-results/debug/15-terrain-start.png',
      fullPage: true
    });

    // Move to different sections
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/16-terrain-section1.png',
      fullPage: true
    });

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/17-terrain-section2.png',
      fullPage: true
    });

    console.log('✓ Terrain screenshots - compare to actual Green Hill Zone');
  });

  test('ANALYSIS 9: Ring collection visual test', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Move to first rings
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/18-rings-before.png',
      fullPage: false
    });

    // Continue moving to collect
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/19-rings-after.png',
      fullPage: false
    });

    console.log('✓ Ring collection - check if RINGS count increases in HUD');
  });

  test('ANALYSIS 10: Debug overlay check', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Press D to toggle debug mode
    console.log('Pressing D to toggle debug mode...');
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/debug/20-debug-overlay.png',
      fullPage: false
    });

    console.log('✓ Debug overlay screenshot - check if debug text is visible');
  });
});

test.describe('Specific Bug Reproduction', () => {
  test('BUG REPRO: Continuous jumping without input', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('=== BUG REPRODUCTION: Continuous Jumping ===');
    console.log('Observing player for 5 seconds with NO input...');

    // Enable debug mode to see state
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    // Take screenshots every 500ms for 5 seconds
    for (let i = 0; i < 10; i++) {
      await page.screenshot({
        path: `test-results/debug/21-continuous-jump-${i}.png`,
        fullPage: false
      });

      console.log(`  Frame ${i}: captured`);
      await page.waitForTimeout(500);
    }

    console.log('✓ If player Y position changes, bug is confirmed');
  });

  test('BUG REPRO: Enemy speed 16x too fast', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('=== BUG REPRODUCTION: Enemy Speed ===');

    // Move to enemy
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(6000);
    await page.keyboard.up('ArrowRight');

    // Enable debug
    await page.keyboard.press('d');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/debug/22-enemy-frame-0.png',
      fullPage: false
    });

    // Wait exactly 1 second
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'test-results/debug/23-enemy-frame-1sec.png',
      fullPage: false
    });

    console.log('✓ Measure enemy position delta between screenshots');
    console.log('  Expected: ~60px movement (1px/frame * 60fps)');
    console.log('  If bug exists: ~960px movement (16x too fast)');
  });

  test('BUG REPRO: Gap crossing impossible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('=== BUG REPRODUCTION: Gap Crossing ===');

    // Move to reported gap (reduced from 10s to 8s)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/24-at-gap.png',
      fullPage: false
    });

    console.log('Attempting to jump over gap...');

    // Try to jump
    await page.keyboard.press('z');
    await page.waitForTimeout(100);

    // Hold right during jump
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');

    await page.screenshot({
      path: 'test-results/debug/25-after-gap-jump.png',
      fullPage: false
    });

    console.log('✓ Check if player made it across or fell');
  });
});
