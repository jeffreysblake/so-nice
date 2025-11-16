import { test, expect } from '@playwright/test';

test('Debug block loading', async ({ page }) => {
  const consoleMessages: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:5174');
  await page.waitForTimeout(3000);

  // Print all console messages
  console.log('\n=== CONSOLE MESSAGES ===\n');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('\n=== END CONSOLE ===\n');

  // Filter for relevant messages
  const blockMessages = consoleMessages.filter(msg =>
    msg.includes('block') ||
    msg.includes('Block') ||
    msg.includes('Kosinski') ||
    msg.includes('Layout') ||
    msg.includes('renderTerrain')
  );

  console.log('\n=== BLOCK-RELATED MESSAGES ===\n');
  blockMessages.forEach(msg => console.log(msg));
  console.log('\n=== END BLOCK MESSAGES ===\n');
});
