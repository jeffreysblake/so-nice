import Phaser from 'phaser';
import { initializeSonicAnimations } from '../config/SonicAnimations';

/**
 * PreloadScene - Loads all game assets
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Log file loading errors
    this.load.on('loaderror', (file: any) => {
      console.error('❌ Failed to load file:', file.key, file.url);
    });

    // Load Sonic sprites
    // The Sonic spritesheet from Spriters Resource (690x1558px)
    // Contains various animations: idle, walk, run, jump, roll, etc.
    // Load with green background removal (chroma key)
    const sonicSprite = this.load.image('sonic-spritesheet', 'assets/sprites/sonic/sonic-spritesheet.png');

    // Remove green background after loading
    sonicSprite.on('complete', () => {
      this.removeGreenBackground('sonic-spritesheet');
    });

    // Load AUTHENTIC Sonic 1 Green Hill Zone tileset (decompressed from original .nem files)
    // Contains authentic Sonic 1 art tiles (256x120px = 480 tiles in 32×15 grid)
    // Each tile is 8x8 pixels from original Sonic 1 data
    // Loaded as BOTH spritesheet (for frames) and image (for tilemap compatibility)
    this.load.spritesheet('ghz-tileset', 'assets/tilesets/ghz-sonic1-tiles.png', {
      frameWidth: 8,
      frameHeight: 8
    });

    // Load HUD overlay
    // Contains numbers, letters, UI text (708x632px)
    this.load.image('hud-overlay', 'assets/sprites/ui/hud-overlay.png');

    console.log('Loading Sonic sprites from assets/');
  }

  create() {
    // Verify sprites loaded successfully
    const sonicLoaded = this.textures.exists('sonic-spritesheet');
    const tilesetLoaded = this.textures.exists('ghz-tileset');
    const hudLoaded = this.textures.exists('hud-overlay');

    console.log('Sprite loading status:');
    console.log('  Sonic:', sonicLoaded ? '✓' : '✗');
    console.log('  Tileset:', tilesetLoaded ? '✓' : '✗');
    console.log('  HUD:', hudLoaded ? '✓' : '✗');

    // Load collision data directly with fetch (more reliable than Phaser's binary loader)
    console.log('🔄 Loading Sonic 1 collision data with fetch...');

    // Use Promise to load collision data, chunk data, and block data BEFORE starting GameScene
    Promise.all([
      fetch('/assets/collision/collision-array-normal.bin'),
      fetch('/assets/collision/collision-array-rotated.bin'),
      fetch('/assets/collision/angle-map.bin'),
      fetch('/assets/maps/ghz-chunks.eni'),
      fetch('/assets/maps/ghz-collision-index.bin'),
      fetch('/assets/maps/ghz-blocks.kos'),
      fetch('/assets/maps/ghz1-layout.bin'),
    ])
      .then(([normalResponse, rotatedResponse, angleResponse, chunksResponse, collisionIndexResponse, blocksResponse, layoutResponse]) => {
        if (!normalResponse.ok || !rotatedResponse.ok || !angleResponse.ok || !chunksResponse.ok || !collisionIndexResponse.ok || !blocksResponse.ok || !layoutResponse.ok) {
          throw new Error(`HTTP errors: ${normalResponse.status}, ${rotatedResponse.status}, ${angleResponse.status}, ${chunksResponse.status}, ${collisionIndexResponse.status}, ${blocksResponse.status}, ${layoutResponse.status}`);
        }
        return Promise.all([
          normalResponse.arrayBuffer(),
          rotatedResponse.arrayBuffer(),
          angleResponse.arrayBuffer(),
          chunksResponse.arrayBuffer(),
          collisionIndexResponse.arrayBuffer(),
          blocksResponse.arrayBuffer(),
          layoutResponse.arrayBuffer(),
        ]);
      })
      .then(([normalData, rotatedData, angleData, chunksData, collisionIndexData, blocksData, layoutData]) => {
        // Store in Phaser's cache for GameScene to use
        this.cache.binary.add('collision-normal', normalData);
        this.cache.binary.add('collision-rotated', rotatedData);
        this.cache.binary.add('collision-angles', angleData);
        this.cache.binary.add('ghz-chunks', chunksData);
        this.cache.binary.add('ghz-collision-index', collisionIndexData);
        this.cache.binary.add('ghz-blocks', blocksData);
        this.cache.binary.add('ghz1-layout', layoutData);

        console.log('✅ Collision data, chunks, and blocks loaded successfully:');
        console.log('  Normal:', `${normalData.byteLength} bytes`);
        console.log('  Rotated:', `${rotatedData.byteLength} bytes`);
        console.log('  Angles:', `${angleData.byteLength} bytes`);
        console.log('  Chunks:', `${chunksData.byteLength} bytes`);
        console.log('  Collision Index:', `${collisionIndexData.byteLength} bytes`);
        console.log('  Blocks:', `${blocksData.byteLength} bytes`);
        console.log('  Layout:', `${layoutData.byteLength} bytes`);

        // NOW start the game scene after all data is loaded
        this.startGame(sonicLoaded);
      })
      .catch((error) => {
        console.error('❌ Failed to load collision data:', error);
        // Start game anyway with fallback terrain
        this.startGame(sonicLoaded);
      });
  }

  private startGame(sonicLoaded: boolean) {
    // Create fallback placeholder if sprites didn't load
    if (!sonicLoaded) {
      console.warn('Sonic sprite not loaded, creating placeholder');
      this.createPlaceholderSonic();
    } else {
      // Initialize Sonic animations from spritesheet
      console.log('Initializing Sonic animations...');
      initializeSonicAnimations(this, 'sonic-spritesheet');
    }

    // Start the main game scene
    console.log('🚀 Starting GameScene...');
    this.scene.start('GameScene');
  }

  private createPlaceholderSonic() {
    // Create a simple colored square for Sonic placeholder
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0066ff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('sonic-placeholder', 32, 32);
    graphics.destroy();
  }

  /**
   * Remove green background from sprite by making it transparent
   * This processes the texture to replace green pixels with alpha=0
   */
  private removeGreenBackground(textureKey: string) {
    const texture = this.textures.get(textureKey);
    if (!texture) {
      console.warn(`Texture ${textureKey} not found for green removal`);
      return;
    }

    const source = texture.getSourceImage() as HTMLImageElement;
    if (!source) {
      console.warn(`Could not get source image for ${textureKey}`);
      return;
    }

    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.warn('Could not get canvas context');
      return;
    }

    // Draw the image
    ctx.drawImage(source, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Process pixels: make green pixels transparent
    // The sprite uses a darker green background, not bright lime green
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is green (dark to bright green)
      // Green channel should be significantly higher than red and blue
      // Adjusted for darker green backgrounds common in sprite sheets
      const isGreen = g > r * 1.3 && g > b * 1.3 && g > 80;

      if (isGreen) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }

    // Put the processed data back
    ctx.putImageData(imageData, 0, 0);

    // Update the Phaser texture with the processed canvas
    this.textures.addCanvas(textureKey + '-processed', canvas);

    // Replace the original texture reference
    this.textures.remove(textureKey);
    this.textures.addCanvas(textureKey, canvas);

    console.log(`✓ Removed green background from ${textureKey}`);
  }
}
