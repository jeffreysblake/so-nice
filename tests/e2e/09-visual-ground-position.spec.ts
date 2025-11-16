import { test, expect } from '@playwright/test';

test.describe('Visual Ground Position Diagnostic', () => {
  test('should analyze Sonic position relative to ground tiles', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Wait for game to initialize
    await page.waitForFunction(
      () => typeof (window as any).gameState !== 'undefined',
      { timeout: 10000 }
    );

    // Wait for Sonic to land and stabilize
    await page.waitForTimeout(2000);

    // Capture screenshot with debug visualization
    await page.screenshot({
      path: 'test-results/visual-ground-position.png',
      fullPage: false,
    });

    // Get precise positions
    const positions = await page.evaluate(() => {
      const state = (window as any).gameState;

      // Get terrain info at Sonic's position
      const tileSize = 16;
      const sensorHeight = state.sensorHeight || 20; // Use runtime value or default
      const sensorY = state.y + sensorHeight; // Player center + SENSOR_HEIGHT
      const gridY = Math.floor(sensorY / tileSize);
      const tileWorldY = gridY * tileSize;

      return {
        player: {
          centerX: Math.round(state.x * 100) / 100,
          centerY: Math.round(state.y * 100) / 100,
          sensorY: Math.round(sensorY * 100) / 100,
          sensorHeight,
        },
        ground: {
          gridY,
          tileWorldY,
          tileWorldYBottom: tileWorldY + tileSize,
        },
        measurements: {
          sensorToTileTop: Math.round((sensorY - tileWorldY) * 100) / 100,
          centerToTileTop: Math.round((state.y - tileWorldY) * 100) / 100,
        },
      };
    });

    console.log('\n========== VISUAL POSITION ANALYSIS ==========');
    console.log('\nPlayer Position:');
    console.log(`  Center: (${positions.player.centerX}, ${positions.player.centerY})`);
    console.log(`  Sensor Height Offset: ${positions.player.sensorHeight}px`);
    console.log(`  Sensor Y: ${positions.player.sensorY} (center + ${positions.player.sensorHeight})`);
    console.log('\nGround Tile:');
    console.log(`  Grid Y: ${positions.ground.gridY}`);
    console.log(`  Tile Y range: ${positions.ground.tileWorldY} - ${positions.ground.tileWorldYBottom}`);
    console.log('\nMeasurements:');
    console.log(`  Sensor to tile top: ${positions.measurements.sensorToTileTop}px`);
    console.log(`  Center to tile top: ${positions.measurements.centerToTileTop}px`);
    console.log('\n  For a full tile (height=16):');
    console.log(`    - Heightmap surface at: ${positions.ground.tileWorldY} (tile top)`);
    console.log(`    - Sensor should be at: ${positions.ground.tileWorldY} (touching surface)`);
    console.log(`    - Sensor actually at: ${positions.player.sensorY}`);
    console.log(`    - Difference: ${positions.measurements.sensorToTileTop}px`);

    if (Math.abs(positions.measurements.sensorToTileTop) < 0.1) {
      console.log('\n  ✅ SENSOR PERFECTLY ALIGNED with heightmap surface');
    } else {
      console.log(`\n  ❌ SENSOR MISALIGNED by ${positions.measurements.sensorToTileTop}px`);
    }

    // Check if Sonic sprite bottom aligns with ground
    const spriteAnalysis = await page.evaluate(() => {
      const state = (window as any).gameState;

      // Sonic sprite dimensions (standing)
      const spriteHeight = 40; // Approximate sprite height in pixels
      const spriteBottom = state.y + (spriteHeight / 2); // Bottom of sprite

      const sensorHeight = state.sensorHeight || 20;
      const sensorY = state.y + sensorHeight;
      const tileSize = 16;
      const gridY = Math.floor(sensorY / tileSize);
      const tileWorldY = gridY * tileSize;

      return {
        spriteBottom: Math.round(spriteBottom * 100) / 100,
        groundSurfaceY: tileWorldY,
        spriteBelowGround: Math.round((spriteBottom - tileWorldY) * 100) / 100,
        sensorHeight,
      };
    });

    console.log('\nSprite Visual Analysis:');
    console.log(`  Sprite bottom: ${spriteAnalysis.spriteBottom}`);
    console.log(`  Ground surface: ${spriteAnalysis.groundSurfaceY}`);
    console.log(`  Sprite below ground by: ${spriteAnalysis.spriteBelowGround}px`);

    if (spriteAnalysis.spriteBelowGround > 0) {
      console.log(`\n  ⚠️  VISUAL BUG: Sprite bottom is ${spriteAnalysis.spriteBelowGround}px BELOW ground surface!`);
    } else {
      console.log('\n  ✅ Sprite bottom is at or above ground surface');
    }

    console.log('\nScreenshot saved to: test-results/visual-ground-position.png');
    console.log('Check the screenshot to verify visual appearance.');
  });
});
