import { test, expect } from '@playwright/test';

test.describe('Bobbing Detection - Console Log Analysis', () => {
  test('Capture repositioning and sensor logs to detect bobbing', async ({ page }) => {
    test.setTimeout(30000);

    const consoleLogs: string[] = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
    });

    console.log('🔍 Starting bobbing detection test...\n');

    await page.goto('http://localhost:5174');

    // Wait for game to initialize
    await page.waitForFunction(
      () => typeof (window as any).gameState !== 'undefined',
      { timeout: 10000 }
    );

    // Wait for initial spawn and landing (2 seconds)
    console.log('⏳ Waiting for spawn and landing...\n');
    await page.waitForTimeout(2000);

    // Clear logs from spawn phase
    consoleLogs.length = 0;

    // Capture logs for 5 seconds during idle grounded state
    console.log('📊 Capturing logs for 5 seconds...\n');
    await page.waitForTimeout(5000);

    console.log('=== BOBBING ANALYSIS ===\n');

    // Filter for repositioning logs
    const repositionLogs = consoleLogs.filter(log => log.includes('[REPOSITION]'));
    const sensorLogs = consoleLogs.filter(log => log.includes('[SENSORS]'));
    const frameLogs = consoleLogs.filter(log => log.includes('[FRAME]'));

    console.log(`📍 Repositioning events: ${repositionLogs.length}`);
    console.log(`🎯 Sensor disagreements: ${sensorLogs.length}`);
    console.log(`🎬 Frame position logs: ${frameLogs.length}\n`);

    if (repositionLogs.length > 0) {
      console.log('❌ BOBBING DETECTED - Continuous repositioning!\n');
      console.log('Recent repositioning logs (first 10):');
      repositionLogs.slice(0, 10).forEach(log => console.log(`  ${log}`));

      // Parse distances
      const distances = repositionLogs
        .map(log => {
          const match = log.match(/distance=([-\d.]+)/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter(d => d !== null) as number[];

      if (distances.length > 0) {
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        const maxDistance = Math.max(...distances.map(Math.abs));
        console.log(`\n  Average distance: ${avgDistance.toFixed(3)}px`);
        console.log(`  Max distance: ${maxDistance.toFixed(3)}px`);
        console.log(`  Total adjustments: ${distances.length}\n`);
      }
    } else {
      console.log('✅ NO BOBBING - No repositioning detected during idle!\n');
    }

    if (sensorLogs.length > 0) {
      console.log('⚠️  SENSOR DISAGREEMENTS DETECTED\n');
      console.log('Recent sensor logs (first 10):');
      sensorLogs.slice(0, 10).forEach(log => console.log(`  ${log}`));
      console.log('');
    } else {
      console.log('✅ Sensors in agreement\n');
    }

    // Analyze frame logs for Y position stability
    if (frameLogs.length > 0) {
      console.log('🎬 FRAME POSITION ANALYSIS\n');

      // Parse Y and spriteY from logs
      const yPositions = frameLogs.map(log => {
        const yMatch = log.match(/Y=([\d.]+)/);
        const spriteYMatch = log.match(/spriteY=([\d.]+)/);
        return {
          y: yMatch ? parseFloat(yMatch[1]) : 0,
          spriteY: spriteYMatch ? parseFloat(spriteYMatch[1]) : 0
        };
      });

      const yValues = yPositions.map(p => p.y);
      const spriteYValues = yPositions.map(p => p.spriteY);

      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      const yRange = yMax - yMin;

      const spriteYMin = Math.min(...spriteYValues);
      const spriteYMax = Math.max(...spriteYValues);
      const spriteYRange = spriteYMax - spriteYMin;

      console.log(`  Physics Y range: ${yMin.toFixed(4)} to ${yMax.toFixed(4)} (${yRange.toFixed(4)}px)`);
      console.log(`  Sprite Y range: ${spriteYMin.toFixed(4)} to ${spriteYMax.toFixed(4)} (${spriteYRange.toFixed(4)}px)\n`);

      if (yRange > 0.01) {
        console.log(`  ❌ PHYSICS Y OSCILLATION: ${yRange.toFixed(4)}px variation!`);
        console.log(`  Frame samples:`, frameLogs.slice(0, 5));
        console.log('');
      } else {
        console.log(`  ✅ Physics Y stable (${yRange.toFixed(4)}px)`);
      }

      if (spriteYRange > 0.01) {
        console.log(`  ❌ SPRITE Y OSCILLATION: ${spriteYRange.toFixed(4)}px variation!`);
        console.log(`  This is visual bobbing from sprite rendering`);
        console.log('');
      } else {
        console.log(`  ✅ Sprite Y stable (${spriteYRange.toFixed(4)}px)\n`);
      }
    }

    // Now test during movement
    console.log('=== TESTING MOVEMENT ===\n');
    consoleLogs.length = 0;

    // Simulate right arrow press for 3 seconds
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(3000);
    await page.keyboard.up('ArrowRight');

    const movementRepositionLogs = consoleLogs.filter(log => log.includes('[REPOSITION]'));
    const movementSensorLogs = consoleLogs.filter(log => log.includes('[SENSORS]'));

    console.log(`📍 Repositioning during movement: ${movementRepositionLogs.length}`);
    console.log(`🎯 Sensor disagreements during movement: ${movementSensorLogs.length}\n`);

    if (movementRepositionLogs.length > 100) {
      console.log('❌ EXCESSIVE REPOSITIONING during movement!\n');
      console.log('Sample logs (first 10):');
      movementRepositionLogs.slice(0, 10).forEach(log => console.log(`  ${log}`));
      console.log('');
    }

    console.log('=========================\n');

    // Test passes regardless - we're just observing
    expect(consoleLogs.length).toBeGreaterThan(0);
  });
});
