import Phaser from 'phaser';

/**
 * LifeSystem - Manages player lives, death, and respawn
 */
export class LifeSystem {
  private scene: Phaser.Scene;
  private lives: number = 3;
  private isDead: boolean = false;
  private respawnPosition: { x: number; y: number };
  private deathCallback?: () => void;
  private respawnCallback?: () => void;
  private gameOverCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number
  ) {
    this.scene = scene;
    this.respawnPosition = { x: startX, y: startY };
  }

  /**
   * Set callbacks for death/respawn events
   */
  setCallbacks(
    onDeath?: () => void,
    onRespawn?: () => void,
    onGameOver?: () => void
  ): void {
    this.deathCallback = onDeath;
    this.respawnCallback = onRespawn;
    this.gameOverCallback = onGameOver;
  }

  /**
   * Trigger player death
   */
  triggerDeath(): void {
    if (this.isDead) return;

    this.isDead = true;
    this.lives--;

    console.log(`Player died! Lives remaining: ${this.lives}`);

    // Call death callback
    if (this.deathCallback) {
      this.deathCallback();
    }

    // Wait 2 seconds before respawn or game over
    this.scene.time.delayedCall(2000, () => {
      if (this.lives > 0) {
        this.respawn();
      } else {
        this.gameOver();
      }
    });
  }

  /**
   * Respawn player at checkpoint
   */
  private respawn(): void {
    console.log('Respawning player...');

    this.isDead = false;

    // Call respawn callback
    if (this.respawnCallback) {
      this.respawnCallback();
    }
  }

  /**
   * Game over (no lives left)
   */
  private gameOver(): void {
    console.log('Game Over!');

    // Call game over callback
    if (this.gameOverCallback) {
      this.gameOverCallback();
    }
  }

  /**
   * Set respawn/checkpoint position
   */
  setRespawnPosition(x: number, y: number): void {
    this.respawnPosition = { x, y };
  }

  /**
   * Get respawn position
   */
  getRespawnPosition(): { x: number; y: number } {
    return { ...this.respawnPosition };
  }

  /**
   * Get current lives
   */
  getLives(): number {
    return this.lives;
  }

  /**
   * Add a life
   */
  addLife(): void {
    this.lives++;
  }

  /**
   * Check if player is dead
   */
  isPlayerDead(): boolean {
    return this.isDead;
  }

  /**
   * Reset life system (for level restart)
   */
  reset(lives: number = 3): void {
    this.lives = lives;
    this.isDead = false;
  }
}
