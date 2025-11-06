import Phaser from 'phaser';
import { Player } from '../entities/Player';

/**
 * GameScene - Main gameplay scene
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Set up physics world
    this.physics.world.setBounds(0, 0, 3840, 672);  // 4x screen width for scrolling

    // Create temporary ground platform
    this.createTestLevel();

    // Create player
    this.player = new Player(this, 100, 300);

    // Set up camera
    this.cameras.main.setBounds(0, 0, 3840, 672);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(1000);

    console.log('GameScene created');
  }

  update(time: number, delta: number) {
    if (!this.player) return;

    // Update player with input
    this.player.update(time, delta, this.cursors);

    // Update debug info
    this.updateDebugInfo();
  }

  private createTestLevel() {
    // Create a simple test platform for initial physics testing
    const platforms = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < 120; x++) {
      const tile = platforms.create(x * 32 + 16, 650, 'ground-tile');
      tile.setOrigin(0.5, 0.5);
    }

    // Some platforms at different heights
    for (let x = 10; x < 20; x++) {
      platforms.create(x * 32 + 16, 500, 'ground-tile');
    }

    for (let x = 30; x < 40; x++) {
      platforms.create(x * 32 + 16, 400, 'ground-tile');
    }

    // Store reference for collision
    this.physics.add.collider(this.player, platforms);
  }

  private updateDebugInfo() {
    const state = this.player.getPhysicsState();
    this.debugText.setText([
      `FPS: ${Math.round(this.game.loop.actualFps)}`,
      `Pos: (${Math.round(state.x)}, ${Math.round(state.y)})`,
      `Ground Speed: ${state.groundSpeed.toFixed(3)}`,
      `Velocity: (${state.xVelocity.toFixed(2)}, ${state.yVelocity.toFixed(2)})`,
      `State: ${this.player.getCurrentState()}`,
      `Grounded: ${state.isGrounded}`,
      `Angle: ${state.groundAngle}°`,
      '',
      'Controls:',
      'Arrow Keys: Move',
      'Z: Jump',
      'Down: Roll (when moving)',
    ].join('\n'));
  }
}
