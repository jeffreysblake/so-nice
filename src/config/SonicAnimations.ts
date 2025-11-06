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
  // Idle/Standing animation
  idle: {
    name: 'sonic-idle',
    frames: [
      // Standing still, waiting animation frames
      // These are typically in the top-left of the spritesheet
      { x: 8, y: 8, width: 29, height: 39 },
      { x: 45, y: 8, width: 29, height: 39 },
      { x: 82, y: 8, width: 29, height: 39 },
      { x: 119, y: 8, width: 29, height: 39 },
    ],
    frameRate: 8,
    repeat: -1, // Loop
  },

  // Walking animation
  walk: {
    name: 'sonic-walk',
    frames: [
      // Walking cycle frames
      { x: 8, y: 60, width: 32, height: 40 },
      { x: 48, y: 60, width: 32, height: 40 },
      { x: 88, y: 60, width: 32, height: 40 },
      { x: 128, y: 60, width: 32, height: 40 },
      { x: 168, y: 60, width: 32, height: 40 },
      { x: 208, y: 60, width: 32, height: 40 },
    ],
    frameRate: 12,
    repeat: -1,
  },

  // Running animation
  run: {
    name: 'sonic-run',
    frames: [
      // Running cycle - faster leg movement
      { x: 8, y: 112, width: 34, height: 40 },
      { x: 50, y: 112, width: 34, height: 40 },
      { x: 92, y: 112, width: 34, height: 40 },
      { x: 134, y: 112, width: 34, height: 40 },
    ],
    frameRate: 16,
    repeat: -1,
  },

  // Jumping/Rolling (spin ball)
  jump: {
    name: 'sonic-jump',
    frames: [
      // Spin ball animation - used for jumping and rolling
      { x: 8, y: 164, width: 30, height: 30 },
      { x: 46, y: 164, width: 30, height: 30 },
      { x: 84, y: 164, width: 30, height: 30 },
      { x: 122, y: 164, width: 30, height: 30 },
    ],
    frameRate: 20,
    repeat: -1,
  },

  // Rolling (same as jump for now)
  roll: {
    name: 'sonic-roll',
    frames: [
      { x: 8, y: 164, width: 30, height: 30 },
      { x: 46, y: 164, width: 30, height: 30 },
      { x: 84, y: 164, width: 30, height: 30 },
      { x: 122, y: 164, width: 30, height: 30 },
    ],
    frameRate: 20,
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
  groundSpeed: number
): string {
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
