import { EnigmaDecompressor } from '../utils/EnigmaDecompressor';

/**
 * ChunkDefinition - Represents a 16x16 chunk made of 4 8x8 tiles in 2x2 layout
 *
 * In Sonic 1, a chunk is a 16x16 pixel block made up of:
 * - 4 tiles arranged in 2x2 grid
 * - Each tile is 8x8 pixels
 * - Each tile reference includes: tile index + flip flags + palette
 */
export interface ChunkDefinition {
  tiles: TileReference[]; // 4 tile references (top-left, top-right, bottom-left, bottom-right)
}

export interface TileReference {
  tileIndex: number;      // Which 8x8 tile from the tileset
  flipX: boolean;         // Horizontal flip
  flipY: boolean;         // Vertical flip
  palette: number;        // Palette line (0-3)
  priority: boolean;      // Priority flag
}

/**
 * ChunkLoader - Loads and parses Green Hill Zone chunk definitions
 */
export class ChunkLoader {
  private chunks: ChunkDefinition[] = [];
  private collisionIndex: Uint8Array | null = null;

  /**
   * Load chunk data from Enigma-compressed file
   */
  async loadChunks(chunksPath: string, collisionIndexPath: string): Promise<void> {
    try {
      // Load both files
      const [chunksResponse, collisionResponse] = await Promise.all([
        fetch(chunksPath),
        fetch(collisionIndexPath)
      ]);

      if (!chunksResponse.ok || !collisionResponse.ok) {
        throw new Error('Failed to load chunk files');
      }

      const [chunksData, collisionData] = await Promise.all([
        chunksResponse.arrayBuffer(),
        collisionResponse.arrayBuffer()
      ]);

      this.loadFromBuffers(chunksData, collisionData);
    } catch (error) {
      console.error('Failed to load chunks:', error);
      throw error;
    }
  }

  /**
   * Load chunk data from ArrayBuffers (for Phaser cache)
   */
  loadFromBuffers(chunksBuffer: ArrayBuffer, collisionIndexBuffer: ArrayBuffer): void {
    // Decompress chunks
    const decompressor = new EnigmaDecompressor(chunksBuffer);
    const decompressedTiles = decompressor.decompress(0);

    console.log(`Decompressed ${decompressedTiles.length} tile references`);

    // Parse chunk definitions (map16 format - Sonic 1/2/3)
    // Each 16×16 block = 4 consecutive words (8 bytes) in row-major order
    // Word layout: TL, TR, BL, BR (2×2 grid of 8×8 tiles)
    const WORDS_PER_BLOCK = 4;  // Standard Sonic map16 format
    const numChunks = Math.floor(decompressedTiles.length / WORDS_PER_BLOCK);

    console.log(`  Parsing ${numChunks} blocks (16×16) from ${decompressedTiles.length} words (${WORDS_PER_BLOCK} words per block)`);

    for (let i = 0; i < numChunks; i++) {
      const offset = i * WORDS_PER_BLOCK;
      const tiles: TileReference[] = [];

      // Read 4 consecutive words as tiles: TL, TR, BL, BR
      for (let t = 0; t < WORDS_PER_BLOCK; t++) {
        const word = decompressedTiles[offset + t];
        tiles.push(this.parseTileWord(word));
      }

      this.chunks.push({ tiles });
    }

    // Load collision index
    this.collisionIndex = new Uint8Array(collisionIndexBuffer);

    console.log(`✓ Loaded ${this.chunks.length} chunks, ${this.collisionIndex.length} collision entries`);
  }

  /**
   * Parse a 16-bit tile word into its components
   *
   * Format (big-endian):
   * PCCVHTTT TTTTTTTT
   * P = Priority (bit 15)
   * CC = Palette (bits 13-14)
   * V = Vertical flip (bit 12)
   * H = Horizontal flip (bit 11)
   * T = Tile index (bits 0-10, 11 bits = 0-2047)
   */
  private parseTileWord(word: number): TileReference {
    return {
      priority: (word & 0x8000) !== 0,
      palette: (word >> 13) & 0x3,
      flipY: (word & 0x1000) !== 0,
      flipX: (word & 0x0800) !== 0,
      tileIndex: word & 0x07FF
    };
  }

  /**
   * Get chunk definition by index
   * Returns empty chunk for any missing indices (should have 242 blocks loaded now)
   */
  getChunk(index: number): ChunkDefinition | undefined {
    if (index < 0 || index >= this.chunks.length) {
      // Return empty/transparent block for missing indices
      // With correct 4-word format, we should have 242 blocks which covers most references
      return {
        tiles: [
          { tileIndex: 0, flipX: false, flipY: false, palette: 0, priority: false },
          { tileIndex: 0, flipX: false, flipY: false, palette: 0, priority: false },
          { tileIndex: 0, flipX: false, flipY: false, palette: 0, priority: false },
          { tileIndex: 0, flipX: false, flipY: false, palette: 0, priority: false }
        ]
      };
    }
    return this.chunks[index];
  }

  /**
   * Get collision tile index for a chunk
   */
  getCollisionIndex(chunkIndex: number): number {
    if (!this.collisionIndex || chunkIndex < 0 || chunkIndex >= this.collisionIndex.length) {
      return 0xFF; // Empty/invalid
    }
    return this.collisionIndex[chunkIndex];
  }

  /**
   * Check if chunks are loaded
   */
  isLoaded(): boolean {
    return this.chunks.length > 0 && this.collisionIndex !== null;
  }

  /**
   * Get total number of chunks
   */
  getChunkCount(): number {
    return this.chunks.length;
  }
}
