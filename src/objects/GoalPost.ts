import Phaser from 'phaser';
import { GameObject } from './GameObject';

/**
 * GoalPost - Level completion object
 */
export class GoalPost extends GameObject {
  private activated: boolean = false;
  private graphics: Phaser.GameObjects.Graphics;
  private signpost: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.graphics = scene.add.graphics();
    this.signpost = scene.add.graphics();

    this.add(this.graphics);
    this.add(this.signpost);

    this.drawGoalPost();
  }

  /**
   * Draw goal post visual
   */
  private drawGoalPost(): void {
    // Draw pole (brown/gray)
    this.graphics.clear();
    this.graphics.fillStyle(0x8b4513, 1);
    this.graphics.fillRect(-4, -80, 8, 80);

    // Draw sign (rectangular with checkered pattern)
    this.signpost.clear();
    this.signpost.fillStyle(0xff0000, 1);
    this.signpost.fillRect(-20, -80, 40, 32);

    // Draw "GOAL" text representation (simple squares)
    this.signpost.fillStyle(0xffffff, 1);
    this.signpost.fillRect(-15, -75, 8, 8);
    this.signpost.fillRect(-3, -75, 8, 8);
    this.signpost.fillRect(9, -75, 8, 8);

    // Draw checkered base
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          this.signpost.fillStyle(0xffff00, 1);
        } else {
          this.signpost.fillStyle(0x000000, 1);
        }
        this.signpost.fillRect(-20 + i * 10, -45 + j * 8, 10, 8);
      }
    }
  }

  /**
   * Check player collision with goal post
   */
  checkPlayerCollision(playerX: number, playerY: number, playerRadius: number): boolean {
    if (this.activated || !this.isObjectActive) return false;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (playerRadius + 30); // 30px detection radius
  }

  /**
   * Interact with player (complete level)
   */
  onPlayerInteract(_player: any): void {
    if (this.activated || !this.isObjectActive) return;

    this.activated = true;
    this.playActivationAnimation();

    console.log('Goal post activated! Level complete!');
  }

  /**
   * Play activation animation
   */
  private playActivationAnimation(): void {
    // Spin the signpost
    this.scene.tweens.add({
      targets: this.signpost,
      angle: 360 * 3, // 3 full rotations
      duration: 1500,
      ease: 'Quad.easeOut',
    });

    // Create sparkle effect
    for (let i = 0; i < 10; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0xffff00, 1);
      sparkle.fillCircle(0, 0, 8); // Simple circle sparkle
      sparkle.setPosition(this.x, this.y - 40);

      this.scene.tweens.add({
        targets: sparkle,
        x: this.x + (Math.random() - 0.5) * 100,
        y: this.y - 40 + (Math.random() - 0.5) * 100,
        alpha: 0,
        scale: 2,
        duration: 1000,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  /**
   * Check if goal post has been activated
   */
  isActivated(): boolean {
    return this.activated;
  }

  /**
   * Reset goal post
   */
  reset(): void {
    this.activated = false;
    this.signpost.setAngle(0);
  }

  update(_time: number, _delta: number): void {
    // Goal post doesn't need per-frame updates
  }
}
