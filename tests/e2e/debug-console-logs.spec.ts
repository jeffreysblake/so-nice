import { test } from '@playwright/test';

/**
 * Debug Test: Capture Console Logs During Game Load
 * Captures all console messages to diagnose game initialization issues
 */
test.describe('Debug: Console Logs', () => {
  test('should capture all console messages during game load', async ({ page }) => {
    const consoleMessages: Array<{
      type: string;
      text: string;
      timestamp: number;
    }> = [];

    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: 'PAGE ERROR: ' + error.message + '\n' + error.stack,
        timestamp: Date.now(),
      });
    });

    // Navigate to the game
    console.log('\n=== NAVIGATING TO GAME ===');
    await page.goto('http://localhost:5174');

    // Wait for canvas to appear
    console.log('=== WAITING FOR CANVAS ===');
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait 5 seconds for game to load
    console.log('=== WAITING 5 SECONDS FOR GAME LOAD ===');
    await page.waitForTimeout(5000);

    console.log('=== GAME LOAD COMPLETE ===\n');

    // Print all console messages
    console.log('\n========================================');
    console.log('ALL CONSOLE MESSAGES:');
    console.log('========================================\n');

    consoleMessages.forEach((msg, idx) => {
      const num = idx + 1;
      const msgType = msg.type.toUpperCase();
      console.log('[' + num + '] [' + msgType + '] ' + msg.text);
    });

    console.log('\n========================================');
    console.log('FILTERED MESSAGES (Key terms):');
    console.log('========================================\n');

    const keywords = [
      'Loaded',
      'Blocks',
      'Chunks',
      'Tiles',
      'rendered',
      'Decompressed',
      'error',
      'Error',
      'ERROR',
      'warning',
      'Warning',
      'failed',
      'Failed',
      'collision',
      'Collision',
      'terrain',
      'Terrain',
      'chunk',
      'Chunk',
      'tile',
      'Tile',
      'block',
      'Block',
    ];

    const filteredMessages = consoleMessages.filter((msg) =>
      keywords.some((keyword) => msg.text.includes(keyword))
    );

    if (filteredMessages.length > 0) {
      filteredMessages.forEach((msg, idx) => {
        const num = idx + 1;
        const msgType = msg.type.toUpperCase();
        console.log('[' + num + '] [' + msgType + '] ' + msg.text);
      });
    } else {
      console.log('No messages containing key terms found.');
    }

    console.log('\n========================================');
    console.log('Total Messages: ' + consoleMessages.length);
    console.log('Filtered Messages: ' + filteredMessages.length);
    console.log('========================================\n');
  });
});
