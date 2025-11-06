import Phaser from 'phaser';
import { GameObject } from './GameObject';

/**
 * Enemy - Base class for all badnik enemies
 */
export abstract class Enemy extends GameObject {
  protected health: number = 1;
  protected destroyed: boolean = false;
  protected speed: number = 1;
  protected direction: number = 1; // 1 = right, -1 = left
  protected graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
  }

  /**
   * Check collision with player
   * Returns true if player collides with enemy body
   */
  checkPlayerCollision(playerX: number, playerY: number, playerRadius: number): boolean {
    if (this.destroyed || !this.isObjectActive) return false;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (playerRadius + this.getCollisionRadius());
  }

  /**
   * Get collision radius for this enemy
   */
  protected abstract getCollisionRadius(): number;

  /**
   * Check if player is attacking (spinning)
   */
  protected isPlayerAttacking(player: any): boolean {
    // Player is attacking if jumping, rolling, or in spin ball
    return player.physicsState.isJumping || player.physicsState.isRolling;
  }

  /**
   * Handle interaction with player
   */
  onPlayerInteract(player: any): void {
    if (this.destroyed || !this.isObjectActive) return;

    if (this.isPlayerAttacking(player)) {
      // Player defeats enemy
      this.destroy();
    } else {
      // Enemy damages player
      this.damagePlayer(player);
    }
  }

  /**
   * Destroy enemy (defeat)
   */
  public destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.playDestroyAnimation();
    this.setVisible(false);
    this.setObjectActive(false);

    console.log(`${this.constructor.name} destroyed!`);
  }

  /**
   * Play destruction animation
   */
  protected playDestroyAnimation(): void {
    // Create explosion effect
    const explosion = this.scene.add.graphics();
    explosion.fillStyle(0xff6600, 1);
    explosion.fillCircle(this.x, this.y, 16);

    // Fade out explosion
    this.scene.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2,
      duration: 400,
      onComplete: () => {
        explosion.destroy();
      },
    });

    // Play destruction sound (if available)
    // this.scene.sound.play('enemy-destroy');
  }

  /**
   * Damage the player
   */
  protected damagePlayer(player: any): void {
    // Calculate knockback direction (away from enemy)
    const knockbackDirection = player.x < this.x ? -1 : 1;

    // Apply damage through player's damage system
    const damaged = player.takeDamage(knockbackDirection);

    if (damaged) {
      console.log(`${this.constructor.name} hit player! Rings scattered.`);
    }
  }

  /**
   * Update enemy AI
   */
  abstract updateAI(delta: number): void;

  /**
   * Draw enemy sprite
   */
  protected abstract drawSprite(): void;

  update(_time: number, delta: number): void {
    if (this.destroyed) return;

    this.updateAI(delta);
  }

  /**
   * Check if enemy is destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }
}
