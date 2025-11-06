import Phaser from 'phaser';

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

    // Load Sonic sprites
    // The Sonic spritesheet from Spriters Resource (690x1558px)
    // Contains various animations: idle, walk, run, jump, roll, etc.
    // For now, load as atlas - we'll configure specific frames later
    this.load.image('sonic-spritesheet', 'assets/sprites/sonic/sonic-spritesheet.png');

    // Load Green Hill Zone tileset
    // Contains grass, dirt, slopes, loops, platforms (1360x3184px)
    this.load.image('ghz-tileset', 'assets/tilesets/green-hill-zone.png');

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

    // Create fallback placeholder if sprites didn't load
    if (!sonicLoaded) {
      console.warn('Sonic sprite not loaded, creating placeholder');
      this.createPlaceholderSonic();
    }

    // Start the main game scene
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
}
