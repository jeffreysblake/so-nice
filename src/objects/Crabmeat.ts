import Phaser from 'phaser';
import { Enemy } from './Enemy';

/**
 * Crabmeat - Crab enemy from Green Hill Zone
 * Behavior: Walks back and forth, occasionally fires projectiles
 */
export class Crabmeat extends Enemy {
  private readonly WALK_SPEED = 0.8; // pixels per frame
  private walkTimer: number = 0;
  private fireTimer: number = 0;
  private readonly FIRE_INTERVAL = 120; // Fire every 2 seconds

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.speed = this.WALK_SPEED;
    this.direction = 1; // Start walking right
    this.drawSprite();
  }

  protected getCollisionRadius(): number {
    return 18; // Crabmeat is slightly larger
  }

  protected drawSprite(): void {
    this.graphics.clear();

    // Draw simple Crabmeat representation
    // Main body (orange/red)
    this.graphics.fillStyle(0xff6600, 1);
    this.graphics.fillEllipse(0, 0, 32, 24);

    // Shell ridges (darker orange)
    this.graphics.fillStyle(0xcc4400, 1);
    this.graphics.fillCircle(-4, -6, 4);
    this.graphics.fillCircle(0, -8, 4);
    this.graphics.fillCircle(4, -6, 4);

    // Eyes (yellow with black pupils)
    this.graphics.fillStyle(0xffff00, 1);
    this.graphics.fillCircle(-8 * this.direction, -2, 5);
    this.graphics.fillCircle(8 * this.direction, -2, 5);

    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(-8 * this.direction, -2, 2);
    this.graphics.fillCircle(8 * this.direction, -2, 2);

    // Claws
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(-16 * this.direction, 4, 8, 6);
    this.graphics.fillRect(12 * this.direction, 4, 8, 6);

    // Legs (simple lines)
    this.graphics.lineStyle(2, 0x883300);
    this.graphics.beginPath();
    this.graphics.moveTo(-12, 10);
    this.graphics.lineTo(-16, 16);
    this.graphics.strokePath();

    this.graphics.beginPath();
    this.graphics.moveTo(-4, 10);
    this.graphics.lineTo(-6, 16);
    this.graphics.strokePath();

    this.graphics.beginPath();
    this.graphics.moveTo(4, 10);
    this.graphics.lineTo(6, 16);
    this.graphics.strokePath();

    this.graphics.beginPath();
    this.graphics.moveTo(12, 10);
    this.graphics.lineTo(16, 16);
    this.graphics.strokePath();
  }

  updateAI(delta: number): void {
    this.walkTimer += delta;
    this.fireTimer += delta;

    // Walk in current direction
    this.x += this.direction * this.speed * delta;

    // Change direction every 2.5 seconds
    if (this.walkTimer > 150) {
      this.direction *= -1;
      this.walkTimer = 0;
      this.drawSprite(); // Redraw to update facing direction
    }

    // Fire projectiles periodically
    if (this.fireTimer > this.FIRE_INTERVAL) {
      this.fireProjectile();
      this.fireTimer = 0;
    }

    // Turn around at world boundaries
    if (this.x < 100) {
      this.direction = 1;
      this.drawSprite();
    } else if (this.x > 3700) {
      this.direction = -1;
      this.drawSprite();
    }
  }

  /**
   * Fire a projectile (simple visual effect for now)
   */
  private fireProjectile(): void {
    // Create a simple projectile graphic
    const projectile = this.scene.add.graphics();
    projectile.fillStyle(0xffff00, 1);
    projectile.fillCircle(0, 0, 4);

    // Position at claw
    const startX = this.x + (12 * this.direction);
    const startY = this.y + 4;
    projectile.setPosition(startX, startY);

    // Animate projectile moving in an arc
    const targetX = startX + (60 * this.direction);
    const targetY = startY + 40; // Arc downward

    this.scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        projectile.destroy();
      },
    });

    console.log('Crabmeat fired projectile!');
    // TODO: Add projectile collision detection with player
  }
}
