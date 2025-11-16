/**
 * Kosinski Decompressor
 *
 * Authentic Kosinski (LZSS) decompression algorithm.
 * Based on Sega Retro documentation: https://segaretro.org/Kosinski_compression
 *
 * Key: "Little endian BIT order" - bytes in correct order, bits read backwards within each byte
 *
 * Decompresses to 16-bit words for block mappings (2 bytes = 1 word)
 */
export class KosinskiDecompressor {
  private data: Uint8Array;
  private position: number = 0;
  private bitfield: number = 0;
  private bitcount: number = 0;

  constructor(buffer: ArrayBuffer) {
    this.data = new Uint8Array(buffer);
  }

  /**
   * Decompress Kosinski data
   * @returns Decompressed data as Uint16Array (16-bit words)
   */
  decompress(): Uint16Array {
    const output: number[] = []; // Store bytes, convert to words at end
    let debugIterations = 0;
    const MAX_ITERATIONS = 100000; // Safety limit
    const DEBUG = false; // Detailed logging disabled

    // Initialize bitfield with first 2-byte description field
    this.bitfield = this.readWord();
    this.bitcount = 16;
    if (DEBUG) console.log(`[0] Initial bitfield: 0x${this.bitfield.toString(16).padStart(4, '0')}, bitcount: ${this.bitcount}`);

    while (true) {
      debugIterations++;
      if (debugIterations > MAX_ITERATIONS) {
        console.error(`Kosinski decompression exceeded ${MAX_ITERATIONS} iterations! Output size: ${output.length} bytes`);
        break;
      }

      // Read next bit from description field (LSB first due to little-endian bit order)
      const bit = this.getBit();
      if (DEBUG) console.log(`[${debugIterations}] Bit: ${bit}, output size: ${output.length}, pos: ${this.position}`);

      if (bit === 1) {
        // Uncompressed byte - copy as-is
        const byte = this.readByte();
        if (DEBUG) console.log(`  [${debugIterations}] Pattern: 1 (uncompressed) → byte: 0x${byte.toString(16).padStart(2, '0')}`);
        output.push(byte);
      } else {
        // Compressed data - check next bit
        const bit2 = this.getBit();
        if (DEBUG) console.log(`  [${debugIterations}] Pattern: 0${bit2}`);

        if (bit2 === 0) {
          // Inline dictionary match (00XX pattern)
          // Get 2-bit repeat count
          const countBit1 = this.getBit();
          const countBit2 = this.getBit();
          const countBits = (countBit1 << 1) | countBit2;
          const count = countBits + 2; // Increment by 2 (range: 2-5)

          // Get offset byte (added to -256)
          const offsetByte = this.readByte();
          const offset = offsetByte - 256; // Range: -256 to -1

          if (DEBUG) console.log(`  [${debugIterations}] Pattern: 00 (inline) → count: ${count}, offset: ${offset}, offsetByte: 0x${offsetByte.toString(16)}`);

          // Copy bytes from earlier in output
          for (let i = 0; i < count; i++) {
            const srcIndex = output.length + offset;
            if (srcIndex >= 0 && srcIndex < output.length) {
              output.push(output[srcIndex]);
            } else {
              if (DEBUG) console.log(`    WARNING: Invalid srcIndex ${srcIndex} (output.length: ${output.length})`);
              output.push(0); // Safety fallback
            }
          }
        } else {
          // Full dictionary match (01 pattern)
          // Read 2 bytes: [LLLLLLLL][HHHHCCC] or [LLLLLLLL][HHHHH000][CCCCCCCC]
          // 68000 byte order: bytes are swapped (same as readWord())
          const byte1 = this.readByte(); // First byte in file = low byte (LLLLLLLL)
          const byte2 = this.readByte(); // Second byte in file = high byte (HHHHCCC)

          // Extract count from lower 3 bits of HIGH byte
          const countLow = byte2 & 0x07;

          // Calculate offset: -8192 + HHHH × 256 + LLLLLLLL
          const offsetHigh = (byte2 >> 3) & 0x1F; // Top 5 bits of HIGH byte
          const offset = -8192 + (offsetHigh * 256) + byte1; // byte1 is low byte

          if (DEBUG) console.log(`  [${debugIterations}] Pattern: 01 (full) → byte1: 0x${byte1.toString(16)}, byte2: 0x${byte2.toString(16)}, offset: ${offset}, countLow: ${countLow}`);

          let count: number;
          if (countLow === 0) {
            // Extended count mode (third byte)
            const byte3 = this.readByte();
            if (DEBUG) console.log(`    [${debugIterations}] Extended count → byte3: 0x${byte3.toString(16)}`);

            if (byte3 === 0) {
              // End of compressed data
              if (DEBUG) console.log(`    [${debugIterations}] TERMINATION (byte3 === 0)`);
              break;
            } else if (byte3 === 1) {
              // Read next description field
              this.bitfield = this.readWord();
              this.bitcount = 16;
              if (DEBUG) console.log(`    [${debugIterations}] NEW DESCRIPTION FIELD: 0x${this.bitfield.toString(16).padStart(4, '0')}`);
              continue;
            } else {
              // Extended count (range: 2-257)
              count = byte3 + 1;
              if (DEBUG) console.log(`    [${debugIterations}] count: ${count}`);
            }
          } else {
            // Short count from lower 3 bits (range: 2-9)
            count = countLow + 2;
            if (DEBUG) console.log(`    [${debugIterations}] Short count: ${count}`);
          }

          // Copy bytes from earlier in output
          for (let i = 0; i < count; i++) {
            const srcIndex = output.length + offset;
            if (srcIndex >= 0 && srcIndex < output.length) {
              output.push(output[srcIndex]);
            } else {
              if (DEBUG) console.log(`    WARNING: Invalid srcIndex ${srcIndex} (output.length: ${output.length})`);
              output.push(0); // Safety fallback
            }
          }
        }
      }
    }

    // Convert bytes to 16-bit words (big-endian)
    const words: number[] = [];
    for (let i = 0; i < output.length; i += 2) {
      const high = output[i] || 0;
      const low = output[i + 1] || 0;
      words.push((high << 8) | low);
    }

    console.log(`✨ Kosinski v2 (BYTE-SWAP FIX): ${this.data.length} bytes → ${output.length} bytes (${words.length} words) in ${debugIterations} iterations`);

    return new Uint16Array(words);
  }

  /**
   * Read one bit from the bitfield (LSB first - little endian bit order)
   */
  private getBit(): number {
    if (this.bitcount === 0) {
      this.bitfield = this.readWord();
      this.bitcount = 16;
    }

    // Read from LSB (little endian bit order)
    const bit = this.bitfield & 1;
    this.bitfield = this.bitfield >>> 1;
    this.bitcount--;

    return bit;
  }

  /**
   * Read a byte from the data
   */
  private readByte(): number {
    if (this.position >= this.data.length) {
      return 0;
    }
    return this.data[this.position++];
  }

  /**
   * Read a 16-bit word (Kosinski format: bytes are swapped for 68000 compatibility)
   * File bytes: [B1] [B2] → Word value: (B2 << 8) | B1
   */
  private readWord(): number {
    const byte1 = this.readByte();  // First byte in file
    const byte2 = this.readByte();  // Second byte in file
    return (byte2 << 8) | byte1;    // Swap: byte2 is high, byte1 is low
  }
}
