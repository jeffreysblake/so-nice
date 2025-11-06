import Phaser from 'phaser';
import { Ring } from '../objects/Ring';

/**
 * DamageSystem - Manages player damage, ring scatter, and invincibility
 */
export class DamageSystem {
  private scene: Phaser.Scene;
  private invincibilityFrames: number = 0;
  private readonly INVINCIBILITY_DURATION = 120; // 2 seconds at 60fps
  private scatteredRings: Ring[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Update system (decrements invincibility timer)
   */
  update(delta: number): void {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames -= delta;
      if (this.invincibilityFrames < 0) {
        this.invincibilityFrames = 0;
      }
    }

    // Remove collected scattered rings after collection
    this.scatteredRings = this.scatteredRings.filter(ring => !ring.isCollected());
  }

  /**
   * Check if player is currently invincible
   */
  isInvincible(): boolean {
    return this.invincibilityFrames > 0;
  }

  /**
   * Get remaining invincibility frames (for visual effects)
   */
  getInvincibilityFrames(): number {
    return this.invincibilityFrames;
  }

  /**
   * Apply damage to player
   * Returns true if damage was applied, false if invincible
   */
  applyDamage(
    playerX: number,
    playerY: number,
    currentRings: number,
    knockbackDirection: number = 1
  ): { damaged: boolean; ringsLost: number; knockbackX: number; knockbackY: number } {
    // Can't take damage if invincible
    if (this.isInvincible()) {
      return { damaged: false, ringsLost: 0, knockbackX: 0, knockbackY: 0 };
    }

    // Apply invincibility frames
    this.invincibilityFrames = this.INVINCIBILITY_DURATION;

    // Calculate knockback
    const knockbackX = -4 * knockbackDirection; // Knocked back opposite to hit direction
    const knockbackY = -4; // Knocked upward

    // If player has rings, scatter them
    let ringsLost = 0;
    if (currentRings > 0) {
      ringsLost = this.scatterRings(playerX, playerY, currentRings);
      console.log(`Player damaged! Lost ${ringsLost} rings.`);
    } else {
      // Player dies if no rings
      console.log('Player damaged with no rings - should trigger death!');
    }

    // Play damage sound (if available)
    // this.scene.sound.play('player-hurt');

    return { damaged: true, ringsLost, knockbackX, knockbackY };
  }

  /**
   * Scatter rings when player takes damage
   * Scatters up to 32 rings in a pattern
   */
  private scatterRings(x: number, y: number, ringCount: number): number {
    const ringsToScatter = Math.min(ringCount, 32); // Max 32 rings can scatter
    const angleStep = (Math.PI * 2) / ringsToScatter;

    // Clear previous scattered rings
    this.scatteredRings.forEach(ring => ring.destroy());
    this.scatteredRings = [];

    for (let i = 0; i < ringsToScatter; i++) {
      const angle = angleStep * i;
      const speed = 4 + Math.random() * 2; // Random speed 4-6

      // Create ring at player position
      const ring = new Ring(this.scene, x, y);
      this.scatteredRings.push(ring);

      // Add physics for ring scatter
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed - 4; // Extra upward velocity

      // Animate ring scatter using tweens
      this.animateScatteredRing(ring, x, y, velocityX, velocityY);
    }

    return ringsToScatter;
  }

  /**
   * Animate a scattered ring with physics-like movement
   */
  private animateScatteredRing(
    ring: Ring,
    startX: number,
    startY: number,
    velocityX: number,
    velocityY: number
  ): void {
    let currentX = startX;
    let currentY = startY;
    let currentVelX = velocityX;
    let currentVelY = velocityY;
    const gravity = 0.2;
    const friction = 0.98;
    let bounces = 0;
    const maxBounces = 3;

    // Create animation timer
    const animationTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: () => {
        // Apply gravity
        currentVelY += gravity;

        // Apply friction
        currentVelX *= friction;

        // Update position
        currentX += currentVelX;
        currentY += currentVelY;

        // Ground collision (simple)
        if (currentY > startY + 60) {
          currentY = startY + 60;
          currentVelY = -currentVelY * 0.6; // Bounce with energy loss
          bounces++;

          if (bounces >= maxBounces) {
            // Stop bouncing
            currentVelY = 0;
            currentVelX = 0;
            animationTimer.destroy();

            // Start ring despawn timer (3 seconds)
            this.scene.time.delayedCall(3000, () => {
              if (!ring.isCollected()) {
                ring.destroy();
              }
            });
          }
        }

        // Update ring position
        ring.setPosition(currentX, currentY);

        // Stop if velocity is very low
        if (Math.abs(currentVelX) < 0.1 && Math.abs(currentVelY) < 0.1) {
          animationTimer.destroy();

          // Start ring despawn timer (3 seconds)
          this.scene.time.delayedCall(3000, () => {
            if (!ring.isCollected()) {
              ring.destroy();
            }
          });
        }
      },
      loop: true,
    });
  }

  /**
   * Get all scattered rings for collision detection
   */
  getScatteredRings(): Ring[] {
    return this.scatteredRings;
  }

  /**
   * Reset damage system (for respawn)
   */
  reset(): void {
    this.invincibilityFrames = 0;
    this.scatteredRings.forEach(ring => ring.destroy());
    this.scatteredRings = [];
  }
}
