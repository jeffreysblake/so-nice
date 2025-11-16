import { describe, it, expect, beforeAll } from 'vitest';
import { CollisionDataLoader } from '../../terrain/CollisionDataLoader';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CollisionDataLoader', () => {
  let loader: CollisionDataLoader;

  beforeAll(() => {
    // In test environment, load files directly with fs
    const basePath = resolve(process.cwd(), 'public/assets/collision');
    const normalData = readFileSync(resolve(basePath, 'collision-array-normal.bin'));
    const rotatedData = readFileSync(resolve(basePath, 'collision-array-rotated.bin'));
    const angleData = readFileSync(resolve(basePath, 'angle-map.bin'));

    loader = new CollisionDataLoader();
    // Convert Buffer to ArrayBuffer with correct size
    loader.loadFromBuffers(
      normalData.buffer.slice(normalData.byteOffset, normalData.byteOffset + normalData.byteLength),
      rotatedData.buffer.slice(rotatedData.byteOffset, rotatedData.byteOffset + rotatedData.byteLength),
      angleData.buffer.slice(angleData.byteOffset, angleData.byteOffset + angleData.byteLength)
    );
  });

  it('should load 256 collision tiles', () => {
    expect(loader.isLoaded()).toBe(true);
    expect(loader.getTileCount()).toBe(256);
  });

  it('should load tile 0 (typically empty/flat)', () => {
    const tile = loader.getTile(0);
    expect(tile).toBeDefined();
    if (tile) {
      console.log('Tile 0 heights:', tile.heightArray.heights);
      console.log('Tile 0 angle:', tile.getAngle());
    }
  });

  it('should load various tile indices', () => {
    // Test a few different tiles
    const tile1 = loader.getTile(1);
    const tile16 = loader.getTile(16);
    const tile100 = loader.getTile(100);
    const tile255 = loader.getTile(255);

    expect(tile1).toBeDefined();
    expect(tile16).toBeDefined();
    expect(tile100).toBeDefined();
    expect(tile255).toBeDefined();

    console.log('\n=== Sample Tiles ===');
    console.log('Tile 1:', tile1?.heightArray.heights, 'angle:', tile1?.getAngle());
    console.log('Tile 16:', tile16?.heightArray.heights, 'angle:', tile16?.getAngle());
    console.log('Tile 100:', tile100?.heightArray.heights, 'angle:', tile100?.getAngle());
    console.log('Tile 255:', tile255?.heightArray.heights, 'angle:', tile255?.getAngle());
  });

  it('should handle invalid tile indices', () => {
    expect(loader.getTile(-1)).toBeUndefined();
    expect(loader.getTile(256)).toBeUndefined();
    expect(loader.getTile(1000)).toBeUndefined();
  });

  it('should provide heightAt and widthAt methods', () => {
    const tile = loader.getTile(16);
    if (tile) {
      // Test height at different X positions
      const h0 = tile.getHeightAt(0);
      const h8 = tile.getHeightAt(8);
      const h15 = tile.getHeightAt(15);

      expect(h0).toBeGreaterThanOrEqual(0);
      expect(h0).toBeLessThanOrEqual(16);
      expect(h8).toBeGreaterThanOrEqual(0);
      expect(h15).toBeLessThanOrEqual(16);

      console.log(`\nTile 16 heights: [0]=${h0}, [8]=${h8}, [15]=${h15}`);
    }
  });
});
