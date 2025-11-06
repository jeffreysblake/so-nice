import Phaser from 'phaser';
import { GameObject } from './GameObject';

export enum SpringType {
  YELLOW = 'yellow',  // Normal bounce
  RED = 'red',        // High bounce
}

export enum SpringOrientation {
  UP = 0,
  RIGHT = 90,
  DOWN = 180,
  LEFT = 270,
}

/**
 * Spring object that bounces the player
 */
export class Spring extends GameObject {
  private springType: SpringType;
  private orientation: SpringOrientation;
  private bounceForce: number;
  private graphics: Phaser.GameObjects.Graphics;
  private isCompressed: boolean = false;
  private compressionTimer: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: SpringType = SpringType.YELLOW,
    orientation: SpringOrientation = SpringOrientation.UP
  ) {
    super(scene, x, y);

    this.springType = type;
    this.orientation = orientation;

    // Set bounce force based on type
    this.bounceForce = type === SpringType.RED ? 16 : 10;

    // Create visual representation
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawSpring();
  }

  private drawSpring(): void {
    this.graphics.clear();

    const color = this.springType === SpringType.RED ? 0xff0000 : 0xffff00;
    const height = this.isCompressed ? 8 : 16;

    this.graphics.fillStyle(color, 1);

    // Draw based on orientation
    switch (this.orientation) {
      case SpringOrientation.UP:
        this.graphics.fillRect(-16, -height, 32, height);
        // Draw spring coil
        this.graphics.fillStyle(0x666666, 1);
        for (let i = 0; i < 3; i++) {
          this.graphics.fillRect(-14, -height + i * 4, 28, 2);
        }
        break;

      case SpringOrientation.RIGHT:
        this.graphics.fillRect(0, -16, height, 32);
        this.graphics.fillStyle(0x666666, 1);
        for (let i = 0; i < 3; i++) {
          this.graphics.fillRect(i * 4, -14, 2, 28);
        }
        break;

      case SpringOrientation.DOWN:
        this.graphics.fillRect(-16, 0, 32, height);
        this.graphics.fillStyle(0x666666, 1);
        for (let i = 0; i < 3; i++) {
          this.graphics.fillRect(-14, i * 4, 28, 2);
        }
        break;

      case SpringOrientation.LEFT:
        this.graphics.fillRect(-height, -16, height, 32);
        this.graphics.fillStyle(0x666666, 1);
        for (let i = 0; i < 3; i++) {
          this.graphics.fillRect(-height + i * 4, -14, 2, 28);
        }
        break;
    }
  }

  checkPlayerCollision(playerX: number, playerY: number, playerRadius: number): boolean {
    if (!this.isObjectActive) return false;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (playerRadius + 20);
  }

  onPlayerInteract(player: any): void {
    if (!this.isObjectActive || this.isCompressed) return;

    // Apply bounce force based on orientation
    const angleRad = (this.orientation * Math.PI) / 180;

    player.physicsState.xVelocity = this.bounceForce * Math.sin(angleRad);
    player.physicsState.yVelocity = -this.bounceForce * Math.cos(angleRad);

    // Put player in air
    player.physicsState.isGrounded = false;
    player.physicsState.isJumping = true;

    // Lock controls briefly
    player.physicsState.controlLock = 16;

    // Compress spring visually
    this.isCompressed = true;
    this.compressionTimer = 10;
    this.drawSpring();

    console.log(`Spring bounce! Force: ${this.bounceForce}, Orientation: ${this.orientation}°`);
  }

  update(_time: number, _delta: number): void {
    if (this.compressionTimer > 0) {
      this.compressionTimer--;

      if (this.compressionTimer === 0) {
        this.isCompressed = false;
        this.drawSpring();
      }
    }
  }
}
