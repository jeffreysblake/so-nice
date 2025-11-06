import Phaser from 'phaser';
import { CollisionManager } from './CollisionManager';
import { TerrainTiles, TileSolidity } from './TerrainTile';

/**
 * TerrainManager - Manages terrain tiles and rendering
 */
export class TerrainManager {
  private collisionManager: CollisionManager;
  private graphics: Phaser.GameObjects.Graphics;
  private debugGraphics: Phaser.GameObjects.Graphics;
  public debugMode = true;

  constructor(scene: Phaser.Scene) {
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
  getCollisionManager(): CollisionManager {
    return this.collisionManager;
  }

  /**
   * Build Green Hill Zone - Act 1 inspired level
   */
  buildGreenHillZone(): void {
    const groundLevel = 41;

    // Section 1: Starting area with gentle introduction (tiles 0-30)
    this.buildFlatSection(0, 20, groundLevel);

    // Small hill to build speed
    this.buildHill(20, 26, groundLevel, 3);

    // Section 2: First loop-de-loop! (tiles 35-55)
    this.buildRunwayToLoop(30, 35, groundLevel);
    this.buildFullLoop(40, groundLevel - 8, 6); // 6-tile radius loop

    // Section 3: High path / Low path split (tiles 60-90)
    this.buildPathSplit(60, groundLevel);

    // Section 4: Downhill run with speed boost (tiles 95-110)
    this.buildDownhillRun(95, groundLevel);

    // Section 5: Valley with spring (tiles 115-130)
    this.buildValley(115, groundLevel);

    // Section 6: Second smaller loop (tiles 140-155)
    this.buildFullLoop(145, groundLevel - 6, 4); // Smaller 4-tile radius

    // Section 7: Final platforming section (tiles 160-190)
    this.buildPlatformSection(160, groundLevel);

    // Section 8: Goal area (tiles 195-210)
    this.buildFlatSection(195, 15, groundLevel);

    // Render everything
    this.renderTerrain();
  }

  /**
   * Build a flat ground section
   */
  private buildFlatSection(startX: number, length: number, y: number): void {
    for (let x = startX; x < startX + length; x++) {
      const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
      this.collisionManager.setTile(x, y, tile);
    }
  }

  /**
   * Build a hill (up then down)
   */
  private buildHill(startX: number, endX: number, baseY: number, height: number): void {
    const midX = Math.floor((startX + endX) / 2);
    const slopeLength = midX - startX;

    // Up slope
    for (let i = 0; i < slopeLength; i++) {
      const x = startX + i;
      const y = baseY - Math.floor((i / slopeLength) * height);
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
      this.collisionManager.setTile(x, y, tile);
    }

    // Down slope
    for (let i = 0; i < slopeLength; i++) {
      const x = midX + i;
      const y = baseY - height + Math.floor((i / slopeLength) * height);
      const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN);
      this.collisionManager.setTile(x, y, tile);
    }
  }

  /**
   * Build runway leading to loop
   */
  private buildRunwayToLoop(startX: number, length: number, y: number): void {
    for (let x = startX; x < startX + length; x++) {
      this.collisionManager.setTile(x, y, TerrainTiles.createTile(TerrainTiles.FLAT));
    }
  }

  /**
   * Build a complete vertical loop-de-loop
   */
  private buildFullLoop(centerX: number, centerY: number, radius: number): void {
    // Build circular loop using curve tiles
    const diameter = radius * 2;

    // Bottom approach
    for (let i = -2; i < 0; i++) {
      this.collisionManager.setTile(
        centerX + i,
        centerY + radius,
        TerrainTiles.createTile(TerrainTiles.FLAT)
      );
    }

    // Left side - bottom to top
    for (let i = 0; i < radius; i++) {
      const tile = i < radius / 2
        ? TerrainTiles.createTile(TerrainTiles.CURVE_BL)
        : TerrainTiles.createTile(TerrainTiles.CURVE_TL);
      this.collisionManager.setTile(centerX - radius + i, centerY + radius - i, tile);
    }

    // Top of loop (ceiling)
    for (let i = 0; i < diameter; i++) {
      this.collisionManager.setTile(
        centerX - radius + i,
        centerY - radius,
        TerrainTiles.createTile(TerrainTiles.FLAT)
      );
    }

    // Right side - top to bottom
    for (let i = 0; i < radius; i++) {
      const tile = i < radius / 2
        ? TerrainTiles.createTile(TerrainTiles.CURVE_TR)
        : TerrainTiles.createTile(TerrainTiles.CURVE_BR);
      this.collisionManager.setTile(centerX + radius - i, centerY - radius + i, tile);
    }

    // Bottom exit
    for (let i = 0; i < 3; i++) {
      this.collisionManager.setTile(
        centerX + radius + i,
        centerY + radius,
        TerrainTiles.createTile(TerrainTiles.FLAT)
      );
    }
  }

  /**
   * Build high/low path split
   */
  private buildPathSplit(startX: number, baseY: number): void {
    // Low path (ground level)
    this.buildFlatSection(startX, 30, baseY);

    // High path (elevated)
    this.buildFlatSection(startX + 5, 25, baseY - 8);

    // Ramp to high path
    for (let i = 0; i < 4; i++) {
      this.collisionManager.setTile(
        startX + i,
        baseY - i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP)
      );
    }

    // Ramp down from high path
    for (let i = 0; i < 4; i++) {
      this.collisionManager.setTile(
        startX + 26 + i,
        baseY - 8 + i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN)
      );
    }
  }

  /**
   * Build downhill speed run
   */
  private buildDownhillRun(startX: number, baseY: number): void {
    for (let i = 0; i < 15; i++) {
      const y = baseY - 10 + i;
      this.collisionManager.setTile(
        startX + i,
        y,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN)
      );
    }

    // Flat section at bottom
    this.buildFlatSection(startX + 15, 10, baseY + 5);
  }

  /**
   * Build valley with spring
   */
  private buildValley(startX: number, baseY: number): void {
    // Down into valley
    for (let i = 0; i < 6; i++) {
      this.collisionManager.setTile(
        startX + i,
        baseY + i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN)
      );
    }

    // Valley floor
    this.buildFlatSection(startX + 6, 4, baseY + 6);

    // Up out of valley
    for (let i = 0; i < 6; i++) {
      this.collisionManager.setTile(
        startX + 10 + i,
        baseY + 6 - i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP)
      );
    }
  }

  /**
   * Build platforming section with gaps
   */
  private buildPlatformSection(startX: number, baseY: number): void {
    // Platform 1
    this.buildFlatSection(startX, 8, baseY);

    // Gap (4 tiles)

    // Platform 2 (elevated)
    this.buildFlatSection(startX + 12, 8, baseY - 4);

    // Gap (4 tiles)

    // Platform 3 (ground level)
    this.buildFlatSection(startX + 24, 10, baseY);
  }

  /**
   * Build a test level with various slopes and features
   */
  buildTestLevel(): void {
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
  private renderTerrain(): void {
    this.graphics.clear();

    // Iterate through all tiles and render them
    const tileSize = 16;

    // We need to iterate the collision manager's tiles
    // For now, let's render a simple representation
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 100; x++) {
        const tile = this.collisionManager.getTile(x, y);
        if (!tile) continue;

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
            this.graphics.fillRect(
              worldX + px,
              worldY + tileSize - height,
              1,
              height
            );
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
  update(): void {
    if (this.debugMode) {
      this.collisionManager.debugRender(this.debugGraphics);
    } else {
      this.debugGraphics.clear();
    }
  }

  /**
   * Toggle debug mode
   */
  toggleDebug(): void {
    this.debugMode = !this.debugMode;
  }
}
