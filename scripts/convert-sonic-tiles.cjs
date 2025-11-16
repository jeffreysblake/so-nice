#!/usr/bin/env node

/**
 * Convert Sonic 1 decompressed art tiles (4-bit nybbles) to PNG spritesheet
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Sonic 1 Green Hill Zone AUTHENTIC palette (extracted from ROM)
// Palette line 1 (colors 16-31 from the full 48-color palette)
// Converted from BGR444 format used by Sega Genesis
const GHZ_PALETTE = [
  [0x00, 0x88, 0xEE],     // 0 - #0088ee - Bright blue (water/checkered)
  [0x22, 0x00, 0x00],     // 1 - #220000 - Very dark brown
  [0xEE, 0xEE, 0xEE],     // 2 - #eeeeee - White
  [0x66, 0x22, 0x00],     // 3 - #662200 - Dark brown
  [0x88, 0x44, 0x00],     // 4 - #884400 - Brown
  [0xCC, 0x66, 0x00],     // 5 - #cc6600 - Orange-brown
  [0xEE, 0x88, 0x00],     // 6 - #ee8800 - Orange
  [0xEE, 0xCC, 0x00],     // 7 - #eecc00 - Yellow
  [0x66, 0x88, 0xAA],     // 8 - #6688aa - Muted blue
  [0x66, 0x88, 0xEE],     // 9 - #6688ee - Light blue
  [0x88, 0xAA, 0xEE],     // 10 - #88aaee - Pale blue
  [0xAA, 0xCC, 0xEE],     // 11 - #aaccee - Very pale blue
  [0x00, 0x44, 0x00],     // 12 - #004400 - Very dark green
  [0x00, 0x66, 0x00],     // 13 - #006600 - Dark green
  [0x44, 0xAA, 0x00],     // 14 - #44aa00 - Bright green (grass)
  [0x88, 0xEE, 0x00],     // 15 - #88ee00 - Lime green
];

function convertTilesToPNG(inputPath, outputPath, tilesWide = 32) {
  // Read the binary tile data
  const data = fs.readFileSync(inputPath);

  // Calculate dimensions
  const TILE_SIZE = 8;
  const BYTES_PER_TILE = 32; // 8x8 pixels, 4 bits per pixel
  const numTiles = data.length / BYTES_PER_TILE;
  const tilesHigh = Math.ceil(numTiles / tilesWide);

  const width = tilesWide * TILE_SIZE;
  const height = tilesHigh * TILE_SIZE;

  console.log(`Converting ${inputPath}:`);
  console.log(`  Tiles: ${numTiles} (${tilesWide}x${tilesHigh})`);
  console.log(`  Output size: ${width}x${height}`);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill with transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  // Convert tiles
  let byteIndex = 0;
  for (let tileY = 0; tileY < tilesHigh; tileY++) {
    for (let tileX = 0; tileX < tilesWide; tileX++) {
      const tileIndex = tileY * tilesWide + tileX;
      if (tileIndex >= numTiles) break;

      // Read 32 bytes for this 8x8 tile
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
          if (byteIndex >= data.length) break;

          const byte = data[byteIndex++];
          const nybble1 = (byte >> 4) & 0xF;
          const nybble2 = byte & 0xF;

          // Calculate pixel positions
          const baseX = tileX * TILE_SIZE + col * 2;
          const baseY = tileY * TILE_SIZE + row;

          // Set pixels
          setPixel(pixels, width, baseX, baseY, GHZ_PALETTE[nybble1]);
          setPixel(pixels, width, baseX + 1, baseY, GHZ_PALETTE[nybble2]);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Save PNG
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log(`  ✓ Saved to ${outputPath}`);
      resolve();
    });
    out.on('error', reject);
  });
}

function setPixel(pixels, width, x, y, color) {
  const index = (y * width + x) * 4;
  pixels[index] = color[0];     // R
  pixels[index + 1] = color[1]; // G
  pixels[index + 2] = color[2]; // B
  pixels[index + 3] = color[0] === 0 && color[1] === 0 && color[2] === 0 ? 0 : 255; // A (transparent if black)
}

// Combine multiple tile files into one spritesheet
function combineTileFiles(inputPaths, outputPath, tilesWide = 32) {
  // Read all files and combine
  const allData = Buffer.concat(inputPaths.map(path => fs.readFileSync(path)));

  // Calculate dimensions
  const TILE_SIZE = 8;
  const BYTES_PER_TILE = 32;
  const numTiles = allData.length / BYTES_PER_TILE;
  const tilesHigh = Math.ceil(numTiles / tilesWide);

  const width = tilesWide * TILE_SIZE;
  const height = tilesHigh * TILE_SIZE;

  console.log(`Combining ${inputPaths.length} tile files:`);
  inputPaths.forEach((path, i) => {
    const data = fs.readFileSync(path);
    const tiles = data.length / BYTES_PER_TILE;
    console.log(`  [${i+1}] ${path.split('/').pop()}: ${tiles} tiles`);
  });
  console.log(`  Total: ${numTiles} tiles (${tilesWide}x${tilesHigh})`);
  console.log(`  Output size: ${width}x${height}`);

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.createImageData(width, height);
  const pixels = imageData.data;

  // Convert tiles
  let byteIndex = 0;
  for (let tileY = 0; tileY < tilesHigh; tileY++) {
    for (let tileX = 0; tileX < tilesWide; tileX++) {
      const tileIndex = tileY * tilesWide + tileX;
      if (tileIndex >= numTiles) break;

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
          if (byteIndex >= allData.length) break;

          const byte = allData[byteIndex++];
          const nybble1 = (byte >> 4) & 0xF;
          const nybble2 = byte & 0xF;

          const baseX = tileX * TILE_SIZE + col * 2;
          const baseY = tileY * TILE_SIZE + row;

          setPixel(pixels, width, baseX, baseY, GHZ_PALETTE[nybble1]);
          setPixel(pixels, width, baseX + 1, baseY, GHZ_PALETTE[nybble2]);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Save PNG
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log(`  ✓ Saved to ${outputPath}`);
      resolve();
    });
    out.on('error', reject);
  });
}

// Convert both GHZ tile files into combined spritesheet
async function main() {
  const assetsPath = '/media/decisiv/models/consult/betech/so-nice/public/assets';

  await combineTileFiles(
    [
      `${assetsPath}/art/ghz1-tiles.bin`,
      `${assetsPath}/art/ghz2-tiles.bin`
    ],
    `${assetsPath}/tilesets/ghz-sonic1-tiles.png`,
    32 // 32 tiles wide
  );

  console.log('\n✅ Conversion complete! Combined GHZ1 + GHZ2 into single tileset.');
}

main().catch(console.error);
