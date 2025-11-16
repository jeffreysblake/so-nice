import Phaser from 'phaser';
import { Enemy } from './Enemy';

/**
 * Motobug - Walking ladybug enemy from Green Hill Zone
 * Behavior: Walks back and forth on platforms, turns at edges
 */
export class Motobug extends Enemy {
  private readonly WALK_SPEED = 1.0; // pixels per frame
  private walkTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.speed = this.WALK_SPEED;
    this.direction = -1; // Start walking left
    this.drawSprite();
  }

  protected getCollisionRadius(): number {
    return 16; // Motobug is roughly 32x32 pixels
  }

  protected drawSprite(): void {
    this.graphics.clear();

    // Draw simple Motobug representation
    // Body (black oval)
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillEllipse(0, 2, 28, 20);

    // Red shell with black spot
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillEllipse(0, -2, 24, 16);

    // Black spot on shell
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(0, -4, 6);

    // Eyes (white with black pupils)
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(-6 * this.direction, 0, 4);
    this.graphics.fillCircle(6 * this.direction, 0, 4);

    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(-6 * this.direction, 0, 2);
    this.graphics.fillCircle(6 * this.direction, 0, 2);

    // Wheels (simple circles)
    this.graphics.fillStyle(0x666666, 1);
    this.graphics.fillCircle(-8, 12, 5);
    this.graphics.fillCircle(8, 12, 5);
  }

  updateAI(delta: number): void {
    // Normalize delta from milliseconds to frames (60 FPS standard)
    const deltaNormalized = delta / (1000 / 60);

    this.walkTimer += deltaNormalized;

    // Walk in current direction
    this.x += this.direction * this.speed * deltaNormalized;

    // Change direction every 3 seconds (180 frames at 60fps)
    if (this.walkTimer > 180) {
      this.direction *= -1;
      this.walkTimer = 0;
      this.drawSprite(); // Redraw to update eye direction
    }

    // Also turn around at world boundaries
    if (this.x < 100) {
      this.direction = 1;
      this.drawSprite();
    } else if (this.x > 3700) {
      this.direction = -1;
      this.drawSprite();
    }
  }
}
