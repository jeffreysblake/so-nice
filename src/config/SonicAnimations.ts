/**
 * Sonic Animation Configuration
 * Defines frame regions and animation sequences for Sonic sprites
 *
 * The Sonic spritesheet from Spriters Resource (690x1558px) contains
 * various animation frames arranged in a non-uniform grid.
 *
 * Frame coordinates are approximate and may need adjustment after viewing the spritesheet.
 */

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationConfig {
  name: string;
  frames: SpriteFrame[];
  frameRate: number;
  repeat: number; // -1 for loop, 0 for play once
}

/**
 * Sonic 1 Genesis sprite dimensions (approximate)
 * - Standing/Idle: ~29x39 pixels
 * - Running: ~34x40 pixels
 * - Rolling: ~30x30 pixels (ball form)
 * - Jumping: ~30x30 pixels (ball form)
 */

export const SONIC_ANIMATIONS: Record<string, AnimationConfig> = {
  // Idle/Standing animation - from "Campaign" section, "Idle" column
  // Each sprite is in a 78x78 box, we extract the full box
  idle: {
    name: 'sonic-idle',
    frames: [
      // Standing still frames from Campaign section, Idle column (vertical stack)
      { x: 24, y: 243, width: 78, height: 78 },
      { x: 24, y: 321, width: 78, height: 78 },
      { x: 24, y: 399, width: 78, height: 78 },
    ],
    frameRate: 8,
    repeat: -1, // Loop
  },

  // Walking animation - from "Basic Motion" section
  // Sprites are in 78x78 boxes arranged horizontally
  walk: {
    name: 'sonic-walk',
    frames: [
      // Walking cycle frames from Basic Motion section (horizontal row)
      { x: 24, y: 346, width: 78, height: 78 },
      { x: 102, y: 346, width: 78, height: 78 },
      { x: 180, y: 346, width: 78, height: 78 },
      { x: 258, y: 346, width: 78, height: 78 },
      { x: 336, y: 346, width: 78, height: 78 },
      { x: 414, y: 346, width: 78, height: 78 },
    ],
    frameRate: 12,
    repeat: -1,
  },

  // Running animation - from "Full Speed" section
  // Sprites are in 78x78 boxes arranged horizontally
  run: {
    name: 'sonic-run',
    frames: [
      // Running cycle from Full Speed section (horizontal row)
      { x: 24, y: 507, width: 78, height: 78 },
      { x: 102, y: 507, width: 78, height: 78 },
      { x: 180, y: 507, width: 78, height: 78 },
      { x: 258, y: 507, width: 78, height: 78 },
    ],
    frameRate: 16,
    repeat: -1,
  },

  // Jumping/Rolling (spin ball) - from "Rolling / Jumping" section
  // Sprites are in 78x78 boxes arranged horizontally
  jump: {
    name: 'sonic-jump',
    frames: [
      // Spin ball animation from Rolling / Jumping section (horizontal row)
      { x: 24, y: 624, width: 78, height: 78 },
      { x: 102, y: 624, width: 78, height: 78 },
      { x: 180, y: 624, width: 78, height: 78 },
      { x: 258, y: 624, width: 78, height: 78 },
    ],
    frameRate: 20,
    repeat: -1,
  },

  // Rolling (same as jump for now)
  roll: {
    name: 'sonic-roll',
    frames: [
      { x: 24, y: 624, width: 78, height: 78 },
      { x: 102, y: 624, width: 78, height: 78 },
      { x: 180, y: 624, width: 78, height: 78 },
      { x: 258, y: 624, width: 78, height: 78 },
    ],
    frameRate: 20,
    repeat: -1,
  },

  // Spin dash - uses roll frames but with faster animation to show charging
  spindash: {
    name: 'sonic-spindash',
    frames: [
      { x: 24, y: 624, width: 78, height: 78 },
      { x: 102, y: 624, width: 78, height: 78 },
      { x: 180, y: 624, width: 78, height: 78 },
      { x: 258, y: 624, width: 78, height: 78 },
    ],
    frameRate: 30, // Faster than roll to show charging effect
    repeat: -1,
  },
};

/**
 * Helper to create Phaser animation from config
 */
export function createSonicAnimation(
  scene: Phaser.Scene,
  textureKey: string,
  config: AnimationConfig
): void {
  // Check if animation already exists
  if (scene.anims.exists(config.name)) {
    return;
  }

  // Get the texture
  const texture = scene.textures.get(textureKey);
  if (!texture) {
    console.error(`Texture '${textureKey}' not found`);
    return;
  }

  // Create texture frames from sprite regions
  config.frames.forEach((frame, index) => {
    const frameName = `${config.name}_${index}`;

    // Add frame to texture if not already added
    if (!texture.has(frameName)) {
      texture.add(
        frameName,
        0, // sourceIndex - always 0 for single images
        frame.x,
        frame.y,
        frame.width,
        frame.height
      );
    }
  });

  // Generate frame configuration for animation
  const frameConfigs = config.frames.map((_frame, index) => ({
    key: textureKey,
    frame: `${config.name}_${index}`,
  }));

  // Create the animation
  scene.anims.create({
    key: config.name,
    frames: frameConfigs,
    frameRate: config.frameRate,
    repeat: config.repeat,
  });
}

/**
 * Initialize all Sonic animations
 */
export function initializeSonicAnimations(scene: Phaser.Scene, textureKey: string = 'sonic-spritesheet'): void {
  // Only initialize if texture exists
  if (!scene.textures.exists(textureKey)) {
    console.warn(`Cannot initialize Sonic animations: texture '${textureKey}' not found`);
    return;
  }

  // Create all animations
  Object.values(SONIC_ANIMATIONS).forEach(config => {
    try {
      createSonicAnimation(scene, textureKey, config);
    } catch (error) {
      console.error(`Failed to create animation '${config.name}':`, error);
    }
  });

  console.log('Sonic animations initialized:', Object.keys(SONIC_ANIMATIONS));
}

/**
 * Get animation name based on player state
 */
export function getSonicAnimationForState(
  isGrounded: boolean,
  isRolling: boolean,
  isJumping: boolean,
  groundSpeed: number,
  isSpindashing: boolean = false
): string {
  // Spin dashing takes priority over other states
  if (isSpindashing) {
    return 'sonic-spindash';
  }

  // Jumping/in air
  if (!isGrounded || isJumping) {
    return 'sonic-jump';
  }

  // Rolling
  if (isRolling) {
    return 'sonic-roll';
  }

  // Ground movement based on speed
  const absSpeed = Math.abs(groundSpeed);

  if (absSpeed < 0.5) {
    return 'sonic-idle';
  } else if (absSpeed < 3.0) {
    return 'sonic-walk';
  } else {
    return 'sonic-run';
  }
}
