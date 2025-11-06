import { CollisionManager } from './CollisionManager';
import { TerrainTiles, TileSolidity } from './TerrainTile';
/**
 * TerrainManager - Manages terrain tiles and rendering
 */
export class TerrainManager {
    collisionManager;
    graphics;
    debugGraphics;
    debugMode = true;
    constructor(scene) {
        this.collisionManager = new CollisionManager(scene);
        // Create graphics for terrain rendering
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(-1);
        // Create graphics for debug rendering
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(100);
    }
    /**
     * Get the collision manager
     */
    getCollisionManager() {
        return this.collisionManager;
    }
    /**
     * Build a test level with various slopes and features
     */
    buildTestLevel() {
        // Create a long ground section
        for (let x = 0; x < 60; x++) {
            const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
            this.collisionManager.setTile(x, 41, tile);
        }
        // Add a 45-degree slope up
        for (let x = 20; x < 24; x++) {
            const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
            this.collisionManager.setTile(x, 41 - (x - 20), tile);
        }
        // Flat platform at top of slope
        for (let x = 24; x < 30; x++) {
            const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
            this.collisionManager.setTile(x, 37, tile);
        }
        // 45-degree slope down
        for (let x = 30; x < 34; x++) {
            const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN);
            this.collisionManager.setTile(x, 37 + (x - 30), tile);
        }
        // Gentle slope section (22.5 degrees)
        for (let x = 40; x < 44; x++) {
            const tile = x < 42
                ? TerrainTiles.createTile(TerrainTiles.SLOPE_22_UP_1)
                : TerrainTiles.createTile(TerrainTiles.SLOPE_22_UP_2);
            this.collisionManager.setTile(x, 41, tile);
        }
        // Add a small loop section (simplified for now)
        // Bottom of loop
        this.collisionManager.setTile(50, 41, TerrainTiles.createTile(TerrainTiles.FLAT));
        this.collisionManager.setTile(51, 41, TerrainTiles.createTile(TerrainTiles.FLAT));
        // Loop entry
        this.collisionManager.setTile(52, 41, TerrainTiles.createTile(TerrainTiles.CURVE_BL));
        this.collisionManager.setTile(52, 40, TerrainTiles.createTile(TerrainTiles.CURVE_TL));
        // Top of loop
        this.collisionManager.setTile(53, 40, TerrainTiles.createTile(TerrainTiles.FLAT));
        this.collisionManager.setTile(54, 40, TerrainTiles.createTile(TerrainTiles.FLAT));
        // Loop exit
        this.collisionManager.setTile(55, 40, TerrainTiles.createTile(TerrainTiles.CURVE_TR));
        this.collisionManager.setTile(55, 41, TerrainTiles.createTile(TerrainTiles.CURVE_BR));
        // Continue flat ground
        for (let x = 56; x < 80; x++) {
            const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
            this.collisionManager.setTile(x, 41, tile);
        }
        // Render the terrain
        this.renderTerrain();
    }
    /**
     * Render terrain tiles to graphics
     */
    renderTerrain() {
        this.graphics.clear();
        // Iterate through all tiles and render them
        const tileSize = 16;
        // We need to iterate the collision manager's tiles
        // For now, let's render a simple representation
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 100; x++) {
                const tile = this.collisionManager.getTile(x, y);
                if (!tile)
                    continue;
                const worldX = x * tileSize;
                const worldY = y * tileSize;
                // Determine color based on tile type
                let color = 0x8b4513; // Brown for ground
                if (tile.solidity === TileSolidity.TOP_ONLY) {
                    color = 0x4169e1; // Blue for platforms
                }
                // Draw tile with heightmap
                this.graphics.fillStyle(color, 1);
                for (let px = 0; px < 16; px++) {
                    const height = tile.getHeightAt(px);
                    if (height > 0) {
                        this.graphics.fillRect(worldX + px, worldY + tileSize - height, 1, height);
                    }
                }
                // Draw border
                this.graphics.lineStyle(1, 0x654321, 0.3);
                this.graphics.strokeRect(worldX, worldY, tileSize, tileSize);
            }
        }
    }
    /**
     * Update debug rendering
     */
    update() {
        if (this.debugMode) {
            this.collisionManager.debugRender(this.debugGraphics);
        }
        else {
            this.debugGraphics.clear();
        }
    }
    /**
     * Toggle debug mode
     */
    toggleDebug() {
        this.debugMode = !this.debugMode;
    }
}
