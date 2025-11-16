/**
 * EnigmaDecompressor - Decompresses Sonic 1 Enigma-compressed chunk data
 *
 * Based on Enigma compression format documented at:
 * https://segaretro.org/Enigma_compression
 *
 * Format:
 * - 6-byte header
 * - Variable-length compressed data
 * - Outputs 16-bit words (tile references)
 */
export class EnigmaDecompressor {
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
    const high = this.data[this.bytePos++];
    const low = this.data[this.bytePos++];
    return (high << 8) | low;
  }

  /**
   * Decompress the Enigma-compressed data
   *
   * @param startTile - Starting art tile value to add to each output word
   * @returns Array of 16-bit tile values
   */
  decompress(startTile: number = 0): Uint16Array {
    const output: number[] = [];

    // Read 6-byte header
    const bitsPerInlineCopy = this.data[0];
    const flagsBitfield = this.data[1];
    this.bytePos = 2;
    const incrementalCopyWord = this.readWord();
    const literalCopyWord = this.readWord();

    console.log('Enigma header:', {
      bitsPerInlineCopy,
      flagsBitfield,
      incrementalCopyWord,
      literalCopyWord,
      startTile
    });

    // Reset to start of compressed data stream (after 6-byte header)
    this.bytePos = 6;
    this.bitPos = 0;

    let currentIncrementalWord = incrementalCopyWord;

    // Process compressed data
    while (this.bytePos < this.data.length) {
      // Read first bit to determine format
      const firstBit = this.readBit();

      let typeCode: number;
      let repeatCount: number;

      if (firstBit === 0) {
        // 2 type bits + 4 repeat count bits
        typeCode = this.readBits(1);
        repeatCount = this.readBits(4);
      } else {
        // 3 type bits + 4 repeat count bits
        typeCode = this.readBits(2);
        repeatCount = this.readBits(4);
        typeCode |= 0b100; // Set bit 2 to indicate 3-bit mode
      }

      repeatCount += 1; // Repeat count is (value + 1)

      // Process based on type code
      switch (typeCode) {
        case 0b00: // Incremental copy
          for (let i = 0; i < repeatCount; i++) {
            output.push(currentIncrementalWord + startTile);
            currentIncrementalWord++;
          }
          break;

        case 0b01: // Literal copy
          for (let i = 0; i < repeatCount; i++) {
            output.push(literalCopyWord + startTile);
          }
          break;

        case 0b100: // Inline copy
          for (let i = 0; i < repeatCount; i++) {
            const inlineValue = this.readBits(bitsPerInlineCopy);
            // Apply flags from header
            const flags = (flagsBitfield & 0xF8) << 8; // Upper 5 bits
            const tileValue = flags | inlineValue;
            output.push(tileValue + startTile);
          }
          break;

        case 0b101: // Inline copy with increment
          {
            const inlineValue = this.readBits(bitsPerInlineCopy);
            const flags = (flagsBitfield & 0xF8) << 8;
            let tileValue = flags | inlineValue;
            for (let i = 0; i < repeatCount; i++) {
              output.push(tileValue + startTile);
              tileValue++;
            }
          }
          break;

        case 0b110: // Inline copy with decrement
          {
            const inlineValue = this.readBits(bitsPerInlineCopy);
            const flags = (flagsBitfield & 0xF8) << 8;
            let tileValue = flags | inlineValue;
            for (let i = 0; i < repeatCount; i++) {
              output.push(tileValue + startTile);
              tileValue--;
            }
          }
          break;

        case 0b111: // Special: either termination or multi-value
          if (repeatCount === 0xF) {
            // Termination code
            console.log(`Enigma decompression complete: ${output.length} tiles`);
            return new Uint16Array(output);
          } else {
            // Multiple inline values
            for (let i = 0; i < repeatCount; i++) {
              const inlineValue = this.readBits(bitsPerInlineCopy);
              const flags = (flagsBitfield & 0xF8) << 8;
              const tileValue = flags | inlineValue;
              output.push(tileValue + startTile);
            }
          }
          break;
      }
    }

    console.log(`Enigma decompression ended: ${output.length} tiles`);
    return new Uint16Array(output);
  }
}
