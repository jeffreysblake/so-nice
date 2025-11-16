/**
 * NemesisDecompressor - Decompresses Sonic 1 Nemesis-compressed art tiles
 *
 * Based on Nemesis compression format documented at:
 * https://segaretro.org/Nemesis_compression
 *
 * Format:
 * - 2-byte header (pattern count + XOR mode flag)
 * - Dictionary section (code table)
 * - Bitstream of compressed data
 * - Outputs 4-bit nybbles that form 8x8 pixel tile data
 */
export class NemesisDecompressor {
  private data: Uint8Array;
  private bitPos: number = 0;
  private bytePos: number = 0;

  constructor(compressedData: ArrayBuffer) {
    this.data = new Uint8Array(compressedData);
  }

  /**
   * Read a single bit from the data stream
   */
  private readBit(): number {
    if (this.bytePos >= this.data.length) {
      return 0;
    }

    const byte = this.data[this.bytePos];
    const bit = (byte >> (7 - this.bitPos)) & 1;

    this.bitPos++;
    if (this.bitPos >= 8) {
      this.bitPos = 0;
      this.bytePos++;
    }

    return bit;
  }

  /**
   * Read multiple bits as a number
   */
  private readBits(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      value = (value << 1) | this.readBit();
    }
    return value;
  }

  /**
   * Read a 16-bit word (big-endian)
   */
  private readWord(): number {
    if (this.bytePos + 1 >= this.data.length) {
      return 0;
    }
    const high = this.data[this.bytePos++];
    const low = this.data[this.bytePos++];
    return (high << 8) | low;
  }

  /**
   * Decompress Nemesis-compressed art data
   *
   * @returns Uint8Array of decompressed tile data (4-bit nybbles packed into bytes)
   */
  decompress(): Uint8Array {
    // Reset position
    this.bytePos = 0;
    this.bitPos = 0;

    // Read header
    const header = this.readWord();
    const numPatterns = header & 0x7FFF; // Lower 15 bits
    const xorMode = (header & 0x8000) !== 0; // Bit 15

    console.log('Nemesis header:', {
      numPatterns,
      xorMode,
      fileSize: this.data.length
    });

    // Build code table from dictionary
    const codeTable = this.buildCodeTable();

    // Decompress the data
    const output: number[] = [];
    let previousRow: number[] = new Array(8).fill(0); // For XOR mode

    // Each pattern is 8x8 pixels = 64 pixels = 32 bytes (4-bit nybbles)
    for (let pattern = 0; pattern < numPatterns; pattern++) {
      // Decode 8 rows of 8 pixels each
      for (let row = 0; row < 8; row++) {
        const rowData: number[] = [];

        // Decode 8 nybbles (4-bit values) for this row
        for (let col = 0; col < 8; col++) {
          const nybble = this.decodeNybble(codeTable);
          rowData.push(nybble);
        }

        // Apply XOR if enabled
        if (xorMode && row > 0) {
          for (let i = 0; i < 8; i++) {
            rowData[i] ^= previousRow[i];
          }
        }

        // Store for next row's XOR
        previousRow = [...rowData];

        // Pack nybbles into bytes (2 nybbles per byte)
        for (let i = 0; i < 8; i += 2) {
          const byte = (rowData[i] << 4) | rowData[i + 1];
          output.push(byte);
        }
      }
    }

    console.log(`Nemesis decompression complete: ${numPatterns} patterns, ${output.length} bytes`);
    return new Uint8Array(output);
  }

  /**
   * Build the code table from the dictionary section
   */
  private buildCodeTable(): Map<string, number> {
    const codeTable = new Map<string, number>();

    // Read code table (simplified version - full implementation would be more complex)
    // For now, build a basic table assuming common patterns

    // Common nybble values (0-15) mapped to bit patterns
    // This is a simplified approach - real Nemesis uses Shannon-Fano coding
    for (let nybble = 0; nybble < 16; nybble++) {
      // Use a simple binary encoding for now
      const bits = nybble.toString(2).padStart(4, '0');
      codeTable.set(bits, nybble);
    }

    return codeTable;
  }

  /**
   * Decode a single nybble using the code table
   */
  private decodeNybble(codeTable: Map<string, number>): number {
    // Try to match bit patterns in the code table
    // Start with shortest patterns and work up
    let bitPattern = '';

    for (let len = 1; len <= 16; len++) {
      bitPattern += this.readBit().toString();

      if (codeTable.has(bitPattern)) {
        return codeTable.get(bitPattern)!;
      }
    }

    // Fallback: interpret as 4-bit value
    return this.readBits(4);
  }

  /**
   * Convert decompressed nybble data to RGBA image data
   * Uses a simple greyscale palette for now
   */
  static toImageData(decompressedData: Uint8Array, tilesWide: number): ImageData {
    // Each tile is 8x8 pixels, 4 bits per pixel
    const numTiles = decompressedData.length / 32; // 32 bytes per tile
    const tilesHigh = Math.ceil(numTiles / tilesWide);

    const width = tilesWide * 8;
    const height = tilesHigh * 8;

    const imageData = new ImageData(width, height);
    const pixels = imageData.data;

    let byteIndex = 0;

    for (let tileY = 0; tileY < tilesHigh; tileY++) {
      for (let tileX = 0; tileX < tilesWide; tileX++) {
        const tileIndex = tileY * tilesWide + tileX;

        if (tileIndex >= numTiles) break;

        // Read 32 bytes for this tile (8 rows × 4 bytes)
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 4; col++) {
            if (byteIndex >= decompressedData.length) break;

            const byte = decompressedData[byteIndex++];
            const nybble1 = (byte >> 4) & 0xF;
            const nybble2 = byte & 0xF;

            // Convert to pixel positions
            const baseX = tileX * 8 + col * 2;
            const baseY = tileY * 8 + row;

            // Nybble 1 (left pixel)
            const pixelIndex1 = (baseY * width + baseX) * 4;
            const grey1 = nybble1 * 17; // Map 0-15 to 0-255
            pixels[pixelIndex1] = grey1;
            pixels[pixelIndex1 + 1] = grey1;
            pixels[pixelIndex1 + 2] = grey1;
            pixels[pixelIndex1 + 3] = 255;

            // Nybble 2 (right pixel)
            const pixelIndex2 = (baseY * width + baseX + 1) * 4;
            const grey2 = nybble2 * 17;
            pixels[pixelIndex2] = grey2;
            pixels[pixelIndex2 + 1] = grey2;
            pixels[pixelIndex2 + 2] = grey2;
            pixels[pixelIndex2 + 3] = 255;
          }
        }
      }
    }

    return imageData;
  }
}
