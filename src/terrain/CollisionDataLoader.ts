import { TerrainTile, HeightArray, TileSolidity } from './TerrainTile';

/**
 * CollisionDataLoader - Loads and parses Sonic 1 collision data from binary files
 *
 * Format:
 * - Collision Array (Normal).bin: 256 tiles × 16 bytes = 4096 bytes (height arrays)
 * - Collision Array (Rotated).bin: 256 tiles × 16 bytes = 4096 bytes (width arrays)
 * - Angle Map.bin: 256 bytes (one angle per tile)
 *
 * Each tile:
 * - 16 height values (0-16) representing collision from top
 * - 16 width values (0-16) representing collision from sides
 * - 1 angle value (0-255, where 255 = snap-to-axis flag)
 */
export class CollisionDataLoader {
  private heightData: Uint8Array | null = null;
  private widthData: Uint8Array | null = null;
  private angleData: Uint8Array | null = null;
  private tiles: Map<number, TerrainTile> = new Map();

  /**
   * Load collision data from buffers (for testing or direct loading)
   */
  loadFromBuffers(
    normalBuffer: ArrayBuffer,
    rotatedBuffer: ArrayBuffer,
    angleBuffer: ArrayBuffer
  ): void {
    this.heightData = new Uint8Array(normalBuffer);
    this.widthData = new Uint8Array(rotatedBuffer);
    this.angleData = new Uint8Array(angleBuffer);

    // Verify file sizes
    if (this.heightData.length !== 4096) {
      throw new Error(`Invalid height data size: ${this.heightData.length} (expected 4096)`);
    }
    if (this.widthData.length !== 4096) {
      throw new Error(`Invalid width data size: ${this.widthData.length} (expected 4096)`);
    }
    if (this.angleData.length !== 256) {
      throw new Error(`Invalid angle data size: ${this.angleData.length} (expected 256)`);
    }

    console.log('✓ Loaded Sonic 1 collision data:', {
      tiles: 256,
      heightBytes: this.heightData.length,
      widthBytes: this.widthData.length,
      angleBytes: this.angleData.length,
    });

    // Pre-create all 256 tiles
    this.createTiles();
  }

  /**
   * Load collision data from binary files (for browser/Phaser)
   */
  async loadCollisionData(
    normalPath: string,
    rotatedPath: string,
    anglePath: string
  ): Promise<void> {
    try {
      // Fetch all three files
      const [normalResponse, rotatedResponse, angleResponse] = await Promise.all([
        fetch(normalPath),
        fetch(rotatedPath),
        fetch(anglePath),
      ]);

      if (!normalResponse.ok || !rotatedResponse.ok || !angleResponse.ok) {
        throw new Error('Failed to load collision data files');
      }

      // Convert to ArrayBuffers
      const [normalBuffer, rotatedBuffer, angleBuffer] = await Promise.all([
        normalResponse.arrayBuffer(),
        rotatedResponse.arrayBuffer(),
        angleResponse.arrayBuffer(),
      ]);

      // Use the buffer loading method
      this.loadFromBuffers(normalBuffer, rotatedBuffer, angleBuffer);
    } catch (error) {
      console.error('Failed to load collision data:', error);
      throw error;
    }
  }

  /**
   * Create TerrainTile objects from the loaded binary data
   */
  private createTiles(): void {
    if (!this.heightData || !this.widthData || !this.angleData) {
      throw new Error('Collision data not loaded');
    }

    for (let tileIndex = 0; tileIndex < 256; tileIndex++) {
      const tile = this.createTileFromIndex(tileIndex);
      this.tiles.set(tileIndex, tile);
    }

    console.log(`✓ Created ${this.tiles.size} collision tiles`);
  }

  /**
   * Create a single tile from the binary data
   */
  private createTileFromIndex(tileIndex: number): TerrainTile {
    if (!this.heightData || !this.widthData || !this.angleData) {
      throw new Error('Collision data not loaded');
    }

    // Extract height array (16 bytes starting at tileIndex * 16)
    const heightOffset = tileIndex * 16;
    const heights: number[] = [];
    for (let i = 0; i < 16; i++) {
      heights.push(this.heightData[heightOffset + i]);
    }

    // Extract width array (16 bytes starting at tileIndex * 16)
    const widthOffset = tileIndex * 16;
    const widths: number[] = [];
    for (let i = 0; i < 16; i++) {
      widths.push(this.widthData[widthOffset + i]);
    }

    // Extract angle (1 byte at tileIndex)
    const rawAngle = this.angleData[tileIndex];

    // Convert Sonic's angle format (0-255) to degrees (0-360)
    // Sonic uses 256 units per full rotation (0x00 = 0°, 0x40 = 90°, 0x80 = 180°, 0xC0 = 270°)
    // 0xFF (255) is a special "snap-to-axis" flag, treat as 0° for flat ground
    const angle = rawAngle === 0xFF
      ? 0  // Special flag: snap to axis (flat ground)
      : (rawAngle * 360) / 256;

    // Create height and width arrays
    const heightArray: HeightArray = { heights, angle };
    const widthArray: HeightArray = {
      heights: widths,
      angle: (angle + 90) % 360  // Width array is rotated 90°
    };

    // Determine solidity based on tile content
    const solidity = this.determineSolidity(heights, widths);

    return new TerrainTile(heightArray, widthArray, solidity, false, false, tileIndex);
  }

  /**
   * Determine tile solidity from height/width arrays
   */
  private determineSolidity(heights: number[], widths: number[]): TileSolidity {
    const hasHeights = heights.some(h => h > 0);
    const hasWidths = widths.some(w => w > 0);

    if (!hasHeights && !hasWidths) {
      return TileSolidity.EMPTY;
    }

    // For now, treat all tiles with collision as FULL
    // TODO: Implement TOP_ONLY detection for platforms
    return TileSolidity.FULL;
  }

  /**
   * Get a tile by index (0-255)
   */
  getTile(index: number): TerrainTile | undefined {
    if (index < 0 || index >= 256) {
      console.warn(`Invalid tile index: ${index} (must be 0-255)`);
      return undefined;
    }
    return this.tiles.get(index);
  }

  /**
   * Get the total number of loaded tiles
   */
  getTileCount(): number {
    return this.tiles.size;
  }

  /**
   * Check if collision data is loaded
   */
  isLoaded(): boolean {
    return this.tiles.size === 256;
  }
}
