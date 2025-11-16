import { test, expect } from '@playwright/test';

test.describe('Chunk-Based Rendering', () => {
  test('should load GHZ chunk data and render authentic terrain', async ({ page }) => {
    // Capture console messages
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate to the game
    await page.goto('http://localhost:5174');

    // Wait for game to load
    await page.waitForTimeout(5000);

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/chunk-rendering-initial.png',
      fullPage: false
    });

    // Print all console logs for debugging
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('===================\n');

    // Check for chunk loading messages
    const hasChunkLoadingMessage = consoleLogs.some(log =>
      log.includes('Loading GHZ chunk definitions') ||
      log.includes('chunk')
    );

    const hasChunkSuccessMessage = consoleLogs.some(log =>
      log.includes('Chunk data loaded successfully') ||
      log.includes('✓ Loaded') && log.includes('chunks')
    );

    const hasLayoutLoadingMessage = consoleLogs.some(log =>
      log.includes('Loading GHZ Act 1 layout') ||
      log.includes('layout')
    );

    const hasLayoutSuccessMessage = consoleLogs.some(log =>
      log.includes('Level layout loaded successfully')
    );

    const hasEnigmaMessage = consoleLogs.some(log =>
      log.includes('Enigma') || log.includes('Decompressed')
    );

    const hasChunkRenderingMessage = consoleLogs.some(log =>
      log.includes('Rendered') && log.includes('terrain sprites')
    );

    // Report findings
    console.log('\n=== CHUNK DATA STATUS ===');
    console.log('Chunk loading attempt detected:', hasChunkLoadingMessage);
    console.log('Chunk success message found:', hasChunkSuccessMessage);
    console.log('Layout loading attempt detected:', hasLayoutLoadingMessage);
    console.log('Layout success message found:', hasLayoutSuccessMessage);
    console.log('Enigma decompression detected:', hasEnigmaMessage);
    console.log('Chunk rendering detected:', hasChunkRenderingMessage);
    console.log('Total console errors:', consoleErrors.length);

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    // Assertions
    expect(hasChunkLoadingMessage, 'Should attempt to load chunk data').toBe(true);
    expect(hasChunkSuccessMessage, 'Should successfully load chunk data').toBe(true);
    expect(hasEnigmaMessage, 'Should decompress Enigma data').toBe(true);
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);
  });

  test('should show varied terrain textures (not repetitive)', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Wait for game to initialize
    await page.waitForTimeout(3000);

    // Take screenshot of starting area
    await page.screenshot({
      path: 'test-results/chunk-terrain-start.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    // Scroll right to see more terrain
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/chunk-terrain-mid.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    // Continue scrolling
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/chunk-terrain-far.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    console.log('\n✓ Captured 3 terrain screenshots at different positions');
    console.log('  - Check test-results/chunk-terrain-start.png');
    console.log('  - Check test-results/chunk-terrain-mid.png');
    console.log('  - Check test-results/chunk-terrain-far.png');
    console.log('\nThese should show varied terrain, not repetitive checkered patterns');
  });

  test('should load all chunk files from network', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];

    page.on('request', request => {
      requests.push(request.url());
    });

    const responses: { url: string; status: number }[] = [];

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
      });
    });

    await page.goto('http://localhost:5174');
    await page.waitForTimeout(5000);

    console.log('\n=== NETWORK REQUESTS FOR CHUNKS ===');

    // Check for chunk file requests
    const chunkFileRequests = requests.filter(url =>
      url.includes('ghz-chunks.eni') ||
      url.includes('ghz-collision-index.bin') ||
      url.includes('ghz1-layout.bin')
    );

    console.log('Chunk file requests:', chunkFileRequests);

    const chunkFileResponses = responses.filter(r =>
      r.url.includes('ghz-chunks.eni') ||
      r.url.includes('ghz-collision-index.bin') ||
      r.url.includes('ghz1-layout.bin')
    );

    console.log('Chunk file responses:', chunkFileResponses);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/chunk-network-status.png',
      fullPage: true
    });

    // Check if files were requested
    expect(chunkFileRequests.length, 'Should request chunk files').toBeGreaterThanOrEqual(3);

    // Check if files loaded successfully (200 status)
    const allSuccessful = chunkFileResponses.every(r => r.status === 200);
    if (!allSuccessful) {
      console.log('❌ Some chunk files failed to load:');
      chunkFileResponses.forEach(r => {
        if (r.status !== 200) {
          console.log(`  ${r.url}: ${r.status}`);
        }
      });
    }

    expect(allSuccessful, 'All chunk files should load with 200 status').toBe(true);
    expect(chunkFileResponses.length, 'Should have loaded 3 chunk files').toBe(3);
  });

  test('should verify chunk count in console', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('http://localhost:5174');
    await page.waitForTimeout(5000);

    // Look for chunk count in console
    const chunkCountLog = consoleLogs.find(log =>
      log.includes('chunks') && log.includes('collision entries')
    );

    console.log('\n=== CHUNK COUNT ===');
    console.log(chunkCountLog || 'Chunk count not found in logs');

    // Should have loaded chunks (typically 200-400 chunks)
    const hasChunkCount = consoleLogs.some(log =>
      log.match(/\d+\s+chunks/)
    );

    expect(hasChunkCount, 'Console should show chunk count').toBe(true);
  });
});
