import Phaser from 'phaser';
import { CollisionManager } from './CollisionManager';
import { TerrainTiles, TileSolidity } from './TerrainTile';
import { CollisionDataLoader } from './CollisionDataLoader';
import { ChunkLoader } from './ChunkLoader';
import { BlockLoader } from './BlockLoader';
import { LevelLayout } from './LevelLayout';

/**
 * TerrainManager - Manages terrain tiles and rendering
 */
export class TerrainManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private collisionDataLoader: CollisionDataLoader;
  private chunkLoader: ChunkLoader;
  private blockLoader: BlockLoader;
  private levelLayout: LevelLayout;
  private graphics: Phaser.GameObjects.Graphics;
  private debugGraphics: Phaser.GameObjects.Graphics;
  private terrainRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
  private terrainImage: Phaser.GameObjects.Image | null = null;
  private tilemap: Phaser.Tilemaps.Tilemap | null = null;
  private tileLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  public debugMode = false;
  private isCollisionDataLoaded = false;
  private isChunksLoaded = false;
  private isBlocksLoaded = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.collisionManager = new CollisionManager(scene);
    this.collisionDataLoader = new CollisionDataLoader();
    this.chunkLoader = new ChunkLoader();
    this.blockLoader = new BlockLoader();
    this.levelLayout = new LevelLayout();

    // Create graphics for terrain rendering (fallback)
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-1);

    // Create graphics for debug rendering
    this.debugGraphics = scene.add.graphics();
    this.debugGraphics.setDepth(100);
  }

  /**
   * Load Sonic 1 collision data before building levels
   */
  async loadCollisionData(): Promise<void> {
    await this.collisionDataLoader.loadCollisionData(
      '/assets/collision/collision-array-normal.bin',
      '/assets/collision/collision-array-rotated.bin',
      '/assets/collision/angle-map.bin'
    );
    this.isCollisionDataLoaded = true;
    console.log('✓ TerrainManager: Sonic 1 collision data loaded');
  }

  /**
   * Load Green Hill Zone chunk definitions
   */
  async loadChunks(): Promise<void> {
    await this.chunkLoader.loadChunks(
      '/assets/maps/ghz-chunks.eni',
      '/assets/maps/ghz-collision-index.bin'
    );
    this.isChunksLoaded = true;
    console.log('✓ TerrainManager: GHZ chunks loaded');
  }

  /**
   * Load Green Hill Zone block definitions (128×128 blocks)
   */
  async loadBlocks(): Promise<void> {
    await this.blockLoader.loadBlocks('/assets/maps/ghz-blocks.kos');
    this.isBlocksLoaded = true;
    console.log('✓ TerrainManager: GHZ blocks loaded');
  }

  /**
   * Get the collision manager
   */
  getCollisionManager(): CollisionManager {
    return this.collisionManager;
  }

  /**
   * Get the collision data loader
   */
  getCollisionDataLoader(): CollisionDataLoader {
    return this.collisionDataLoader;
  }

  /**
   * Get the chunk loader
   */
  getChunkLoader(): ChunkLoader {
    return this.chunkLoader;
  }

  /**
   * Get the block loader
   */
  getBlockLoader(): BlockLoader {
    return this.blockLoader;
  }

  /**
   * Get the level layout
   */
  getLevelLayout(): LevelLayout {
    return this.levelLayout;
  }

  /**
   * Mark collision data as loaded (called from GameScene after loading from cache)
   */
  markCollisionDataLoaded(): void {
    this.isCollisionDataLoaded = this.collisionDataLoader.isLoaded();
  }

  /**
   * Mark chunks as loaded (called from GameScene after loading from cache)
   */
  markChunksLoaded(): void {
    this.isChunksLoaded = this.chunkLoader.isLoaded();
  }

  /**
   * Mark blocks as loaded (called from GameScene after loading from cache)
   */
  markBlocksLoaded(): void {
    this.isBlocksLoaded = this.blockLoader.isLoaded();
  }

  /**
   * Build Green Hill Zone - Act 1 level
   * Uses authentic Sonic 1 layout data
   */
  buildGreenHillZone(): void {
    // Check if all data is loaded
    this.markCollisionDataLoaded();
    this.markChunksLoaded();
    this.markBlocksLoaded();

    // Use authentic Sonic 1 GHZ layout
    if (this.isBlocksLoaded && this.isChunksLoaded && this.levelLayout.isLoaded() && this.isCollisionDataLoaded) {
      console.log('✓ Building authentic GHZ Act 1 from Sonic 1 layout data...');
      this.buildFromAuthenticLayout();
    } else {
      console.warn('⚠️ Authentic layout data not available, cannot build level!');
      console.log(`  Blocks: ${this.isBlocksLoaded}, Chunks: ${this.isChunksLoaded}, Layout: ${this.levelLayout.isLoaded()}, Collision: ${this.isCollisionDataLoaded}`);
    }

    // Render everything
    this.renderTerrain();
  }

  /**
   * Find a suitable spawn point in the authentic layout
   * Returns the first chunk with ground collision
   */
  findSpawnPoint(): { x: number; y: number } | null {
    // Use fixed spawn point at start of level
    // In real Sonic 1, spawn points are defined in object placement data
    const SPAWN_X = 300;
    const SPAWN_Y = 600;

    console.log(`✓ Using fixed spawn point at (${SPAWN_X}, ${SPAWN_Y})`);
    return { x: SPAWN_X, y: SPAWN_Y };
  }

  /**
   * Build terrain from authentic Sonic 1 GHZ layout data
   *
   * Per RSDKv4 analysis:
   * - Each 128x128 chunk is divided into 8x8 grid = 64 tiles of 16x16 pixels
   * - In full Sonic 1, each tile can have different collision
   * - Our simplified format: ONE collision tile index per chunk
   *
   * Strategy: Fill the bottom row of each chunk with the collision tile
   * This creates the ground surface while keeping upper areas empty for air
   */
  private buildFromAuthenticLayout(): void {
    const CHUNK_SIZE = 128; // Sonic 1 chunks are 128x128 pixels
    const TILE_SIZE = 16;   // Collision tiles are 16x16 pixels
    const TILES_PER_CHUNK = CHUNK_SIZE / TILE_SIZE; // 8 tiles per chunk dimension

    const { width, height} = this.levelLayout.getDimensions();
    console.log(`  Layout: ${width}x${height} chunks (${width * CHUNK_SIZE}x${height * CHUNK_SIZE}px)`);

    let tilesPlaced = 0;
    let chunksProcessed = 0;
    const rowsToFill = 4; // Fill bottom 4 rows of each chunk for solid ground

    // Iterate through each chunk in the layout
    for (let chunkY = 0; chunkY < height; chunkY++) {
      for (let chunkX = 0; chunkX < width; chunkX++) {
        // Get chunk index from layout
        const chunkIndex = this.levelLayout.getChunkAt(chunkX, chunkY);
        if (chunkIndex === 0) continue; // Skip empty chunks

        // Get collision tile index for this chunk
        const collisionTileIndex = this.chunkLoader.getCollisionIndex(chunkIndex);
        if (collisionTileIndex === 0xFF) continue; // Skip invalid/empty collision

        chunksProcessed++;

        // Calculate base tile coordinates for this chunk
        const baseTileX = chunkX * TILES_PER_CHUNK;
        const baseTileY = chunkY * TILES_PER_CHUNK;

        // Fill multiple rows to ensure solid ground collision

        for (let row = 0; row < rowsToFill; row++) {
          const tileY = baseTileY + (TILES_PER_CHUNK - 1 - row); // Start from bottom

          // Place collision tile across the width of the chunk
          for (let tx = 0; tx < TILES_PER_CHUNK; tx++) {
            const tileX = baseTileX + tx;

            // Get authentic collision tile from Sonic 1 data
            if (this.isCollisionDataLoaded) {
              this.placeTileFromData(tileX, tileY, collisionTileIndex);
              tilesPlaced++;
            }
          }
        }
      }
    }

    // Add spawn platform at x=300, y=600 to ensure player has ground
    // Spawn point coordinates in tiles: x=300/16=18.75, y=600/16=37.5
    const SPAWN_TILE_X = Math.floor(300 / TILE_SIZE);
    const SPAWN_TILE_Y = Math.floor(600 / TILE_SIZE);

    // Create a 10-tile wide platform centered on spawn point
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = 0; dy < 4; dy++) {
        const tileX = SPAWN_TILE_X + dx;
        const tileY = SPAWN_TILE_Y + dy;
        // Use collision tile index 9 (standard flat ground from GHZ)
        this.placeTileFromData(tileX, tileY, 9);
        tilesPlaced++;
      }
    }

    console.log(`✓ Authentic Sonic 1 terrain built!`);
    console.log(`  Chunks processed: ${chunksProcessed}/${width * height}, Tiles placed: ${tilesPlaced}`);
    console.log(`  + Added spawn platform at tile (${SPAWN_TILE_X}, ${SPAWN_TILE_Y})`);
  }

  /**
   * Fallback: Build terrain programmatically (original method)
   * Used when authentic layout data is not available
   */
  private buildProgrammaticTerrain(): void {
    const groundLevel = 41;

    // Section 1: Starting area - flat ground to build initial speed (tiles 0-30)
    this.buildFlatSection(0, 30, groundLevel);

    // Section 2: Gentle hill - small dip to get a feel for slopes (tiles 30-42)
    this.buildGentleHill(30, 42, groundLevel, 2);

    // Section 3: Half-pipe style curved section (tiles 42-59)
    this.buildRunwayToLoop(42, 5, groundLevel);
    this.buildHalfPipe(47, groundLevel);

    // Section 4: Downhill speed run (tiles 60-75)
    this.buildGentleDownhill(60, 15, groundLevel);

    // Section 5: Flat section to recover (tiles 75-85)
    this.buildFlatSection(75, 10, groundLevel + 2);

    // Section 6: Valley dip with spring (tiles 85-97)
    this.buildShallowValley(85, groundLevel + 2);

    // Section 7: Gentle uphill section (tiles 97-112)
    this.buildGentleUphill(97, 15, groundLevel);

    // Section 8: Small dip (tiles 112-126)
    this.buildGentleHill(112, 127, groundLevel, 2);

    // Section 9: Final uphill to goal (tiles 126-146)
    this.buildGentleUphill(126, 21, groundLevel - 3);

    // Section 10: Flat section (tiles 147-172)
    this.buildFlatSection(147, 25, groundLevel - 3);

    // Extended sections (tiles 172-310)
    this.buildGentleDownhill(172, 20, groundLevel - 3);
    this.buildShallowValley(192, groundLevel);
    this.buildFlatSection(204, 20, groundLevel);
    this.buildGentleHill(224, 239, groundLevel, 3);
    this.buildGentleDownhill(238, 16, groundLevel);
    this.buildFlatSection(254, 10, groundLevel + 2);
    this.buildGentleUphill(264, 15, groundLevel);
    this.buildShallowValley(279, groundLevel);
    this.buildFlatSection(291, 9, groundLevel);
    this.buildFlatSection(300, 10, groundLevel);
  }

  /**
   * Place a tile from the Sonic 1 collision data
   */
  private placeTileFromData(gridX: number, gridY: number, tileIndex: number): void {
    if (!this.isCollisionDataLoaded) {
      console.warn('Collision data not loaded! Call loadCollisionData() first.');
      return;
    }

    const tile = this.collisionDataLoader.getTile(tileIndex);
    if (tile) {
      // Debug: Log first few tiles to understand heightmap values
      if (gridX < 5 && gridY === 41) {
        console.log(`Tile ${tileIndex} at (${gridX},${gridY}):`, {
          heights: tile.heightArray.heights.slice(0, 16),
          angle: tile.heightArray.angle
        });
      }
      this.collisionManager.setTile(gridX, gridY, tile);
    } else {
      console.warn(`Invalid tile index: ${tileIndex}`);
    }
  }

  /**
   * Build a flat ground section using Sonic 1 collision data
   * Tile 255 = full 16-pixel flat ground
   */
  private buildFlatSection(startX: number, length: number, y: number): void {
    for (let x = startX; x < startX + length; x++) {
      if (this.isCollisionDataLoaded) {
        this.placeTileFromData(x, y, 255); // Tile 255 = full flat ground
      } else {
        // Fallback to programmatic tile
        const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
        this.collisionManager.setTile(x, y, tile);
      }
    }
  }

  /**
   * Build a gentle hill (up then down) - for smooth, continuous terrain
   * Creates tiles from startX to endX-1 (endX is exclusive to match convention)
   * Uses authentic Sonic 1 collision tiles when available
   */
  private buildGentleHill(startX: number, endX: number, baseY: number, height: number): void {
    const totalLength = endX - startX;
    const midX = startX + Math.floor(totalLength / 2);
    const upLength = midX - startX;
    const downLength = endX - midX;

    // Up slope - use Sonic 1 slope tiles (tiles 1-8 are various upward slopes)
    for (let i = 0; i < upLength; i++) {
      const x = startX + i;
      const y = baseY - Math.floor((i / upLength) * height);

      if (this.isCollisionDataLoaded) {
        // Tile 1-4 are gentle upward slopes in Sonic 1
        this.placeTileFromData(x, y, 1); // Authentic curved slope
      } else {
        const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
        this.collisionManager.setTile(x, y, tile);
      }
    }

    // Down slope - use Sonic 1 downward slope tiles (tiles 9-16 are downward slopes)
    for (let i = 0; i < downLength; i++) {
      const x = midX + i;
      const y = baseY - height + Math.floor((i / downLength) * height);

      if (this.isCollisionDataLoaded) {
        // Tile 9-12 are gentle downward slopes in Sonic 1
        this.placeTileFromData(x, y, 9); // Authentic curved slope
      } else {
        const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN);
        this.collisionManager.setTile(x, y, tile);
      }
    }
  }

  /**
   * Build a gentle downhill section using authentic Sonic 1 tiles
   */
  private buildGentleDownhill(startX: number, length: number, baseY: number): void {
    for (let i = 0; i < length; i++) {
      const y = baseY + Math.floor(i / 5); // Very gentle slope

      if (this.isCollisionDataLoaded) {
        // Use authentic Sonic 1 downward slope tile
        this.placeTileFromData(startX + i, y, 9);
      } else {
        this.collisionManager.setTile(
          startX + i,
          y,
          TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN)
        );
      }
    }
  }

  /**
   * Build a gentle uphill section using authentic Sonic 1 tiles
   */
  private buildGentleUphill(startX: number, length: number, baseY: number): void {
    for (let i = 0; i < length; i++) {
      const y = baseY - Math.floor(i / 5); // Very gentle slope

      if (this.isCollisionDataLoaded) {
        // Use authentic Sonic 1 upward slope tile
        this.placeTileFromData(startX + i, y, 1);
      } else {
        this.collisionManager.setTile(
          startX + i,
          y,
          TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP)
        );
      }
    }
  }

  /**
   * Build a shallow valley - gentle dip and rise
   */
  private buildShallowValley(startX: number, baseY: number): void {
    // Down into valley (gentle)
    for (let i = 0; i < 4; i++) {
      this.collisionManager.setTile(
        startX + i,
        baseY + i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN)
      );
    }

    // Valley floor
    this.buildFlatSection(startX + 4, 4, baseY + 4);

    // Up out of valley (gentle)
    for (let i = 0; i < 4; i++) {
      this.collisionManager.setTile(
        startX + 8 + i,
        baseY + 4 - i,
        TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP)
      );
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
   * Build a half-pipe style curved valley (no ceiling running required)
   * Player enters on flat ground, curves down into valley, curves back up
   *
   * @param startX - X position where half-pipe begins (tile 47)
   * @param baseY - Y position of the entry level (tile 41)
   */
  private buildHalfPipe(startX: number, baseY: number): void {
    // Half-pipe structure (14 tiles total, 47-60):
    // Entry curves down (3 tiles): 47-49
    // Valley floor (4 tiles): 50-53
    // Exit curves up (4 tiles): 54-57 ← FIXED: was 3, now 4 to bridge gap
    // Flat exit (3 tiles): 58-60

    // Entry curves - gentle descent (tiles 47-49)
    for (let i = 0; i < 3; i++) {
      const x = startX + i;
      const y = baseY + i;  // Descending: y=41, 42, 43
      this.collisionManager.setTile(x, y, TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN));
    }

    // Valley floor - flat bottom (tiles 50-53)
    this.buildFlatSection(startX + 3, 4, baseY + 3);

    // Exit curves - gentle ascent (tiles 54-57)
    // FIXED: Changed from 3 to 4 tiles to properly connect back to baseY
    for (let i = 0; i < 4; i++) {
      const x = startX + 7 + i;
      const y = baseY + 3 - i;  // Ascending: y=44, 43, 42, 41 ← Now connects!
      this.collisionManager.setTile(x, y, TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP));
    }

    // Flat exit (tiles 58-60)
    // FIXED: Shifted from startX+10 to startX+11 to account for extra exit curve tile
    this.buildFlatSection(startX + 11, 3, baseY);
  }

  /**
   * Build a complete vertical loop-de-loop (DISABLED - requires ceiling sensors)
   * Properly researched from Sonic Physics Guide
   *
   * Full vertical loops require:
   *   1. Dual-layer collision system (A/B layers)
   *   2. Layer switchers at entry/exit points
   *   3. Ceiling sensors for upside-down collision detection
   *
   * See PHYSICS_REFERENCE.md for implementation details when ready
   *
   * @param startX - X position where loop ENTRANCE begins
   * @param baseY - Y position of the loop FLOOR
   * @param radius - Loop radius in tiles
   */
  private buildFullLoop(startX: number, baseY: number, radius: number): void {
    const diameter = radius * 2;

    // Calculate section positions (NO OVERLAPS!)
    // Entrance: startX to (startX + radius - 1)
    // Left ascent: (startX) to (startX + radius - 1), going UP
    // Top: (startX) to (startX + diameter - 1), at ceiling
    // Right descent: (startX + radius) to (startX + diameter - 1), going DOWN
    // Exit: (startX + diameter) to (startX + diameter + 2)

    // LEFT SIDE - Bottom to top ascent (uses radius tiles)
    for (let i = 0; i < radius; i++) {
      const x = startX + i;
      const y = baseY - i;  // Ascending (Y decreases going up)
      const tile = i < radius / 2
        ? TerrainTiles.createTile(TerrainTiles.CURVE_BL)  // Bottom curves (135°)
        : TerrainTiles.createTile(TerrainTiles.CURVE_TL);  // Top curves (45°)
      this.collisionManager.setTile(x, y, tile);
    }

    // TOP - Ceiling section (uses diameter tiles)
    const ceilingY = baseY - radius;
    for (let i = 0; i < diameter; i++) {
      const x = startX + i;
      this.collisionManager.setTile(x, ceilingY, TerrainTiles.createTile(TerrainTiles.FLAT));
    }

    // RIGHT SIDE - Top to bottom descent (uses radius tiles)
    for (let i = 0; i < radius; i++) {
      const x = startX + radius + i;  // Offset by radius to not overlap left side
      const y = ceilingY + i;  // Descending (Y increases going down)
      const tile = i < radius / 2
        ? TerrainTiles.createTile(TerrainTiles.CURVE_TR)  // Top curves (315°)
        : TerrainTiles.createTile(TerrainTiles.CURVE_BR);  // Bottom curves (225°)
      this.collisionManager.setTile(x, y, tile);
    }

    // EXIT - Flat ground after loop (3 tiles)
    for (let i = 0; i < 3; i++) {
      const x = startX + diameter + i;
      this.collisionManager.setTile(x, baseY, TerrainTiles.createTile(TerrainTiles.FLAT));
    }
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
   * Render terrain using authentic Sonic 1 block→chunk→tile hierarchy
   * NOW USING PHASER TILEMAP for proper texture rendering
   *
   * Sonic 1 Level Architecture:
   * - Layout (48×5) → references 128×128 blocks
   * - Each block → 8×8 grid of 16×16 chunks (64 chunks per block)
   * - Each chunk → 2×2 grid of 8×8 tiles (4 tiles per chunk)
   */
  private renderTerrain(): void {
    console.log(`🎨 renderTerrain() called [${new Date().toISOString()}] - UPDATED CODE with 242 blocks support`);

    // Check if tileset is available
    const hasTileset = this.scene.textures.exists('ghz-tileset');
    console.log('  Tileset exists:', hasTileset);

    // Debug: Check texture details
    const texture = this.scene.textures.get('ghz-tileset');
    console.log('  Texture details:', {
      key: texture.key,
      frames: texture.frameTotal,
      source: texture.source?.length,
      width: texture.source?.[0]?.width,
      height: texture.source?.[0]?.height
    });

    if (!hasTileset) {
      console.warn('GHZ tileset not loaded, using fallback rendering');
      this.renderTerrainFallback();
      return;
    }

    // Check if we have all required data loaded
    const hasBlocks = this.blockLoader.isLoaded();
    const hasChunks = this.chunkLoader.isLoaded();
    console.log('  Blocks loaded:', hasBlocks);
    console.log('  Chunks loaded:', hasChunks);

    if (!hasBlocks || !hasChunks) {
      console.warn('Block or chunk data not loaded, using fallback rendering');
      this.renderTerrainFallback();
      return;
    }

    // Calculate terrain dimensions
    const { width: layoutWidth, height: layoutHeight } = this.levelLayout.getDimensions();
    const BLOCK_SIZE_PX = 128;     // 128×128 pixels per block
    const TILE_SIZE_PX = 8;        // 8×8 pixels per tile
    const TILES_PER_BLOCK = BLOCK_SIZE_PX / TILE_SIZE_PX; // 16 tiles per block dimension

    // Tilemap dimensions in TILES (not pixels)
    const tilemapWidthInTiles = layoutWidth * TILES_PER_BLOCK;
    const tilemapHeightInTiles = layoutHeight * TILES_PER_BLOCK;

    console.log(`  Layout: ${layoutWidth}×${layoutHeight} blocks`);
    console.log(`  Tilemap: ${tilemapWidthInTiles}×${tilemapHeightInTiles} tiles (${tilemapWidthInTiles * TILE_SIZE_PX}×${tilemapHeightInTiles * TILE_SIZE_PX}px)`);

    // Create blank tilemap
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
      this.tileLayer = null;
    }

    this.tilemap = this.scene.make.tilemap({
      tileWidth: TILE_SIZE_PX,
      tileHeight: TILE_SIZE_PX,
      width: tilemapWidthInTiles,
      height: tilemapHeightInTiles
    });

    console.log('  ✓ Created blank tilemap');

    // Add tileset from ghz-tileset texture
    // NOTE: With spritesheet, we need to manually set the image from the texture source
    const tileset = this.tilemap.addTilesetImage('ghz-tileset', 'ghz-tileset', TILE_SIZE_PX, TILE_SIZE_PX, 0, 0);

    if (!tileset) {
      console.error('❌ Failed to add tileset image!');
      this.renderTerrainFallback();
      return;
    }

    // Manually set the image from texture source (needed for spritesheet-based tilesets)
    const textureSource = texture.source?.[0];
    console.log('  Texture source details:', {
      exists: !!textureSource,
      sourceType: textureSource?.source?.constructor?.name,
      hasImage: !!tileset.image,
      sourceWidth: textureSource?.width,
      sourceHeight: textureSource?.height
    });

    if (textureSource) {
      // Ensure tileset has an image attached
      if (!tileset.image) {
        const imageSource = textureSource.source as HTMLImageElement;
        (tileset as any).image = imageSource;
        console.log('  ⚠️ Manually attached texture source to tileset');
      }

      // ALWAYS ensure image dimensions are set (critical for Phaser's tile calculations)
      const img = tileset.image as any;
      if (img && (!img.width || !img.height)) {
        img.width = textureSource.width;
        img.height = textureSource.height;
        console.log(`  ⚠️ Set image dimensions: ${textureSource.width}x${textureSource.height}`);
      }

      // CRITICAL: Ensure firstgid is 1 (gid 0 = empty in Phaser tilemaps)
      if ((tileset as any).firstgid === 0) {
        (tileset as any).firstgid = 1;
        console.log('  ⚠️ Fixed firstgid from 0 to 1');
      }
    }

    console.log('  ✓ Added tileset image');
    console.log('  Tileset details:', {
      name: tileset.name,
      firstgid: tileset.firstgid,
      tileWidth: tileset.tileWidth,
      tileHeight: tileset.tileHeight,
      imageWidth: tileset.image?.width,
      imageHeight: tileset.image?.height,
      total: tileset.total
    });

    // Create tile layer
    this.tileLayer = this.tilemap.createBlankLayer('terrain', tileset, 0, 0);

    if (!this.tileLayer) {
      console.error('❌ Failed to create tile layer!');
      this.renderTerrainFallback();
      return;
    }

    this.tileLayer.setDepth(0);
    console.log('  ✓ Created tile layer');

    // Populate tilemap with tiles from block→chunk→tile hierarchy
    let tileCount = 0;
    let blockCount = 0;
    const tileIndexSamples: number[] = [];
    const MAX_SAMPLES = 20;

    // Get actual frame count from texture/tileset
    const actualFrameCount = texture.frameTotal || tileset.total || 481;
    console.log(`  Tileset has ${actualFrameCount} frames available`);

    try {
      // Iterate through each block in the layout
      for (let layoutY = 0; layoutY < layoutHeight; layoutY++) {
        for (let layoutX = 0; layoutX < layoutWidth; layoutX++) {
          // Get block index from layout
          const blockIndex = this.levelLayout.getChunkAt(layoutX, layoutY);

          // Get block definition (8×8 grid of chunk indices)
          const block = this.blockLoader.getBlock(blockIndex);
          if (!block) {
            if (blockCount < 5) {
              console.log(`  Block ${blockIndex} at layout (${layoutX},${layoutY}) not found`);
            }
            continue;
          }

          blockCount++;

          // Calculate base tile position for this block
          const blockTileX = layoutX * TILES_PER_BLOCK;
          const blockTileY = layoutY * TILES_PER_BLOCK;

          // Iterate through each chunk in the block (8×8 grid of 16×16px chunks)
          for (let chunkY = 0; chunkY < 8; chunkY++) {
            for (let chunkX = 0; chunkX < 8; chunkX++) {
              // Get chunk reference from block
              const chunkArrayIndex = chunkY * 8 + chunkX;
              const chunkRef = block.chunks[chunkArrayIndex];
              if (chunkRef.index === 0) continue; // Skip empty chunks

              // Get chunk definition (2×2 grid of 8×8 tile indices)
              const chunk = this.chunkLoader.getChunk(chunkRef.index);
              if (!chunk || !chunk.tiles || chunk.tiles.length < 4) {
                if (blockCount < 5) {
                  console.log(`  ⚠️ Skipping chunk ${chunkRef.index}: ${!chunk ? 'not found' : !chunk.tiles ? 'no tiles array' : `only ${chunk.tiles.length} tiles`}`);
                }
                continue;
              }

              // Validate tile indices (now have 830 tiles from combined GHZ1+GHZ2)
              const hasBadIndices = chunk.tiles.some(t => t.tileIndex >= actualFrameCount);
              if (hasBadIndices && blockCount < 2) {
                const badIndices = chunk.tiles.filter(t => t.tileIndex >= actualFrameCount).map(t => t.tileIndex);
                console.warn(`⚠️ Chunk ${chunkRef.index} has out-of-bounds tiles: ${badIndices.join(', ')} (max: ${actualFrameCount-1})`);
              }

              // Calculate tile position for this chunk (each chunk is 2×2 tiles)
              const chunkTileX = blockTileX + (chunkX * 2);
              const chunkTileY = blockTileY + (chunkY * 2);

              // Place all 4 tiles in this chunk (2×2 grid)
              // Layout: [0]=top-left, [1]=top-right, [2]=bottom-left, [3]=bottom-right
              // If chunk is flipped, we need to reorder the tiles
              const tileOffsets = [
                { dx: 0, dy: 0 },   // Top-left
                { dx: 1, dy: 0 },   // Top-right
                { dx: 0, dy: 1 },   // Bottom-left
                { dx: 1, dy: 1 }    // Bottom-right
              ];

              for (let i = 0; i < 4; i++) {
                try {
                  // Safely access tile reference with bounds checking
                  if (!chunk.tiles || i >= chunk.tiles.length) {
                    if (blockCount < 3) {
                      console.warn(`⚠️ Block at (${layoutX},${layoutY}) chunk ${chunkRef.index}: tiles array issue (len=${chunk.tiles?.length}, i=${i})`);
                    }
                    continue;
                  }

                  const tileRef = chunk.tiles[i];
                  if (!tileRef) {
                    if (blockCount < 3) {
                      console.warn(`⚠️ Block at (${layoutX},${layoutY}) chunk ${chunkRef.index}: tile ${i} is null/undefined`);
                    }
                    continue; // Skip missing tiles
                  }

                  // Safety check on tileOffsets access
                  const offset = tileOffsets[i];
                  if (!offset) {
                    console.error(`❌ tileOffsets[${i}] is undefined! tileOffsets:`, tileOffsets);
                    continue;
                  }

                  // Apply chunk-level flipping to tile positions
                  let dx = offset.dx;
                  let dy = offset.dy;
                if (chunkRef.xFlip) {
                  dx = 1 - dx;  // Flip horizontally: 0→1, 1→0
                }
                if (chunkRef.yFlip) {
                  dy = 1 - dy;  // Flip vertically: 0→1, 1→0
                }

                const tileX = chunkTileX + dx;
                const tileY = chunkTileY + dy;

                // Bounds check and wrap tile index
                let tileIndex = tileRef.tileIndex;

                // Skip tiles that are out of bounds (use modulo to wrap)
                if (tileIndex >= actualFrameCount) {
                  if (blockCount < 3) {
                    console.warn(`⚠️ Tile index ${tileIndex} out of bounds (max ${actualFrameCount}), wrapping with modulo`);
                  }
                  tileIndex = tileIndex % actualFrameCount;
                }

                // putTileAt expects tileIndex + 1 (0 = empty, 1+ = tile)
                const phaserTileIndex = tileIndex + 1;

                // Double-check the final index is valid before calling putTileAt
                if (phaserTileIndex > actualFrameCount) {
                  console.error(`❌ phaserTileIndex ${phaserTileIndex} exceeds frame count ${actualFrameCount}, skipping`);
                  continue; // Skip this tile
                }

                const tile = this.tileLayer.putTileAt(phaserTileIndex, tileX, tileY);

                if (tile) {
                  // Apply combined flip flags (chunk flip XOR tile flip)
                  tile.flipX = chunkRef.xFlip !== tileRef.flipX;  // XOR for combined flip
                  tile.flipY = chunkRef.yFlip !== tileRef.flipY;
                  tileCount++;

                  // Collect samples for debugging
                  if (tileIndexSamples.length < MAX_SAMPLES) {
                    tileIndexSamples.push(phaserTileIndex);
                  }
                }
                } catch (error) {
                  console.error(`❌ Error rendering tile ${i} in chunk ${chunkRef.index} at block (${layoutX},${layoutY}):`, error);
                  throw error; // Re-throw to see full stack
                }
              }
            }
          }
        }
      }

      console.log(`✓ Authentic GHZ terrain rendered! Blocks: ${blockCount}, Tiles: ${tileCount}`);
      console.log(`  Sample tile indices (first ${tileIndexSamples.length}):`, tileIndexSamples.join(', '));
      console.log(`  Using Phaser Tilemap with proper texture rendering!`);

    } catch (error) {
      console.error('❌ Error in renderTerrain():', error);
      console.error('  Rendered so far:', tileCount, 'tiles from', blockCount, 'blocks');
      throw error;
    }
  }

  private renderTerrainFallback(): void {
    this.graphics.clear();

    const tileSize = 16;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 100; x++) {
        const tile = this.collisionManager.getTile(x, y);
        if (!tile) continue;

        const worldX = x * tileSize;
        const worldY = y * tileSize;

        let color = 0x8b4513; // Brown for ground
        if (tile.solidity === TileSolidity.TOP_ONLY) {
          color = 0x4169e1; // Blue for platforms
        }

        this.graphics.fillStyle(color, 1);
        for (let px = 0; px < 16; px++) {
          const height = tile.getHeightAt(px);
          if (height > 0) {
            this.graphics.fillRect(worldX + px, worldY + tileSize - height, 1, height);
          }
        }

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
