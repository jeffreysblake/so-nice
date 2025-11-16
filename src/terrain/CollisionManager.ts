import Phaser from 'phaser';
import { TerrainTile, TileSolidity } from './TerrainTile';
import { GroundMode } from '../types/SonicTypes';

/**
 * CollisionSensor - Represents a single sensor point for collision detection
 */
export interface SensorResult {
  distance: number;  // Distance to surface (negative = inside, positive = outside)
  angle: number;     // Angle of the surface
  collided: boolean;
  tile?: TerrainTile;
  tileX?: number;
  tileY?: number;
}

export enum SensorDirection {
  DOWN = 'down',
  UP = 'up',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * CollisionManager - Handles sensor-based collision detection with terrain
 */
export class CollisionManager {
  private tiles: Map<string, TerrainTile> = new Map();
  private readonly tileSize = 16;

  constructor(_scene: Phaser.Scene) {}

  /**
   * Set a tile at a specific grid position
   */
  setTile(gridX: number, gridY: number, tile: TerrainTile): void {
    const key = `${gridX},${gridY}`;
    this.tiles.set(key, tile);
  }

  /**
   * Get a tile at a specific grid position
   */
  getTile(gridX: number, gridY: number): TerrainTile | undefined {
    const key = `${gridX},${gridY}`;
    return this.tiles.get(key);
  }

  /**
   * Get tile at world position
   */
  getTileAtWorldPos(worldX: number, worldY: number): TerrainTile | undefined {
    const gridX = Math.floor(worldX / this.tileSize);
    const gridY = Math.floor(worldY / this.tileSize);
    return this.getTile(gridX, gridY);
  }

  /**
   * Cast a sensor and check for collision
   * Based on Sonic Physics Guide sensor system
   *
   * Per RSDKv4 reference implementation:
   * - Search up to 3 tiles (48 pixels) from sensor position
   * - Find CLOSEST surface within range (not first)
   * - Apply collision tolerance of 14 pixels per Sonic Physics Guide
   */
  castSensor(
    x: number,
    y: number,
    direction: SensorDirection,
    _mode: GroundMode,
    maxDistance: number = 48  // Increased from 32 to match RSDKv4 (3 tiles)
  ): SensorResult {
    const gridX = Math.floor(x / this.tileSize);
    const gridY = Math.floor(y / this.tileSize);

    // Track closest surface found (not first!)
    let closestResult: SensorResult = {
      distance: maxDistance,
      angle: 0,
      collided: false,
    };

    // Check enough tiles to cover maxDistance
    // +1 to ensure we check current tile plus full range
    const tilesToCheck = Math.ceil(maxDistance / this.tileSize) + 1;
    for (let i = 0; i < tilesToCheck; i++) {
      let checkX = gridX;
      let checkY = gridY;

      // Adjust based on direction
      if (direction === SensorDirection.DOWN) checkY += i;
      else if (direction === SensorDirection.UP) checkY -= i;
      else if (direction === SensorDirection.RIGHT) checkX += i;
      else if (direction === SensorDirection.LEFT) checkX -= i;

      const tile = this.getTile(checkX, checkY);
      if (!tile) continue;

      // Check solidity
      if (!this.canSensorDetectTile(direction, tile)) continue;

      // Get position within tile
      const tileLocalX = x - checkX * this.tileSize;
      const tileLocalY = y - checkY * this.tileSize;

      // Check collision based on direction
      const result = this.checkTileCollision(
        tileLocalX,
        tileLocalY,
        tile,
        direction,
        checkX,
        checkY
      );

      // Track CLOSEST surface within range (key fix for X=890 bug!)
      if (Math.abs(result.distance) < Math.abs(closestResult.distance)) {
        closestResult = result;
      }
    }

    // Apply collision check based on distance
    // Per Sonic Physics Guide, collision tolerance of 14 pixels applies to ground snapping
    // But we need to detect surfaces further away when falling
    const MAX_SNAP_DISTANCE = 16; // Maximum distance to snap player to ground (1 tile)

    // Collided if close enough to the surface
    // This is more permissive than the 14px tolerance to handle falling
    closestResult.collided = Math.abs(closestResult.distance) <= MAX_SNAP_DISTANCE;

    return closestResult;
  }

  /**
   * Check if a sensor can detect a specific tile based on solidity
   */
  private canSensorDetectTile(
    direction: SensorDirection,
    tile: TerrainTile
  ): boolean {
    if (tile.solidity === TileSolidity.EMPTY) return false;
    if (tile.solidity === TileSolidity.FULL) return true;

    if (tile.solidity === TileSolidity.TOP_ONLY) {
      return direction === SensorDirection.DOWN;
    }

    if (tile.solidity === TileSolidity.SIDES_BOTTOM) {
      return direction !== SensorDirection.DOWN;
    }

    return true;
  }

  /**
   * Check collision with a specific tile
   */
  private checkTileCollision(
    localX: number,
    localY: number,
    tile: TerrainTile,
    direction: SensorDirection,
    tileGridX: number,
    tileGridY: number
  ): SensorResult {
    let distance = 0;
    let collided = false;

    if (direction === SensorDirection.DOWN || direction === SensorDirection.UP) {
      // Use height array
      // In Sonic 1, height = number of solid pixels FROM BOTTOM
      // For height=16 (full tile): solid fills entire tile, surface at TOP (y=0)
      // For height=8 (half tile): solid fills bottom half, surface at MIDDLE (y=8)
      const height = tile.getHeightAt(localX);
      const surfaceY = this.tileSize - height; // Surface at top of solid region

      if (direction === SensorDirection.DOWN) {
        // Distance: negative if above surface (move down), positive if below surface (move up)
        distance = localY - surfaceY;
        collided = localY >= surfaceY; // Collided if at or below surface
      } else {
        // Direction is UP - sensor checking ceiling
        distance = surfaceY - localY;
        collided = distance >= 0; // Collided if at or above surface
      }
    } else {
      // Use width array for horizontal collision
      const width = tile.getWidthAt(localY);
      const surfaceX = this.tileSize - width; // Surface position in tile (from left)

      if (direction === SensorDirection.RIGHT) {
        // Distance sensor needs to move left to reach surface
        // Positive = sensor past surface (inside), negative = sensor before surface
        distance = localX - surfaceX;
        collided = distance >= 0; // Collided if at or past surface
      } else {
        // Direction is LEFT - sensor checking from right
        distance = surfaceX - localX;
        collided = distance >= 0; // Collided if at or before surface
      }
    }

    return {
      distance,
      angle: tile.getAngle(),
      collided,
      tile,
      tileX: tileGridX,
      tileY: tileGridY,
    };
  }

  /**
   * Check ground collision using two sensors (left and right)
   * Per Sonic Physics Guide: "In Sonic 1, collision occurs only if the winning
   * distance is between -14 and +14 pixels."
   */
  checkGroundSensors(
    x: number,
    y: number,
    sensorWidth: number,
    mode: GroundMode
  ): SensorResult {
    const leftX = x - sensorWidth / 2;
    const rightX = x + sensorWidth / 2;

    const leftResult = this.castSensor(leftX, y, SensorDirection.DOWN, mode);
    const rightResult = this.castSensor(rightX, y, SensorDirection.DOWN, mode);

    // Use the result with the closer surface
    if (leftResult.collided && rightResult.collided) {
      // Both hit - use the higher surface (smaller distance)
      return leftResult.distance < rightResult.distance
        ? leftResult
        : rightResult;
    } else if (leftResult.collided) {
      return leftResult;
    } else if (rightResult.collided) {
      return rightResult;
    }

    // Neither hit
    return {
      distance: 32,
      angle: 0,
      collided: false,
    };
  }

  /**
   * Debug render - draw all tiles
   */
  debugRender(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();

    this.tiles.forEach((tile, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const worldX = gridX * this.tileSize;
      const worldY = gridY * this.tileSize;

      // Draw tile boundary
      graphics.lineStyle(1, 0x00ff00, 0.3);
      graphics.strokeRect(worldX, worldY, this.tileSize, this.tileSize);

      // Draw heightmap
      graphics.lineStyle(2, 0x00ffff, 0.8);
      graphics.beginPath();

      for (let i = 0; i < 16; i++) {
        const height = tile.getHeightAt(i);
        const px = worldX + i;
        const py = worldY + this.tileSize - height;

        if (i === 0) {
          graphics.moveTo(px, py);
        } else {
          graphics.lineTo(px, py);
        }
      }

      graphics.strokePath();

      // Draw angle indicator
      const centerX = worldX + this.tileSize / 2;
      const centerY = worldY + this.tileSize / 2;
      const angle = tile.getAngle();
      const angleRad = (angle * Math.PI) / 180;
      const lineLength = 8;

      graphics.lineStyle(1, 0xff0000, 1);
      graphics.lineBetween(
        centerX,
        centerY,
        centerX + Math.cos(angleRad) * lineLength,
        centerY + Math.sin(angleRad) * lineLength
      );
    });
  }
}
