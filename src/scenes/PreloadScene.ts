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

    // TODO: Load assets here
    // For now, we'll create placeholder assets in the create method

    // this.load.image('sonic-idle', 'assets/sprites/sonic/idle.png');
    // this.load.spritesheet('sonic-run', 'assets/sprites/sonic/run.png', {
    //   frameWidth: 32,
    //   frameHeight: 32,
    // });
    // this.load.image('tiles', 'assets/tilesets/green-hill.png');
    // this.load.tilemapTiledJSON('level1', 'assets/levels/level1.json');
  }

  create() {
    // Create placeholder graphics for development
    this.createPlaceholderAssets();

    // Start the main game scene
    this.scene.start('GameScene');
  }

  private createPlaceholderAssets() {
    // Create a simple colored square for Sonic placeholder
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0066ff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('sonic-placeholder', 32, 32);
    graphics.destroy();

    // Create ground tile placeholder
    const groundGraphics = this.add.graphics();
    groundGraphics.fillStyle(0x8b4513, 1);
    groundGraphics.fillRect(0, 0, 32, 32);
    groundGraphics.lineStyle(1, 0x654321, 1);
    groundGraphics.strokeRect(0, 0, 32, 32);
    groundGraphics.generateTexture('ground-tile', 32, 32);
    groundGraphics.destroy();
  }
}
