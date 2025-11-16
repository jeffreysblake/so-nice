import { test } from '@playwright/test';
import * as fs from 'fs';

test('Capture canvas as image', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:5174');

  // Wait for game to initialize and render first frame
  await page.waitForTimeout(12000);

  // Get canvas as base64 PNG
  const canvasData = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  });

  if (canvasData) {
    // Remove data:image/png;base64, prefix
    const base64Data = canvasData.replace(/^data:image\/png;base64,/, '');

    // Save to file
    fs.writeFileSync('test-results/canvas-screenshot.png', Buffer.from(base64Data, 'base64'));
    console.log('✅ Canvas screenshot saved to test-results/canvas-screenshot.png');
  } else {
    console.log('❌ Failed to capture canvas');
  }
});
