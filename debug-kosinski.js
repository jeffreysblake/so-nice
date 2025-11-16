/**
 * Debug script to test Kosinski decompressor
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the compiled TypeScript
const { KosinskiDecompressor } = await import('./dist/utils/KosinskiDecompressor.js');

// Read the GHZ blocks file
const filePath = join(__dirname, 'public/assets/maps/ghz-blocks.kos');
const buffer = readFileSync(filePath).buffer;

console.log(`\n=== Kosinski Decompressor Debug ===`);
console.log(`File: ${filePath}`);
console.log(`Size: ${buffer.byteLength} bytes\n`);

// Show first 32 bytes in hex
const view = new Uint8Array(buffer);
console.log('First 32 bytes:');
for (let i = 0; i < 32; i += 16) {
  const hex = Array.from(view.slice(i, i + 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
  console.log(`  ${i.toString(16).padStart(4, '0')}: ${hex}`);
}
console.log();

// Run decompressor
try {
  const decompressor = new KosinskiDecompressor(buffer);
  const result = decompressor.decompress();

  console.log(`\n=== Result ===`);
  console.log(`Output: ${result.length} words (${result.length * 2} bytes)`);
  console.log(`Expected blocks: ~${Math.floor(result.length / 64)} (each block = 64 words)`);
} catch (error) {
  console.error('\n=== ERROR ===');
  console.error(error);
}
