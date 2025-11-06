import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionManager, SensorDirection } from '../CollisionManager';
import { TerrainTiles, TileSolidity } from '../TerrainTile';
import { GroundMode } from '../../types/SonicTypes';

/**
 * Test suite for CollisionManager
 * Validates sensor-based collision detection
 */
describe('CollisionManager', () => {
  let collisionManager: CollisionManager;
  let mockScene: any;

  beforeEach(() => {
    // Create minimal mock scene
    mockScene = {};
    collisionManager = new CollisionManager(mockScene);
  });

  describe('Tile Management', () => {
    it('should set and retrieve tiles', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(0, 0, tile);

      const retrieved = collisionManager.getTile(0, 0);
      expect(retrieved).toBe(tile);
    });

    it('should return undefined for non-existent tiles', () => {
      const tile = collisionManager.getTile(99, 99);
      expect(tile).toBeUndefined();
    });

    it('should get tile at world position', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(5, 10, tile); // Grid position (5, 10)

      // World position (80, 160) = Grid (5, 10) when tile size is 16
      const retrieved = collisionManager.getTileAtWorldPos(80, 160);
      expect(retrieved).toBe(tile);
    });
  });

  describe('Sensor Casting - Flat Ground', () => {
    beforeEach(() => {
      // Create flat ground at grid position (0, 10)
      const flatTile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(0, 10, flatTile);
    });

    it('should detect collision when sensor is on flat surface', () => {
      // Sensor at world position (8, 160) - middle of tile at grid (0, 10)
      const result = collisionManager.castSensor(
        8,
        160,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(true);
      expect(result.angle).toBe(0);
    });

    it('should not detect collision when sensor is above surface', () => {
      // Sensor well above the ground
      const result = collisionManager.castSensor(
        8,
        100,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(false);
    });

    it('should calculate correct distance to surface', () => {
      // Sensor at Y=154, surface at Y=160
      const result = collisionManager.castSensor(
        8,
        154,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(false);
      expect(result.distance).toBeGreaterThan(0);
    });
  });

  describe('Sensor Casting - Slopes', () => {
    beforeEach(() => {
      // Create 45-degree slope at grid position (0, 10)
      const slopeTile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
      collisionManager.setTile(0, 10, slopeTile);
    });

    it('should detect collision on slope', () => {
      // Test various X positions on the slope
      const result = collisionManager.castSensor(
        8,  // Middle of tile
        168, // Near bottom
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(true);
      expect(result.angle).toBe(45);
    });

    it('should return correct angle for slope', () => {
      const slopeTile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
      collisionManager.setTile(5, 5, slopeTile);

      const result = collisionManager.castSensor(
        88, // Grid X=5, local X=8
        88, // Grid Y=5, local Y=8
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.angle).toBe(45);
    });
  });

  describe('Ground Sensors (Dual Sensor)', () => {
    beforeEach(() => {
      // Create flat ground
      for (let x = 0; x < 10; x++) {
        const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
        collisionManager.setTile(x, 10, tile);
      }
    });

    it('should use both left and right sensors', () => {
      const result = collisionManager.checkGroundSensors(
        80,  // Center X (grid 5)
        160, // Y position
        9,   // Sensor width (default)
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(true);
    });

    it('should detect ground when only one sensor hits', () => {
      // Remove one tile to create an edge
      const emptyTile = TerrainTiles.createTile(TerrainTiles.EMPTY, TileSolidity.EMPTY);
      collisionManager.setTile(6, 10, emptyTile);

      // Position player so right sensor is over edge
      const result = collisionManager.checkGroundSensors(
        94,  // Near edge
        160,
        9,
        GroundMode.FLOOR
      );

      // Should still detect collision from left sensor
      expect(result.collided).toBe(true);
    });
  });

  describe('Tile Solidity', () => {
    it('should detect full solid tile from all directions', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT, TileSolidity.FULL);
      collisionManager.setTile(0, 10, tile);

      const downResult = collisionManager.castSensor(8, 168, SensorDirection.DOWN, GroundMode.FLOOR);
      expect(downResult.collided).toBe(true);
    });

    it('should only detect top-only tile from below', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT, TileSolidity.TOP_ONLY);
      collisionManager.setTile(0, 10, tile);

      const downResult = collisionManager.castSensor(8, 168, SensorDirection.DOWN, GroundMode.FLOOR);
      expect(downResult.collided).toBe(true);

      // Up sensor should not detect top-only platform
      const upResult = collisionManager.castSensor(8, 155, SensorDirection.UP, GroundMode.FLOOR);
      expect(upResult.collided).toBe(false);
    });

    it('should not detect empty tile', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.EMPTY, TileSolidity.EMPTY);
      collisionManager.setTile(0, 10, tile);

      const result = collisionManager.castSensor(8, 168, SensorDirection.DOWN, GroundMode.FLOOR);
      expect(result.collided).toBe(false);
    });
  });

  describe('Adjacent Tile Detection', () => {
    it('should check adjacent tiles when needed', () => {
      // Create ground one tile below
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(0, 11, tile);

      // Sensor in tile (0, 10) should detect ground in tile (0, 11)
      const result = collisionManager.castSensor(
        8,
        165, // In tile 10, but close to tile 11
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      // Should detect the adjacent tile
      expect(result.distance).toBeLessThan(32);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sensors at tile boundaries', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(0, 10, tile);

      // Sensor exactly at tile boundary
      const result = collisionManager.castSensor(
        16, // Boundary between tiles
        160,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.distance).toBeGreaterThanOrEqual(0);
    });

    it('should handle sensors in empty space', () => {
      // No tiles set
      const result = collisionManager.castSensor(
        1000,
        1000,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.collided).toBe(false);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should handle negative coordinates', () => {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      collisionManager.setTile(-1, -1, tile);

      const result = collisionManager.castSensor(
        -8,
        -8,
        SensorDirection.DOWN,
        GroundMode.FLOOR
      );

      expect(result.distance).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large grids efficiently', () => {
      // Create a 100x100 grid
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
          collisionManager.setTile(x, y, tile);
        }
      }

      // Should still quickly find tile
      const start = performance.now();
      const result = collisionManager.getTile(50, 50);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10); // Should be nearly instant
    });
  });
});
