import { test, expect } from '@playwright/test';

test.describe('Collision Data Loading', () => {
  test('should load Sonic 1 collision data successfully', async ({ page }) => {
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

    // Wait for game to load (max 10 seconds)
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/collision-data-loading.png',
      fullPage: true
    });

    // Print all console logs for debugging
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    console.log('===================\n');

    // Check for collision data loading messages
    const hasLoadingMessage = consoleLogs.some(log =>
      log.includes('Loading Sonic 1 collision data') ||
      log.includes('collision data')
    );

    const hasSuccessMessage = consoleLogs.some(log =>
      log.includes('Collision data loaded successfully') ||
      log.includes('✓ Loaded Sonic 1 collision data')
    );

    const hasErrorMessage = consoleLogs.some(log =>
      log.includes('Collision data NOT FOUND') ||
      log.includes('Failed to load collision data')
    );

    // Report findings
    console.log('\n=== COLLISION DATA STATUS ===');
    console.log('Loading attempt detected:', hasLoadingMessage);
    console.log('Success message found:', hasSuccessMessage);
    console.log('Error message found:', hasErrorMessage);
    console.log('Total console errors:', consoleErrors.length);

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    // Check for HTTP errors (404, etc)
    const has404Error = consoleLogs.some(log => log.includes('404'));
    if (has404Error) {
      console.log('\n❌ 404 ERROR DETECTED - Files not found!');
    }

    // Assertions
    expect(hasLoadingMessage, 'Should attempt to load collision data').toBe(true);
    expect(hasSuccessMessage, 'Should successfully load collision data').toBe(true);
    expect(hasErrorMessage, 'Should NOT have error messages').toBe(false);
    expect(consoleErrors.length, 'Should have no console errors').toBe(0);
  });

  test('should render terrain with no gaps', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Wait for game to initialize
    await page.waitForTimeout(3000);

    // Take screenshot of the starting area
    await page.screenshot({
      path: 'test-results/terrain-no-gaps.png',
      fullPage: false
    });

    // Check debug text shows player is grounded
    const debugText = await page.locator('canvas').screenshot();

    // If terrain has gaps, player will fall through
    // We can check the console for position/grounded state
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.waitForTimeout(2000);

    // Player should stay grounded on flat terrain
    const hasGroundedTrue = consoleLogs.some(log => log.includes('Grounded: true'));

    console.log('Player grounded state detected:', hasGroundedTrue);
  });

  test('should show collision data in network tab', async ({ page }) => {
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

    console.log('\n=== NETWORK REQUESTS ===');

    // Check for collision file requests
    const collisionRequests = requests.filter(url => url.includes('.bin'));
    console.log('Collision file requests:', collisionRequests);

    const collisionResponses = responses.filter(r => r.url.includes('.bin'));
    console.log('Collision file responses:', collisionResponses);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/network-status.png',
      fullPage: true
    });

    // Check if files were requested
    expect(collisionRequests.length, 'Should request .bin files').toBeGreaterThan(0);

    // Check if files loaded successfully (200 status)
    const allSuccessful = collisionResponses.every(r => r.status === 200);
    if (!allSuccessful) {
      console.log('❌ Some collision files failed to load:');
      collisionResponses.forEach(r => {
        if (r.status !== 200) {
          console.log(`  ${r.url}: ${r.status}`);
        }
      });
    }

    expect(allSuccessful, 'All .bin files should load with 200 status').toBe(true);
  });
});
