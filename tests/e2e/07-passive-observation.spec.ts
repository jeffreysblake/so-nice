import { test, expect } from '@playwright/test';

test.describe('Passive Observation - No Input', () => {
  test('Monitor position stability every 0.25s for 5 seconds with NO input', async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout
    const consoleLogs: string[] = [];

    // Capture console
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    console.log('👁️  Starting passive observation test...');
    console.log('🚫 NO INPUT - Sonic should just stand still\n');

    await page.goto('http://localhost:5174');

    // Wait for game to fully initialize
    console.log('⏳ Waiting for game to initialize...\n');

    // First wait for gameState to exist
    await page.waitForFunction(
      () => typeof (window as any).gameState !== 'undefined',
      { timeout: 10000 }
    );

    // Then wait for player to be added (happens in update loop)
    await page.waitForTimeout(1000);

    // Debug: Check what's in gameState
    const gameStateKeys = await page.evaluate(() => {
      const state = (window as any).gameState;
      return state ? Object.keys(state) : [];
    });
    console.log('✅ Game initialized! gameState keys:', gameStateKeys, '\n');

    console.log('📸 Taking position readings every 0.25 seconds...\n');

    const positions: Array<{time: string, x: number, y: number, grounded: boolean, gsp: number, xsp: number, ysp: number}> = [];

    // Record position every 0.25 seconds for 5 seconds (20 samples total)
    for (let i = 0; i < 20; i++) {
      const timeMs = (i * 250);
      const timeSec = (timeMs / 1000).toFixed(2);

      // Query game state
      const playerData = await page.evaluate(() => {
        const state = (window as any).gameState;
        if (!state || state.x === undefined) return null;
        return {
          x: state.x,
          y: state.y,
          grounded: state.isGrounded,
          gsp: state.groundSpeed || 0,
          xsp: state.xVelocity || 0,
          ysp: state.yVelocity || 0
        };
      });

      if (playerData) {
        positions.push({ time: timeSec, ...playerData });
        console.log(`  ${timeSec}s: Y=${playerData.y.toFixed(2)} Grounded=${playerData.grounded} GSP=${playerData.gsp.toFixed(2)}`);
      }

      if (i < 19) {
        await page.waitForTimeout(250);
      }
    }

    console.log('\n📊 Analysis starting...\n');

    console.log('=== POSITION STABILITY ANALYSIS ===\n');

    if (positions.length >= 2) {
      // Check Y position stability
      const yPositions = positions.map(p => p.y);
      const minY = Math.min(...yPositions);
      const maxY = Math.max(...yPositions);
      const yRange = maxY - minY;

      console.log(`📍 Y Position Range: ${minY.toFixed(2)} to ${maxY.toFixed(2)} (range: ${yRange.toFixed(2)}px)\n`);

      if (yRange > 1.0) {
        console.log('❌ POSITION OSCILLATION DETECTED!');
        console.log('   Y position varies by more than 1px - Sonic is bobbing!\n');

        // Show all Y positions
        console.log('   Y Position History:');
        positions.forEach(p => {
          console.log(`     ${p.time}s: ${p.y.toFixed(2)}px (grounded=${p.grounded})`);
        });
        console.log('');
      } else {
        console.log('✅ Y Position Stable (variation < 1px)\n');
      }

      // Check if always grounded
      const notGroundedCount = positions.filter(p => !p.grounded).length;
      if (notGroundedCount > 0) {
        console.log(`❌ NOT GROUNDED: ${notGroundedCount}/${positions.length} samples show Sonic in air\n`);
      } else {
        console.log('✅ Sonic grounded for all samples\n');
      }

      // Check for any movement
      const xPositions = positions.map(p => p.x);
      const xRange = Math.max(...xPositions) - Math.min(...xPositions);
      if (xRange > 1.0) {
        console.log(`⚠️  HORIZONTAL MOVEMENT: X moved ${xRange.toFixed(2)}px without input\n`);
      } else {
        console.log('✅ No horizontal movement\n');
      }

      // Check velocities
      const hasNonZeroGSP = positions.some(p => Math.abs(p.gsp) > 0.1);
      const hasNonZeroYSP = positions.some(p => Math.abs(p.ysp) > 0.1);

      if (hasNonZeroGSP || hasNonZeroYSP) {
        console.log('⚠️  NON-ZERO VELOCITY DETECTED:');
        positions.slice(-5).forEach(p => {
          console.log(`     ${p.time}s: GSP=${p.gsp.toFixed(2)}, YSP=${p.ysp.toFixed(2)}`);
        });
        console.log('');
      } else {
        console.log('✅ All velocities at zero\n');
      }
    }

    console.log('=== CONSOLE LOG ANALYSIS ===\n');

    // Analyze console logs for unexpected behavior
    const groundedLogs = consoleLogs.filter(log => log.includes('Grounded:'));
    const positionLogs = consoleLogs.filter(log => log.includes('Pos:'));
    const velocityLogs = consoleLogs.filter(log => log.includes('Velocity:'));
    const stateLogs = consoleLogs.filter(log => log.includes('State:'));

    // Check if Sonic moved
    if (positionLogs.length >= 2) {
      const firstPos = positionLogs[0];
      const lastPos = positionLogs[positionLogs.length - 1];

      console.log('📍 Position Analysis:');
      console.log(`   First: ${firstPos}`);
      console.log(`   Last:  ${lastPos}`);

      if (firstPos !== lastPos) {
        console.log('   ⚠️  POSITION CHANGED - Sonic moved without input!\n');
      } else {
        console.log('   ✅ Position unchanged\n');
      }
    }

    // Check velocity
    if (velocityLogs.length > 0) {
      const recentVelocity = velocityLogs.slice(-5);
      console.log('🎯 Recent Velocity Readings:');
      recentVelocity.forEach(v => console.log(`   ${v}`));

      const hasNonZeroVelocity = recentVelocity.some(v =>
        !v.includes('(0.00, 0.00)') && !v.includes('Velocity: (0, 0)')
      );

      if (hasNonZeroVelocity) {
        console.log('   ⚠️  NON-ZERO VELOCITY - Sonic is moving!\n');
      } else {
        console.log('   ✅ Velocity at zero\n');
      }
    }

    // Check state
    if (stateLogs.length > 0) {
      const states = stateLogs.slice(-5);
      console.log('🎮 Recent State Readings:');
      states.forEach(s => console.log(`   ${s}`));

      const hasUnexpectedState = states.some(s =>
        !s.includes('idle') && !s.includes('standing')
      );

      if (hasUnexpectedState) {
        console.log('   ⚠️  UNEXPECTED STATE - Sonic not idle!\n');
      } else {
        console.log('   ✅ State looks normal\n');
      }
    }

    // Check grounded
    if (groundedLogs.length > 0) {
      const grounded = groundedLogs.slice(-5);
      console.log('🏃 Grounded Status:');
      grounded.forEach(g => console.log(`   ${g}`));

      const notGrounded = grounded.some(g => g.includes('false'));

      if (notGrounded) {
        console.log('   ⚠️  NOT GROUNDED - Sonic is falling!\n');
      } else {
        console.log('   ✅ Properly grounded\n');
      }
    }

    // Check for enemies nearby
    const enemyLogs = consoleLogs.filter(log =>
      log.includes('Enemy') || log.includes('hit player') || log.includes('damaged')
    );

    if (enemyLogs.length > 0) {
      console.log('👾 Enemy Interactions:');
      enemyLogs.slice(0, 5).forEach(e => console.log(`   ${e}`));
      console.log('   ⚠️  ENEMY CONTACT - Enemy too close to spawn!\n');
    }

    console.log(`📁 ${positions.length} position samples collected\n`);
    console.log('=========================\n');

    // Assert we got data
    expect(positions.length).toBeGreaterThan(0);
  });
});
