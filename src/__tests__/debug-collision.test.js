import { describe, it, expect } from 'vitest';
import { CollisionManager, SensorDirection } from '../terrain/CollisionManager';
import { TerrainTiles } from '../terrain/TerrainTile';
import { GroundMode } from '../types/SonicTypes';
describe('Debug: Collision Distance Calculation', () => {
    it('should calculate correct distance for sensor 1px past FLAT tile surface', () => {
        const manager = new CollisionManager({});
        const flatTile = TerrainTiles.createTile(TerrainTiles.FLAT);
        // Place tile at grid (5, 41)
        // Tile spans: x=80-96, y=656-672
        // FLAT tile: height=16 everywhere, surface at y=656
        manager.setTile(5, 41, flatTile);
        // Cast sensor at x=80, y=657 (1px past surface at 656)
        const result = manager.castSensor(80, 657, SensorDirection.DOWN, GroundMode.FLOOR);
        expect(result.collided).toBe(true);
        expect(result.distance).toBeCloseTo(1, 2); // Should be 1px inside
    });
    it('should calculate correct distance for checkGroundSensors', () => {
        const manager = new CollisionManager({});
        const flatTile = TerrainTiles.createTile(TerrainTiles.FLAT);
        manager.setTile(5, 41, flatTile);
        // Sensor center at x=80, y=657, width=9
        // Left sensor: x=75.5, Right sensor: x=84.5
        const result = manager.checkGroundSensors(80, 657, 9, GroundMode.FLOOR);
        expect(result.collided).toBe(true);
        expect(result.distance).toBeCloseTo(1, 2);
    });
});
