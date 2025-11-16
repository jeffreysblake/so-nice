import { describe, it, expect, beforeAll } from 'vitest';
import { CollisionDataLoader } from '../../terrain/CollisionDataLoader';
import * as fs from 'fs';
import * as path from 'path';

describe('Heightmap Diagnostic - Verify Sonic 1 Format', () => {
  let loader: CollisionDataLoader;

  beforeAll(async () => {
    // Load authentic Sonic 1 collision data
    const normalPath = path.join(__dirname, '../../../public/assets/collision/collision-array-normal.bin');
    const rotatedPath = path.join(__dirname, '../../../public/assets/collision/collision-array-rotated.bin');
    const anglePath = path.join(__dirname, '../../../public/assets/collision/angle-map.bin');

    // Use Uint8Array.from() to get proper ArrayBuffer slices
    const normalData = fs.readFileSync(normalPath);
    const rotatedData = fs.readFileSync(rotatedPath);
    const angleData = fs.readFileSync(anglePath);

    loader = new CollisionDataLoader();
    loader.loadFromBuffers(
      normalData.buffer.slice(normalData.byteOffset, normalData.byteOffset + normalData.byteLength),
      rotatedData.buffer.slice(rotatedData.byteOffset, rotatedData.byteOffset + rotatedData.byteLength),
      angleData.buffer.slice(angleData.byteOffset, angleData.byteOffset + angleData.byteLength)
    );
  });

  it('should inspect tile 0 (likely solid ground block)', () => {
    const tile = loader.getTile(0);
    expect(tile).toBeDefined();

    console.log('\n========== TILE 0 ==========');
    console.log('Angle:', tile!.getAngle(), 'degrees');
    console.log('Heights (left to right):');
    for (let x = 0; x < 16; x++) {
      const h = tile!.getHeightAt(x);
      console.log(`  x=${x}: height=${h}`);
    }
  });

  it('should inspect tile 1 (next common tile)', () => {
    const tile = loader.getTile(1);
    expect(tile).toBeDefined();

    console.log('\n========== TILE 1 ==========');
    console.log('Angle:', tile!.getAngle(), 'degrees');
    console.log('Heights (left to right):');
    for (let x = 0; x < 16; x++) {
      const h = tile!.getHeightAt(x);
      console.log(`  x=${x}: height=${h}`);
    }
  });

  it('should find and inspect a full ground tile (height=16 for all pixels)', () => {
    // Search for a tile that's completely solid (all heights = 16)
    let fullTileIndex = -1;
    for (let i = 0; i < 256; i++) {
      const tile = loader.getTile(i);
      if (!tile) continue;

      let allFull = true;
      for (let x = 0; x < 16; x++) {
        if (tile.getHeightAt(x) !== 16) {
          allFull = false;
          break;
        }
      }

      if (allFull && tile.getAngle() === 0) {
        fullTileIndex = i;
        break;
      }
    }

    if (fullTileIndex >= 0) {
      const tile = loader.getTile(fullTileIndex);
      console.log(`\n========== FULL TILE (index ${fullTileIndex}) ==========`);
      console.log('Angle:', tile!.getAngle(), 'degrees');
      console.log('All heights:', tile!.getHeightAt(0));
      console.log('Expected: If height=16 means "16 pixels from BOTTOM", surface should be at y=0 (top)');
      console.log('Expected: If height=16 means "16 pixels from TOP", surface should be at y=16 (bottom)');
    } else {
      console.log('\nNo full flat ground tile found in tile set');
    }
  });

  it('should find and inspect a slope tile', () => {
    // Search for a slope tile (varying heights, non-zero angle)
    let slopeTileIndex = -1;
    for (let i = 0; i < 256; i++) {
      const tile = loader.getTile(i);
      if (!tile) continue;

      const angle = tile.getAngle();
      if (angle > 0 && angle < 90) {
        slopeTileIndex = i;
        break;
      }
    }

    if (slopeTileIndex >= 0) {
      const tile = loader.getTile(slopeTileIndex);
      console.log(`\n========== SLOPE TILE (index ${slopeTileIndex}) ==========`);
      console.log('Angle:', tile!.getAngle(), 'degrees');
      console.log('Heights (should increase left-to-right for upward slope):');
      for (let x = 0; x < 16; x++) {
        const h = tile!.getHeightAt(x);
        console.log(`  x=${x}: height=${h}`);
      }
    } else {
      console.log('\nNo slope tile found in tile set');
    }
  });

  it('should analyze interpretation: FROM BOTTOM vs FROM TOP', () => {
    console.log('\n========== HEIGHTMAP INTERPRETATION ANALYSIS ==========');
    console.log('\nGiven a 16x16 tile with local coordinates:');
    console.log('  y=0  = TOP edge');
    console.log('  y=16 = BOTTOM edge');
    console.log('\nFor a ground tile at gridY=41 (world Y=656-672):');
    console.log('  Sonic center Y=639, sensor Y=656');
    console.log('  Tile world range: 656-672');
    console.log('\nIF height=16 means "16 pixels FROM BOTTOM":');
    console.log('  Solid region: y=0 to y=16 (entire tile)');
    console.log('  Surface: y=0 (top of solid)');
    console.log('  Formula: surfaceY = tileSize - height = 16 - 16 = 0');
    console.log('  World surface: 656 + 0 = 656 ✓ MATCHES sensor');
    console.log('\nIF height=16 means "16 pixels FROM TOP":');
    console.log('  Solid region: y=0 to y=16 (starting from top)');
    console.log('  Surface: y=16 (bottom of solid)');
    console.log('  Formula: surfaceY = height = 16');
    console.log('  World surface: 656 + 16 = 672 ✗ Sensor would be 16px above surface');
    console.log('\nCONCLUSION: Current formula `surfaceY = tileSize - height` appears CORRECT');
    console.log('The comment in CollisionDataLoader.ts:12 may be misleading/incorrect');
  });
});
