import { test, expect } from '@playwright/test';

test.describe('Collision Debug - Trace exact collision values', () => {
  test('should trace collision detection step-by-step', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('http://localhost:5174');

    await page.waitForFunction(
      () => typeof (window as any).gameState !== 'undefined',
      { timeout: 10000 }
    );

    await page.waitForTimeout(2000);

    // Add debug logging to collision manager
    await page.evaluate(() => {
      const state = (window as any).gameState;
      console.log('[COLLISION DEBUG] Game state:', {
        x: state.x,
        y: state.y,
        grounded: state.grounded,
      });
    });

    // Get collision details
    const collisionInfo = await page.evaluate(() => {
      const state = (window as any).gameState;

      // Manually calculate what collision should be
      const centerY = state.y;
      const sensorHeight = 20; // SENSOR_HEIGHT from PhysicsConstants
      const sensorY = centerY + sensorHeight;
      const tileSize = 16;

      // Sensor position
      const gridY = Math.floor(sensorY / tileSize);
      const tileWorldY = gridY * tileSize;
      const tileLocalY = sensorY - tileWorldY;

      // For a full ground tile, height=16, so surfaceY = 16-16 = 0
      const expectedHeight = 16;
      const expectedSurfaceY = tileSize - expectedHeight; // 0
      const expectedDistance = tileLocalY - expectedSurfaceY; // How far sensor is below surface

      return {
        playerCenter: { x: state.x, y: centerY },
        sensor: {
          height: sensorHeight,
          y: sensorY,
          gridY: gridY,
        },
        tile: {
          worldY: tileWorldY,
          localY: tileLocalY,
          expectedSurfaceY: expectedSurfaceY,
        },
        collision: {
          expectedDistance: expectedDistance,
          shouldMoveUp: expectedDistance, // Positive = below surface, move up
          targetCenterY: tileWorldY + expectedSurfaceY - sensorHeight, // Where center should be
        }
      };
    });

    console.log('\n========== COLLISION TRACE ==========');
    console.log('\nPlayer:');
    console.log(`  Center: (${collisionInfo.playerCenter.x}, ${collisionInfo.playerCenter.y})`);
    console.log('\nSensor:');
    console.log(`  Offset: ${collisionInfo.sensor.height}px below center`);
    console.log(`  Position: Y=${collisionInfo.sensor.y}`);
    console.log(`  Grid Y: ${collisionInfo.sensor.gridY}`);
    console.log('\nTile:');
    console.log(`  World Y: ${collisionInfo.tile.worldY}`);
    console.log(`  Sensor local Y in tile: ${collisionInfo.tile.localY}`);
    console.log(`  Surface Y in tile: ${collisionInfo.tile.expectedSurfaceY}`);
    console.log('\nCollision Math:');
    console.log(`  Distance = localY - surfaceY = ${collisionInfo.tile.localY} - ${collisionInfo.tile.expectedSurfaceY} = ${collisionInfo.collision.expectedDistance}`);
    console.log(`  Distance > 0 means sensor is BELOW surface (inside solid)`);
    console.log(`  Must move UP by ${collisionInfo.collision.expectedDistance}px`);
    console.log(`\n  Current center Y: ${collisionInfo.playerCenter.y}`);
    console.log(`  Target center Y: ${collisionInfo.collision.targetCenterY}`);
    console.log(`  Correction needed: ${collisionInfo.playerCenter.y - collisionInfo.collision.targetCenterY}px`);

    if (Math.abs(collisionInfo.playerCenter.y - collisionInfo.collision.targetCenterY) > 0.1) {
      console.log(`\n  ❌ POSITION NOT CORRECTED! Player at wrong Y position!`);
    } else {
      console.log(`\n  ✅ Position correctly aligned`);
    }
  });
});
