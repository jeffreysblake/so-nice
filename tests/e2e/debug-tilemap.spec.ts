import { test } from '@playwright/test';

test('Debug tilemap rendering', async ({ page }) => {
  test.setTimeout(60000);

  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:5174');

  // Wait for game to initialize
  await page.waitForTimeout(8000);

  // Print all logs
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));
  console.log('=== END LOGS ===\n');

  // Check tilemap state
  const tilemapInfo = await page.evaluate(() => {
    const scene = (window as any).game?.scene?.scenes[0];
    if (!scene) return { error: 'No scene found' };

    const terrainManager = (scene as any).terrainManager;
    if (!terrainManager) return { error: 'No terrainManager found' };

    const tilemap = (terrainManager as any).tilemap;
    const tileLayer = (terrainManager as any).tileLayer;

    return {
      tilemapExists: !!tilemap,
      tileLayerExists: !!tileLayer,
      tilemapWidth: tilemap?.width,
      tilemapHeight: tilemap?.height,
      tileLayerVisible: tileLayer?.visible,
      tileLayerAlpha: tileLayer?.alpha,
      tileLayerDepth: tileLayer?.depth,
      tileLayerX: tileLayer?.x,
      tileLayerY: tileLayer?.y,
      tilesets: tilemap?.tilesets?.map((ts: any) => ({
        name: ts.name,
        firstgid: ts.firstgid,
        imageWidth: ts.image?.width,
        imageHeight: ts.image?.height
      })),
      cameraX: scene.cameras?.main?.scrollX,
      cameraY: scene.cameras?.main?.scrollY
    };
  });

  console.log('\n=== TILEMAP INFO ===');
  console.log(JSON.stringify(tilemapInfo, null, 2));
  console.log('=== END INFO ===\n');
});
