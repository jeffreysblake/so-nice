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

    // Use proper rectangular hitboxes based on SPG dimensions
    // Player hitbox: 17×33 pixels (width radius ~8, height radius ~16)
    let springWidth, springHeight;

    switch (this.orientation) {
      case SpringOrientation.UP:
      case SpringOrientation.DOWN:
        // Vertical springs: 33×17 pixels (SPG spec)
        springWidth = 33;
        springHeight = 17;
        break;

      case SpringOrientation.RIGHT:
      case SpringOrientation.LEFT:
        // Horizontal springs: 17×31 pixels (SPG spec)
        springWidth = 17;
        springHeight = 31;
        break;
    }

    // Rectangular collision detection (AABB)
    const halfSpringWidth = springWidth / 2;
    const halfSpringHeight = springHeight / 2;
    const playerWidth = playerRadius * 2; // Player width ~17 pixels
    const playerHeight = playerRadius * 2; // Approximate, actual is ~33 pixels

    // Check if rectangles overlap
    const dx = Math.abs(playerX - this.x);
    const dy = Math.abs(playerY - this.y);

    return (
      dx < halfSpringWidth + playerRadius &&
      dy < halfSpringHeight + playerRadius
    );
  }

  onPlayerInteract(player: any): boolean {
    if (!this.isObjectActive || this.isCompressed) return false;

    // Apply bounce force based on orientation (SPG-authentic physics)
    // Key principle: Vertical springs preserve horizontal momentum!

    switch (this.orientation) {
      case SpringOrientation.UP:
        // Vertical spring UP: Set Y velocity, preserve X velocity (horizontal momentum)
        player.physicsState.yVelocity = -this.bounceForce; // Negative = upward
        // X velocity unchanged - player keeps moving horizontally!

        // Pull player 8 pixels into spring for proper alignment
        player.y = this.y - 8;
        player.physicsState.y = player.y;

        // Put player in air
        player.physicsState.isGrounded = false;
        player.physicsState.isJumping = true;
        break;

      case SpringOrientation.DOWN:
        // Vertical spring DOWN: Set Y velocity, preserve X velocity
        player.physicsState.yVelocity = this.bounceForce; // Positive = downward
        // X velocity unchanged

        player.y = this.y + 8;
        player.physicsState.y = player.y;

        player.physicsState.isGrounded = false;
        player.physicsState.isJumping = true;
        break;

      case SpringOrientation.RIGHT:
        // Horizontal spring RIGHT: Only works when grounded (Sonic 1/2 behavior)
        if (!player.physicsState.isGrounded) {
          return false; // No bounce if player is in air
        }

        // Set ground speed, not X velocity
        player.physicsState.groundSpeed = this.bounceForce;
        // Y velocity unchanged

        // Pull player into spring
        player.x = this.x + 8;
        player.physicsState.x = player.x;
        break;

      case SpringOrientation.LEFT:
        // Horizontal spring LEFT: Only works when grounded
        if (!player.physicsState.isGrounded) {
          return false; // No bounce if player is in air
        }

        player.physicsState.groundSpeed = -this.bounceForce; // Negative for leftward

        player.x = this.x - 8;
        player.physicsState.x = player.x;
        break;
    }

    // Lock controls briefly
    player.physicsState.controlLock = 16;

    // Compress spring visually
    this.isCompressed = true;
    this.compressionTimer = 10;
    this.drawSpring();

    console.log(`Spring bounce! Type: ${this.springType}, Force: ${this.bounceForce}, Orientation: ${this.orientation}°`);
    return true;
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
