import { describe, it, expect } from 'vitest';
import { TerrainTiles, TileSolidity } from '../TerrainTile';

/**
 * Test suite for TerrainTile
 * Validates heightmap calculations, angle transformations, and tile properties
 */
describe('TerrainTile', () => {
  describe('Heightmap Calculations', () => {
    it('should return correct height for flat tile', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);

      for (let x = 0; x < 16; x++) {
        expect(tile.getHeightAt(x)).toBe(16);
      }
    });

    it('should return correct heights for 45-degree slope', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);

      expect(tile.getHeightAt(0)).toBe(0);
      expect(tile.getHeightAt(7)).toBe(7);
      expect(tile.getHeightAt(15)).toBe(15);
    });

    it('should handle edge cases (x out of bounds)', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);

      expect(tile.getHeightAt(-1)).toBe(16);
      expect(tile.getHeightAt(16)).toBe(16);
      expect(tile.getHeightAt(100)).toBe(16);
    });

    it('should return correct widths matching heightmap', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);

      for (let y = 0; y < 16; y++) {
        expect(tile.getWidthAt(y)).toBeGreaterThanOrEqual(0);
        expect(tile.getWidthAt(y)).toBeLessThanOrEqual(16);
      }
    });
  });

  describe('Angle Transformations', () => {
    it('should return correct angle for flat tile', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      expect(tile.getAngle()).toBe(0);
    });

    it('should return correct angle for 45-degree slope', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
      expect(tile.getAngle()).toBe(45);
    });

    it('should flip angle horizontally', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP, TileSolidity.FULL, true, false);
      const angle = tile.getAngle();

      // 45° flipped horizontally should become 135°
      expect(angle).toBe(135);
    });

    it('should flip angle vertically', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP, TileSolidity.FULL, false, true);
      const angle = tile.getAngle();

      // 45° flipped vertically should become 315°
      expect(angle).toBe(315);
    });

    it('should handle both flips (180° rotation)', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP, TileSolidity.FULL, true, true);
      const angle = tile.getAngle();

      // 45° + 180° = 225°
      expect(angle).toBe(225);
    });
  });

  describe('Tile Flipping', () => {
    it('should flip heights vertically', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP, TileSolidity.FULL, false, true);

      // Flipped vertically: height becomes (16 - height)
      expect(tile.getHeightAt(0)).toBe(16);  // Was 0
      expect(tile.getHeightAt(15)).toBe(1);  // Was 15
    });

    it('should maintain tile size', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);

      expect(tile.width).toBe(16);
      expect(tile.height).toBe(16);
    });
  });

  describe('Tile Solidity', () => {
    it('should create full solid tile by default', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      expect(tile.solidity).toBe(TileSolidity.FULL);
    });

    it('should create top-only solid tile', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT, TileSolidity.TOP_ONLY);
      expect(tile.solidity).toBe(TileSolidity.TOP_ONLY);
    });

    it('should create sides and bottom solid tile', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT, TileSolidity.SIDES_BOTTOM);
      expect(tile.solidity).toBe(TileSolidity.SIDES_BOTTOM);
    });
  });

  describe('Pre-defined Tiles', () => {
    it('should have empty tile with all zero heights', () => {
      const emptyArray = TerrainTiles.EMPTY;

      expect(emptyArray.heights.every(h => h === 0)).toBe(true);
      expect(emptyArray.angle).toBe(0);
    });

    it('should have gentle slope tiles', () => {
      const slope1 = TerrainTiles.SLOPE_22_UP_1;
      const slope2 = TerrainTiles.SLOPE_22_UP_2;

      // First tile should have heights 0-7
      expect(slope1.heights[0]).toBe(0);
      expect(slope1.heights[15]).toBe(7);

      // Second tile continues from 8-15
      expect(slope2.heights[0]).toBe(8);
      expect(slope2.heights[15]).toBe(15);
    });

    it('should have curve tiles for loops', () => {
      const curveTL = TerrainTiles.CURVE_TL;
      const curveTR = TerrainTiles.CURVE_TR;
      const curveBL = TerrainTiles.CURVE_BL;
      const curveBR = TerrainTiles.CURVE_BR;

      expect(curveTL.heights.length).toBe(16);
      expect(curveTR.heights.length).toBe(16);
      expect(curveBL.heights.length).toBe(16);
      expect(curveBR.heights.length).toBe(16);
    });
  });

  describe('Heightmap Properties', () => {
    it('should have heights between 0 and 16', () => {
      const tiles = [
        TerrainTiles.FLAT,
        TerrainTiles.SLOPE_45_UP,
        TerrainTiles.SLOPE_45_DOWN,
        TerrainTiles.CURVE_TL,
      ];

      tiles.forEach(tileData => {
        const tile = TerrainTiles.createTile(tileData);
        for (let x = 0; x < 16; x++) {
          const height = tile.getHeightAt(x);
          expect(height).toBeGreaterThanOrEqual(0);
          expect(height).toBeLessThanOrEqual(16);
        }
      });
    });

    it('should have 16 height values', () => {
      expect(TerrainTiles.FLAT.heights.length).toBe(16);
      expect(TerrainTiles.SLOPE_45_UP.heights.length).toBe(16);
      expect(TerrainTiles.CURVE_TL.heights.length).toBe(16);
    });
  });
});
