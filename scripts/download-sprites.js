#!/usr/bin/env node

/**
 * Sprite Download Script
 * Downloads essential sprites from The Spriters Resource
 *
 * Usage: node scripts/download-sprites.js
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Sprite definitions with direct download attempts
const SPRITES = [
  {
    name: 'Sonic Character Sprites',
    category: 'Player',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/21628/',
    // Direct image URLs - these may need to be updated
    imageUrl: 'https://www.spriters-resource.com/resources/sheets/21/21628.png',
    savePath: 'public/assets/sprites/sonic/sonic-spritesheet.png',
    description: 'All Sonic animations (idle, walk, run, jump, roll)',
  },
  {
    name: 'Green Hill Zone Tileset',
    category: 'Level Art',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/27190/',
    imageUrl: 'https://www.spriters-resource.com/resources/sheets/27/27190.png',
    savePath: 'public/assets/tilesets/green-hill-zone.png',
    description: 'Grass, dirt, slopes, loops, platform tiles',
  },
  {
    name: 'HUD Overlay',
    category: 'UI',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/37424/',
    imageUrl: 'https://www.spriters-resource.com/resources/sheets/37/37424.png',
    savePath: 'public/assets/sprites/ui/hud-overlay.png',
    description: 'Numbers, letters, score/rings/time labels',
  },
  {
    name: 'Rings',
    category: 'Items',
    priority: 2,
    pageUrl: 'https://www.spriters-resource.com/sega_genesis/sonicth1/',
    imageUrl: null, // Will need manual download
    savePath: 'public/assets/sprites/items/rings.png',
    description: 'Ring rotation animation and sparkle effects',
    manual: true,
  },
  {
    name: 'Badniks (Enemies)',
    category: 'Enemies',
    priority: 2,
    pageUrl: 'https://www.spriters-resource.com/sega_genesis/sonicth1/',
    imageUrl: null,
    savePath: 'public/assets/sprites/enemies/badniks.png',
    description: 'Motobug, Crabmeat, and other enemy robots',
    manual: true,
  },
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Download file with retry logic
 */
async function downloadFile(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logInfo(`Attempting download (${attempt}/${retries}): ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('image')) {
        throw new Error(`Invalid content type: ${contentType}. Expected image.`);
      }

      const buffer = await response.arrayBuffer();

      if (buffer.byteLength < 1000) {
        throw new Error(`File too small (${buffer.byteLength} bytes). Likely not an image.`);
      }

      return Buffer.from(buffer);
    } catch (error) {
      logWarning(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < retries) {
        const delay = attempt * 2000; // Exponential backoff
        logInfo(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return null;
}

/**
 * Ensure directory exists
 */
async function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Download a single sprite
 */
async function downloadSprite(sprite) {
  const fullPath = join(projectRoot, sprite.savePath);

  // Check if already exists
  if (existsSync(fullPath)) {
    logWarning(`Skipping ${sprite.name} - already exists at ${sprite.savePath}`);
    return { success: true, skipped: true };
  }

  // Manual download required
  if (sprite.manual || !sprite.imageUrl) {
    logWarning(`${sprite.name} requires manual download`);
    log(`  Page: ${sprite.pageUrl}`, colors.cyan);
    log(`  Save to: ${sprite.savePath}`, colors.cyan);
    return { success: false, manual: true };
  }

  // Attempt automated download
  log(`\nDownloading ${sprite.name}...`, colors.bright);
  log(`  From: ${sprite.imageUrl}`);
  log(`  To: ${sprite.savePath}`);

  const buffer = await downloadFile(sprite.imageUrl);

  if (!buffer) {
    logError(`Failed to download ${sprite.name}`);
    logInfo(`Please download manually from: ${sprite.pageUrl}`);
    return { success: false, manual: true };
  }

  // Save file
  await ensureDir(fullPath);
  await writeFile(fullPath, buffer);

  logSuccess(`Downloaded ${sprite.name} (${(buffer.length / 1024).toFixed(2)} KB)`);
  return { success: true, skipped: false };
}

/**
 * Main download function
 */
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Sonic Platformer - Sprite Download Script', colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);

  logInfo('This script will download essential sprites for the game.');
  logInfo('Sprites are sourced from The Spriters Resource.');
  log('');

  // Sort by priority
  const sortedSprites = [...SPRITES].sort((a, b) => a.priority - b.priority);

  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    manual: 0,
  };

  // Download each sprite
  for (const sprite of sortedSprites) {
    try {
      const result = await downloadSprite(sprite);

      if (result.skipped) {
        results.skipped++;
      } else if (result.success) {
        results.success++;
      } else if (result.manual) {
        results.manual++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logError(`Error processing ${sprite.name}: ${error.message}`);
      results.failed++;
    }
  }

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Download Summary', colors.bright);
  log('='.repeat(60), colors.cyan);
  logSuccess(`Successfully downloaded: ${results.success}`);
  logWarning(`Already existed (skipped): ${results.skipped}`);
  logWarning(`Require manual download: ${results.manual}`);
  logError(`Failed: ${results.failed}`);

  // Manual download instructions
  if (results.manual > 0) {
    log('\n' + '='.repeat(60), colors.yellow);
    log('  Manual Download Required', colors.bright);
    log('='.repeat(60), colors.yellow);
    log('\nSome sprites require manual download. Please visit:', colors.yellow);
    log('\nhttps://www.spriters-resource.com/sega_genesis/sonicth1/\n', colors.cyan);
    log('Look for these sprite sheets:', colors.yellow);

    const manualSprites = SPRITES.filter(s => s.manual || (!s.imageUrl && results.manual > 0));
    manualSprites.forEach(sprite => {
      log(`\n  ${sprite.name}`, colors.bright);
      log(`  Description: ${sprite.description}`);
      log(`  Save to: ${sprite.savePath}`, colors.cyan);
    });
  }

  // Next steps
  log('\n' + '='.repeat(60), colors.green);
  log('  Next Steps', colors.bright);
  log('='.repeat(60), colors.green);
  log('\n1. Verify downloaded sprites in public/assets/');
  log('2. Complete any manual downloads if needed');
  log('3. Run the game: npm run dev');
  log('4. Sprites will be loaded automatically\n');

  // Exit code
  if (results.failed > 0 && results.success === 0) {
    process.exit(1);
  }
}

// Run script
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
