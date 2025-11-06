/**
 * TerrainTile - Represents a 16x16 pixel tile with heightmap collision data
 * Based on Sonic Physics Guide tile system
 */
export var TileSolidity;
(function (TileSolidity) {
    TileSolidity["FULL"] = "full";
    TileSolidity["TOP_ONLY"] = "top_only";
    TileSolidity["SIDES_BOTTOM"] = "sides_bottom";
    TileSolidity["EMPTY"] = "empty";
})(TileSolidity || (TileSolidity = {}));
export class TerrainTile {
    heightArray;
    widthArray;
    solidity;
    flipX;
    flipY;
    width = 16;
    height = 16;
    constructor(heightArray, widthArray, // For horizontal collision
    solidity = TileSolidity.FULL, flipX = false, flipY = false) {
        this.heightArray = heightArray;
        this.widthArray = widthArray;
        this.solidity = solidity;
        this.flipX = flipX;
        this.flipY = flipY;
    }
    /**
     * Get height at a specific X position within the tile (0-15)
     */
    getHeightAt(x) {
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
    getWidthAt(y) {
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
    getAngle() {
        let angle = this.heightArray.angle;
        // Apply transformations
        if (this.flipX && !this.flipY) {
            angle = (180 - angle) % 360;
        }
        else if (!this.flipX && this.flipY) {
            angle = (360 - angle) % 360;
        }
        else if (this.flipX && this.flipY) {
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
    static FLAT = {
        heights: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
        angle: 0,
    };
    // 45-degree slope up (right)
    static SLOPE_45_UP = {
        heights: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        angle: 45,
    };
    // 45-degree slope down (right)
    static SLOPE_45_DOWN = {
        heights: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        angle: 315,
    };
    // Gentle slope up (22.5 degrees, spread across 2 tiles)
    static SLOPE_22_UP_1 = {
        heights: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
        angle: 22,
    };
    static SLOPE_22_UP_2 = {
        heights: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
        angle: 22,
    };
    // Steep slope up (67.5 degrees)
    static SLOPE_67_UP = {
        heights: [0, 2, 4, 6, 8, 10, 12, 14, 16, 16, 16, 16, 16, 16, 16, 16],
        angle: 67,
    };
    // Quarter circle - top left (for loops)
    static CURVE_TL = {
        heights: [16, 16, 16, 16, 15, 14, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0],
        angle: 45, // Average angle
    };
    // Quarter circle - top right (for loops)
    static CURVE_TR = {
        heights: [0, 0, 1, 2, 3, 5, 7, 9, 11, 13, 14, 15, 16, 16, 16, 16],
        angle: 315,
    };
    // Quarter circle - bottom left (for loops)
    static CURVE_BL = {
        heights: [16, 16, 15, 14, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0, 0, 0],
        angle: 135,
    };
    // Quarter circle - bottom right (for loops)
    static CURVE_BR = {
        heights: [0, 0, 0, 0, 1, 2, 3, 5, 7, 9, 11, 13, 14, 15, 16, 16],
        angle: 225,
    };
    // Empty tile (no collision)
    static EMPTY = {
        heights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        angle: 0,
    };
    /**
     * Create a TerrainTile from a height array definition
     */
    static createTile(heightArray, solidity = TileSolidity.FULL, flipX = false, flipY = false) {
        // Create corresponding width array (rotated 90 degrees)
        const widthArray = {
            heights: [...heightArray.heights].reverse(),
            angle: (heightArray.angle + 90) % 360,
        };
        return new TerrainTile(heightArray, widthArray, solidity, flipX, flipY);
    }
}
