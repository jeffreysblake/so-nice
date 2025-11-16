/**
 * LevelLayout - Manages Sonic 1 level layout data
 *
 * In Sonic 1, level layouts are stored as a 2D grid of chunk indices.
 * Each level has a foreground layout that specifies which 128x128 chunks
 * appear at each position in the level.
 *
 * Format (based on s1disasm):
 * - First 2 bytes might be width/height or flags
 * - Remaining bytes are chunk indices (1 byte per chunk)
 * - Layout is row-major (left-to-right, top-to-bottom)
 */
export class LevelLayout {
  private layoutData: Uint8Array | null = null;
  private width: number = 0;
  private height: number = 0;

  /**
   * Load level layout from binary file
   */
  async loadLayout(layoutPath: string): Promise<void> {
    try {
      const response = await fetch(layoutPath);
      if (!response.ok) {
        throw new Error(`Failed to load layout: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      this.loadFromBuffer(arrayBuffer);
    } catch (error) {
      console.error('Failed to load level layout:', error);
      throw error;
    }
  }

  /**
   * Load layout from ArrayBuffer (for Phaser cache)
   */
  loadFromBuffer(buffer: ArrayBuffer): void {
    const data = new Uint8Array(buffer);

    // Parse header
    // In Sonic 1 GHZ, the format appears to be:
    // Byte 0: Width - 1
    // Byte 1: Height - 1
    // Remaining: Layout data
    this.width = data[0] + 1;
    this.height = data[1] + 1;

    // Extract layout data (skip first 2 header bytes)
    this.layoutData = data.slice(2);

    const expectedSize = this.width * this.height;
    const actualSize = this.layoutData.length;

    console.log(`✓ Level layout loaded: ${this.width}x${this.height} chunks`);
    console.log(`  Expected data: ${expectedSize} bytes, Actual: ${actualSize} bytes`);

    // If sizes don't match, adjust interpretation
    if (actualSize !== expectedSize) {
      console.warn(`⚠️ Layout size mismatch! Adjusting interpretation...`);

      // Maybe there's no header? Try using full data
      if (buffer.byteLength === 240) {
        // 240 bytes could be 48x5 or 40x6 or 30x8 etc.
        // GHZ is typically wide and short, so try 48x5
        this.width = 48;
        this.height = 5;
        this.layoutData = new Uint8Array(buffer);
        console.log(`  Trying ${this.width}x${this.height} (no header)`);
      }
    }
  }

  /**
   * Get chunk index at a given layout grid position
   * @param gridX - X position in chunk grid (not pixels!)
   * @param gridY - Y position in chunk grid (not pixels!)
   * @returns Chunk index, or 0 if out of bounds
   */
  getChunkAt(gridX: number, gridY: number): number {
    if (!this.layoutData) {
      return 0;
    }

    // Clamp to layout bounds
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return 0;
    }

    const index = gridY * this.width + gridX;
    if (index >= this.layoutData.length) {
      return 0;
    }

    return this.layoutData[index];
  }

  /**
   * Get chunk index at a world position (in pixels)
   * Each chunk is 128x128 pixels in Sonic 1
   * @param worldX - World X position in pixels
   * @param worldY - World Y position in pixels
   * @returns Chunk index
   */
  getChunkAtWorldPos(worldX: number, worldY: number): number {
    const CHUNK_SIZE = 128; // Sonic 1 uses 128x128 pixel chunks
    const gridX = Math.floor(worldX / CHUNK_SIZE);
    const gridY = Math.floor(worldY / CHUNK_SIZE);
    return this.getChunkAt(gridX, gridY);
  }

  /**
   * Check if layout is loaded
   */
  isLoaded(): boolean {
    return this.layoutData !== null;
  }

  /**
   * Get layout dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get layout width in pixels
   */
  getWidthPixels(): number {
    return this.width * 128;
  }

  /**
   * Get layout height in pixels
   */
  getHeightPixels(): number {
    return this.height * 128;
  }
}
