import { TileSolidity } from './TerrainTile';
export var SensorDirection;
(function (SensorDirection) {
    SensorDirection["DOWN"] = "down";
    SensorDirection["UP"] = "up";
    SensorDirection["LEFT"] = "left";
    SensorDirection["RIGHT"] = "right";
})(SensorDirection || (SensorDirection = {}));
/**
 * CollisionManager - Handles sensor-based collision detection with terrain
 */
export class CollisionManager {
    tiles = new Map();
    tileSize = 16;
    constructor(_scene) { }
    /**
     * Set a tile at a specific grid position
     */
    setTile(gridX, gridY, tile) {
        const key = `${gridX},${gridY}`;
        this.tiles.set(key, tile);
    }
    /**
     * Get a tile at a specific grid position
     */
    getTile(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        return this.tiles.get(key);
    }
    /**
     * Get tile at world position
     */
    getTileAtWorldPos(worldX, worldY) {
        const gridX = Math.floor(worldX / this.tileSize);
        const gridY = Math.floor(worldY / this.tileSize);
        return this.getTile(gridX, gridY);
    }
    /**
     * Cast a sensor and check for collision
     * Based on Sonic Physics Guide sensor system
     */
    castSensor(x, y, direction, _mode, maxDistance = 32) {
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);
        // Check current tile and adjacent tiles
        for (let i = 0; i < 2; i++) {
            let checkX = gridX;
            let checkY = gridY;
            // Adjust based on direction
            if (direction === SensorDirection.DOWN)
                checkY += i;
            else if (direction === SensorDirection.UP)
                checkY -= i;
            else if (direction === SensorDirection.RIGHT)
                checkX += i;
            else if (direction === SensorDirection.LEFT)
                checkX -= i;
            const tile = this.getTile(checkX, checkY);
            if (!tile)
                continue;
            // Check solidity
            if (!this.canSensorDetectTile(direction, tile))
                continue;
            // Get position within tile
            const tileLocalX = x - checkX * this.tileSize;
            const tileLocalY = y - checkY * this.tileSize;
            // Check collision based on direction
            const result = this.checkTileCollision(tileLocalX, tileLocalY, tile, direction, checkX, checkY);
            if (result.collided) {
                return result;
            }
        }
        // No collision found
        return {
            distance: maxDistance,
            angle: 0,
            collided: false,
        };
    }
    /**
     * Check if a sensor can detect a specific tile based on solidity
     */
    canSensorDetectTile(direction, tile) {
        if (tile.solidity === TileSolidity.EMPTY)
            return false;
        if (tile.solidity === TileSolidity.FULL)
            return true;
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
    checkTileCollision(localX, localY, tile, direction, tileGridX, tileGridY) {
        let distance = 0;
        let collided = false;
        if (direction === SensorDirection.DOWN || direction === SensorDirection.UP) {
            // Use height array
            const height = tile.getHeightAt(localX);
            if (direction === SensorDirection.DOWN) {
                // Distance from top of tile to surface
                distance = height - localY;
                collided = localY >= (this.tileSize - height);
            }
            else {
                // Direction is UP
                distance = (this.tileSize - height) - localY;
                collided = localY <= (this.tileSize - height);
            }
        }
        else {
            // Use width array for horizontal collision
            const width = tile.getWidthAt(localY);
            if (direction === SensorDirection.RIGHT) {
                distance = width - localX;
                collided = localX >= (this.tileSize - width);
            }
            else {
                // Direction is LEFT
                distance = (this.tileSize - width) - localX;
                collided = localX <= (this.tileSize - width);
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
     */
    checkGroundSensors(x, y, sensorWidth, mode) {
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
        }
        else if (leftResult.collided) {
            return leftResult;
        }
        else if (rightResult.collided) {
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
    debugRender(graphics) {
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
                }
                else {
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
            graphics.lineBetween(centerX, centerY, centerX + Math.cos(angleRad) * lineLength, centerY + Math.sin(angleRad) * lineLength);
        });
    }
}
