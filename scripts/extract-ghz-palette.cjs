#!/usr/bin/env node

/**
 * Extract Sonic 1 Green Hill Zone palette from BGR444 format to RGB
 */

const fs = require('fs');

/**
 * Convert BGR444 color to RGB array
 * Sega Genesis uses 16-bit big-endian words: 0BBB 0GGG 0RRR
 */
function bgr444ToRgb(word) {
  // Extract 4-bit components
  const r = (word & 0x000F);       // Red: bits 0-3
  const g = (word & 0x00F0) >> 4;  // Green: bits 4-7
  const b = (word & 0x0F00) >> 8;  // Blue: bits 8-11

  // Convert from 4-bit (0-15) to 8-bit (0-255)
  // Multiply by 17 to scale: 0x0 -> 0x00, 0xF -> 0xFF
  return [r * 17, g * 17, b * 17];
}

/**
 * Read and parse GHZ palette file
 */
function extractPalette(inputPath) {
  const data = fs.readFileSync(inputPath);

  console.log(`Reading palette from: ${inputPath}`);
  console.log(`File size: ${data.length} bytes`);

  // Genesis palette: 16-bit big-endian words
  const numColors = data.length / 2;
  console.log(`Colors: ${numColors}\n`);

  const palettes = [];

  // Read all colors
  for (let i = 0; i < numColors; i++) {
    // Read 16-bit big-endian word
    const word = (data[i * 2] << 8) | data[i * 2 + 1];
    const rgb = bgr444ToRgb(word);

    palettes.push(rgb);

    // Print in format suitable for JavaScript array
    const hex = `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`;
    console.log(`  [0x${rgb[0].toString(16).padStart(2, '0').toUpperCase()}, 0x${rgb[1].toString(16).padStart(2, '0').toUpperCase()}, 0x${rgb[2].toString(16).padStart(2, '0').toUpperCase()}],     // ${i} - ${hex} (BGR444: 0x${word.toString(16).padStart(4, '0').toUpperCase()})`);
  }

  return palettes;
}

// Extract palette
const palettePath = '/tmp/s1disasm/palette/Green Hill Zone.bin';
console.log('=== Sonic 1 Green Hill Zone Palette ===\n');
extractPalette(palettePath);
