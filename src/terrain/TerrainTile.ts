/**
 * TerrainTile - Represents a 16x16 pixel tile with heightmap collision data
 * Based on Sonic Physics Guide tile system
 */

export interface HeightArray {
  heights: number[];  // 16 values, 0-16 pixels
  angle: number;      // 0-360 degrees, or 255 for snap-to-axis
}

export enum TileSolidity {
  FULL = 'full',           // All sensors detect
  TOP_ONLY = 'top_only',   // Only downward sensors
  SIDES_BOTTOM = 'sides_bottom',  // Upward and horizontal sensors
  EMPTY = 'empty',         // No collision
}

export class TerrainTile {
  public readonly width = 16;
  public readonly height = 16;

  constructor(
    public readonly heightArray: HeightArray,
    public readonly widthArray: HeightArray,  // For horizontal collision
    public readonly solidity: TileSolidity = TileSolidity.FULL,
    public readonly flipX: boolean = false,
    public readonly flipY: boolean = false
  ) {}

  /**
   * Get height at a specific X position within the tile (0-15)
   */
  getHeightAt(x: number): number {
    const index = Math.floor(Math.max(0, Math.min(15, x)));
    let height = this.heightArray.heights[index];

    // Apply flipping
    if (this.flipY) {
      height = 16 - height;
    }

    return height;
  }

  /**
   * Get width at a specific Y position within the tile (0-15)
   */
  getWidthAt(y: number): number {
    const index = Math.floor(Math.max(0, Math.min(15, y)));
    let width = this.widthArray.heights[index];

    // Apply flipping
    if (this.flipX) {
      width = 16 - width;
    }

    return width;
  }

  /**
   * Get the angle of this tile, accounting for flipping
   */
  getAngle(): number {
    let angle = this.heightArray.angle;

    // Apply transformations
    if (this.flipX && !this.flipY) {
      angle = (180 - angle) % 360;
    } else if (!this.flipX && this.flipY) {
      angle = (360 - angle) % 360;
    } else if (this.flipX && this.flipY) {
      angle = (angle + 180) % 360;
    }

    return angle;
  }
}

/**
 * Predefined terrain tiles
 */
export class TerrainTiles {
  // Flat ground tile
  static readonly FLAT: HeightArray = {
    heights: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    angle: 0,
  };

  // 45-degree slope up (right)
  static readonly SLOPE_45_UP: HeightArray = {
    heights: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    angle: 45,
  };

  // 45-degree slope down (right)
  static readonly SLOPE_45_DOWN: HeightArray = {
    heights: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    angle: 315,
  };

  // Gentle slope up (22.5 degrees, spread across 2 tiles)
  static readonly SLOPE_22_UP_1: HeightArray = {
    heights: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
    angle: 22,
  };

  static readonly SLOPE_22_UP_2: HeightArray = {
    heights: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    angle: 22,
  };

  // Steep slope up (67.5 degrees)
  static readonly SLOPE_67_UP: HeightArray = {
    heights: [0, 2, 4, 6, 8, 10, 12, 14, 16, 16, 16, 16, 16, 16, 16, 16],
    angle: 67,
  };

  // Quarter circle - top left (for loops)
  static readonly CURVE_TL: HeightArray = {
    heights: [16, 16, 16, 16, 15, 14, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0],
    angle: 45,  // Average angle
  };

  // Quarter circle - top right (for loops)
  static readonly CURVE_TR: HeightArray = {
    heights: [0, 0, 1, 2, 3, 5, 7, 9, 11, 13, 14, 15, 16, 16, 16, 16],
    angle: 315,
  };

  // Quarter circle - bottom left (for loops)
  static readonly CURVE_BL: HeightArray = {
    heights: [16, 16, 15, 14, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0, 0, 0],
    angle: 135,
  };

  // Quarter circle - bottom right (for loops)
  static readonly CURVE_BR: HeightArray = {
    heights: [0, 0, 0, 0, 1, 2, 3, 5, 7, 9, 11, 13, 14, 15, 16, 16],
    angle: 225,
  };

  // Empty tile (no collision)
  static readonly EMPTY: HeightArray = {
    heights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    angle: 0,
  };

  /**
   * Create a TerrainTile from a height array definition
   */
  static createTile(
    heightArray: HeightArray,
    solidity: TileSolidity = TileSolidity.FULL,
    flipX = false,
    flipY = false
  ): TerrainTile {
    // Create corresponding width array (rotated 90 degrees)
    const widthArray: HeightArray = {
      heights: [...heightArray.heights].reverse(),
      angle: (heightArray.angle + 90) % 360,
    };

    return new TerrainTile(heightArray, widthArray, solidity, flipX, flipY);
  }
}
