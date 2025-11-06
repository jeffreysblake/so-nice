#!/usr/bin/env node

/**
 * Interactive Sprite Setup Guide
 * Helps user download and verify sprites manually
 *
 * Usage: node scripts/setup-sprites.js
 */

import { existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Sprite definitions
const SPRITES = [
  {
    id: 'sonic',
    name: 'Sonic Character Sprites',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/21628/',
    savePath: 'public/assets/sprites/sonic/sonic-spritesheet.png',
    description: 'Sonic animations (idle, walk, run, jump, roll, hurt)',
    instructions: [
      'Click the link above to open the sprite page',
      'Click the download button (usually near the top or bottom)',
      'Save the PNG file to the location shown above',
    ],
  },
  {
    id: 'tileset',
    name: 'Green Hill Zone Tileset',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/27190/',
    savePath: 'public/assets/tilesets/green-hill-zone.png',
    description: 'Level tiles (grass, dirt, slopes, loops)',
    instructions: [
      'Click the link to open the Green Hill Zone tileset page',
      'Download the sprite sheet',
      'Save to the path shown above',
    ],
  },
  {
    id: 'hud',
    name: 'HUD Overlay',
    priority: 1,
    pageUrl: 'https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/37424/',
    savePath: 'public/assets/sprites/ui/hud-overlay.png',
    description: 'Numbers, letters, UI text (SCORE, TIME, RINGS)',
    instructions: [
      'Open the HUD overlay page',
      'Download the sprite sheet',
      'Save to the UI assets folder',
    ],
  },
];

async function checkFile(filePath) {
  const fullPath = join(projectRoot, filePath);

  if (!existsSync(fullPath)) {
    return { exists: false };
  }

  try {
    const stats = await stat(fullPath);
    return {
      exists: true,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
    };
  } catch (error) {
    return { exists: false };
  }
}

function printHeader(title) {
  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  ${title}`, colors.bright);
  log('═'.repeat(70) + '\n', colors.cyan);
}

function printSeparator() {
  log('─'.repeat(70), colors.dim);
}

async function promptUser(rl, question) {
  const answer = await rl.question(`${colors.yellow}${question}${colors.reset} `);
  return answer.trim().toLowerCase();
}

async function setupSprite(rl, sprite, index, total) {
  printSeparator();
  log(`\n[${index}/${total}] ${sprite.name}`, colors.bright + colors.magenta);
  log(`Priority: ${sprite.priority === 1 ? 'ESSENTIAL' : 'OPTIONAL'}`, colors.cyan);
  log(`Description: ${sprite.description}`, colors.dim);

  // Check if already exists
  const fileCheck = await checkFile(sprite.savePath);

  if (fileCheck.exists) {
    log(`\n✓ Already downloaded! (${fileCheck.sizeKB} KB)`, colors.green);
    log(`  Location: ${sprite.savePath}`, colors.dim);

    const replace = await promptUser(rl, '\nReplace this file? (y/N):');
    if (replace !== 'y' && replace !== 'yes') {
      log('Skipping...', colors.yellow);
      return { skipped: true };
    }
  }

  // Download instructions
  log('\n📥 Download Instructions:', colors.bright);
  log(`\n  ${colors.cyan}${sprite.pageUrl}${colors.reset}\n`);

  sprite.instructions.forEach((instruction, i) => {
    log(`  ${i + 1}. ${instruction}`);
  });

  log(`\n💾 Save Location:`, colors.bright);
  log(`  ${colors.green}${sprite.savePath}${colors.reset}\n`);

  // Wait for user confirmation
  const downloaded = await promptUser(rl, 'Have you downloaded this sprite? (y/N):');

  if (downloaded === 'y' || downloaded === 'yes') {
    // Verify file exists
    const verifyCheck = await checkFile(sprite.savePath);

    if (verifyCheck.exists) {
      log(`\n✓ Verified! File found (${verifyCheck.sizeKB} KB)`, colors.green);
      return { success: true };
    } else {
      log(`\n✗ File not found at expected location`, colors.red);
      log(`  Expected: ${sprite.savePath}`, colors.dim);
      log(`  Please make sure the file is saved in the correct location.`, colors.yellow);
      return { failed: true };
    }
  } else {
    log('Skipped. You can download this later.', colors.yellow);
    return { skipped: true };
  }
}

async function showSummary() {
  printHeader('Installation Summary');

  const results = [];

  for (const sprite of SPRITES) {
    const check = await checkFile(sprite.savePath);
    results.push({
      name: sprite.name,
      priority: sprite.priority,
      ...check,
    });

    const status = check.exists
      ? `${colors.green}✓ Installed (${check.sizeKB} KB)${colors.reset}`
      : `${colors.red}✗ Missing${colors.reset}`;

    log(`${status}  ${sprite.name}`);
  }

  // Summary stats
  const installed = results.filter(r => r.exists).length;
  const total = results.length;
  const essential = results.filter(r => r.priority === 1);
  const essentialInstalled = essential.filter(r => r.exists).length;

  log('');
  printSeparator();
  log(`\nTotal: ${installed}/${total} sprites installed`, colors.bright);
  log(`Essential: ${essentialInstalled}/${essential.length} installed`,
      essentialInstalled === essential.length ? colors.green : colors.yellow);

  if (installed === total) {
    log('\n🎉 All sprites are ready! Run: npm run dev', colors.green);
  } else if (essentialInstalled === essential.length) {
    log('\n✓ All essential sprites installed! Game is playable.', colors.green);
    log('You can add optional sprites later for more features.', colors.dim);
  } else {
    log('\n⚠ Some essential sprites are missing.', colors.yellow);
    log('The game won\'t look right without them. Run this script again to complete setup.', colors.dim);
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    printHeader('Sonic Platformer - Sprite Setup');

    log('This interactive guide will help you download sprites from The Spriters Resource.');
    log('Sprites are © SEGA and are for non-commercial fan projects only.\n');

    // Check current status
    log('Checking current installation status...\n', colors.dim);

    let hasAny = false;
    for (const sprite of SPRITES) {
      const check = await checkFile(sprite.savePath);
      if (check.exists) {
        hasAny = true;
        log(`  ✓ ${sprite.name} (${check.sizeKB} KB)`, colors.green);
      }
    }

    if (!hasAny) {
      log('  No sprites found yet.', colors.dim);
    }

    log('');
    const proceed = await promptUser(rl, 'Would you like to set up sprites now? (Y/n):');

    if (proceed === 'n' || proceed === 'no') {
      log('\nSetup cancelled. Run this script again when ready.', colors.yellow);
      rl.close();
      return;
    }

    // Setup each sprite
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
    };

    for (let i = 0; i < SPRITES.length; i++) {
      const sprite = SPRITES[i];
      const result = await setupSprite(rl, sprite, i + 1, SPRITES.length);

      if (result.success) results.success++;
      else if (result.skipped) results.skipped++;
      else if (result.failed) results.failed++;
    }

    // Final summary
    printHeader('Setup Complete');

    log(`Successfully downloaded: ${results.success}`, colors.green);
    log(`Skipped: ${results.skipped}`, colors.yellow);
    log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.dim);

    log('');
    await showSummary();

  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\nSetup interrupted. Run this script again to continue.', colors.yellow);
  process.exit(0);
});

main().catch(error => {
  log(`\nError: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
