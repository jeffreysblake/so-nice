import { KosinskiDecompressor } from '../utils/KosinskiDecompressor';

/**
 * BlockDefinition - Represents a 128x128 block made of 8x8 grid of chunks
 *
 * In Sonic 1, a block is a 128×128 pixel section made up of:
 * - 64 chunks arranged in 8×8 grid
 * - Each chunk is 16×16 pixels
 * - Each chunk reference includes the chunk index plus flip flags
 */
export interface ChunkReference {
  index: number;   // Chunk index (0-255)
  xFlip: boolean;  // Horizontal flip
  yFlip: boolean;  // Vertical flip
  solidity: number; // Solidity flags (bits 13-15)
}

export interface BlockDefinition {
  chunks: ChunkReference[]; // 64 chunk references in 8x8 layout
}

/**
 * BlockLoader - Loads and parses Green Hill Zone block definitions
 */
export class BlockLoader {
  private blocks: BlockDefinition[] = [];

  /**
   * Load block data from Kosinski-compressed file
   */
  async loadBlocks(blocksPath: string): Promise<void> {
    try {
      const response = await fetch(blocksPath);
      if (!response.ok) {
        throw new Error(`Failed to load blocks: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      this.loadFromBuffer(data);
    } catch (error) {
      console.error('Failed to load blocks:', error);
      throw error;
    }
  }

  /**
   * Load block data from ArrayBuffer (for Phaser cache)
   */
  loadFromBuffer(buffer: ArrayBuffer): void {
    // Decompress blocks using Kosinski decompression
    const decompressor = new KosinskiDecompressor(buffer);
    const decompressedData = decompressor.decompress();

    console.log(`Kosinski decompression complete: ${decompressedData.length} words`);

    // Parse block definitions
    // Each block = 64 words (8x8 grid of chunk references)
    // Word format: SSSY XIII IIII IIII
    // Bits 0-7: Chunk index (256 possible chunks)
    // Bit 11 (X): X-flip flag
    // Bit 12 (Y): Y-flip flag
    // Bits 13-15 (SSS): Solidity flags
    const CHUNKS_PER_BLOCK = 64; // 8x8 grid
    const numBlocks = Math.floor(decompressedData.length / CHUNKS_PER_BLOCK);

    for (let i = 0; i < numBlocks; i++) {
      const offset = i * CHUNKS_PER_BLOCK;
      const chunks: ChunkReference[] = [];

      // Read 64 chunk references (8x8 grid)
      for (let j = 0; j < CHUNKS_PER_BLOCK; j++) {
        const word = decompressedData[offset + j];

        // Parse the word according to Sonic 1 format
        const chunkIndex = word & 0xFF;           // Bits 0-7: Chunk index
        const xFlip = (word & 0x800) !== 0;       // Bit 11: X-flip
        const yFlip = (word & 0x1000) !== 0;      // Bit 12: Y-flip
        const solidity = (word >> 13) & 0x7;      // Bits 13-15: Solidity

        chunks.push({
          index: chunkIndex,
          xFlip,
          yFlip,
          solidity
        });
      }

      this.blocks.push({ chunks });
    }

    console.log(`✓ Loaded ${this.blocks.length} blocks (128×128 each)`);
  }

  /**
   * Get block definition by index
   */
  getBlock(index: number): BlockDefinition | undefined {
    if (index < 0 || index >= this.blocks.length) {
      return undefined;
    }
    return this.blocks[index];
  }

  /**
   * Check if blocks are loaded
   */
  isLoaded(): boolean {
    return this.blocks.length > 0;
  }

  /**
   * Get total number of blocks
   */
  getBlockCount(): number {
    return this.blocks.length;
  }
}
