import { test, expect } from '@playwright/test';

test.describe('Gameplay Testing - Claude Plays Sonic', () => {
  test('Claude plays the game for 30 seconds and reports findings', async ({ page }) => {
    const screenshots: string[] = [];
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    // Capture all console output
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    console.log('🎮 Claude is starting the game...\n');

    await page.goto('http://localhost:5174');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/gameplay-start.png' });
    screenshots.push('gameplay-start.png');
    console.log('📸 Screenshot 1: Game started');

    // Press RIGHT arrow to start moving
    console.log('➡️  Claude is pressing RIGHT to move...');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/gameplay-moving-right.png' });
    screenshots.push('gameplay-moving-right.png');
    console.log('📸 Screenshot 2: Moving right (3s)');

    // Jump while moving
    console.log('⬆️  Claude is jumping...');
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/gameplay-jump.png' });
    screenshots.push('gameplay-jump.png');
    console.log('📸 Screenshot 3: Jumping (5s)');

    // Keep moving
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/gameplay-mid-level.png' });
    screenshots.push('gameplay-mid-level.png');
    console.log('📸 Screenshot 4: Mid-level (8s)');

    // Try spin dash
    console.log('🌀 Claude is trying spin dash...');
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowDown');
    await page.keyboard.press('KeyZ');
    await page.keyboard.press('KeyZ');
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/gameplay-spindash.png' });
    screenshots.push('gameplay-spindash.png');
    console.log('📸 Screenshot 5: Spin dash attempt (11s)');

    // Continue playing
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/gameplay-15s.png' });
    screenshots.push('gameplay-15s.png');
    console.log('📸 Screenshot 6: At 15 seconds');

    // Jump over obstacle
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/gameplay-18s.png' });
    screenshots.push('gameplay-18s.png');
    console.log('📸 Screenshot 7: At 18 seconds');

    // Keep going
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/gameplay-23s.png' });
    screenshots.push('gameplay-23s.png');
    console.log('📸 Screenshot 8: At 23 seconds');

    // Final stretch
    await page.waitForTimeout(7000);

    await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: 'test-results/gameplay-end.png' });
    screenshots.push('gameplay-end.png');
    console.log('📸 Screenshot 9: Final state (30s)\n');

    // Analyze gameplay
    console.log('=== GAMEPLAY ANALYSIS ===\n');

    // Check for physics issues
    const hasGroundedIssues = consoleLogs.some(log =>
      log.includes('Grounded: false') && !log.includes('jumping')
    );

    const hasTerrainGaps = consoleLogs.some(log =>
      log.includes('NO TILES FOUND') || log.includes('fell through')
    );

    const ringCount = consoleLogs.filter(log => log.includes('Ring collected!')).length;
    const damageCount = consoleLogs.filter(log => log.includes('Player damaged!')).length;
    const enemyHits = consoleLogs.filter(log => log.includes('hit player')).length;

    console.log('📊 Game Statistics:');
    console.log(`   Rings collected: ${ringCount}`);
    console.log(`   Times damaged: ${damageCount}`);
    console.log(`   Enemy hits: ${enemyHits}`);
    console.log(`   Total errors: ${errors.length}`);
    console.log(`   Screenshots taken: ${screenshots.length}\n`);

    console.log('🔍 Physics Analysis:');
    console.log(`   Terrain gaps detected: ${hasTerrainGaps ? '❌ YES' : '✅ NO'}`);
    console.log(`   Ground collision issues: ${hasGroundedIssues ? '⚠️  YES' : '✅ NO'}\n`);

    // Check FPS
    const fpsLogs = consoleLogs.filter(log => log.includes('FPS:'));
    if (fpsLogs.length > 0) {
      console.log('🎯 Performance:');
      const latestFPS = fpsLogs[fpsLogs.length - 1];
      console.log(`   ${latestFPS}\n`);
    }

    // Report issues
    if (errors.length > 0) {
      console.log('⚠️  ERRORS DETECTED:');
      errors.slice(0, 5).forEach(err => console.log(`   ${err}`));
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors\n`);
      }
    }

    // Check if collision data loaded
    const collisionLoaded = consoleLogs.some(log =>
      log.includes('Collision data loaded successfully')
    );

    console.log('✅ Collision System:');
    console.log(`   Sonic 1 data loaded: ${collisionLoaded ? '✅ YES' : '❌ NO'}\n`);

    console.log(`📁 All screenshots saved to test-results/\n`);
    console.log('=========================\n');

    // Assertions
    expect(collisionLoaded, 'Collision data should be loaded').toBe(true);
    expect(hasTerrainGaps, 'Should not have terrain gaps').toBe(false);
    expect(errors.length, 'Should have minimal errors').toBeLessThan(5);
  });

  test('Check for consistent FPS over time', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(2000);

    const fpsReadings: number[] = [];

    // Collect FPS readings
    page.on('console', msg => {
      const text = msg.text();
      const fpsMatch = text.match(/FPS:\s*(\d+)/);
      if (fpsMatch) {
        fpsReadings.push(parseInt(fpsMatch[1]));
      }
    });

    // Move around for 15 seconds
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(15000);
    await page.keyboard.up('ArrowRight');

    console.log('\n=== FPS ANALYSIS ===');
    console.log(`FPS readings collected: ${fpsReadings.length}`);

    if (fpsReadings.length > 0) {
      const avgFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
      const minFPS = Math.min(...fpsReadings);
      const maxFPS = Math.max(...fpsReadings);

      console.log(`Average FPS: ${avgFPS.toFixed(1)}`);
      console.log(`Min FPS: ${minFPS}`);
      console.log(`Max FPS: ${maxFPS}`);
      console.log(`Target: 60 FPS`);

      const isAcceptable = avgFPS >= 50;
      console.log(`Performance: ${isAcceptable ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT'}`);
    }

    console.log('===================\n');
  });
});
