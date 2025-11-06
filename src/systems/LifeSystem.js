/**
 * LifeSystem - Manages player lives, death, and respawn
 */
export class LifeSystem {
    scene;
    lives = 3;
    isDead = false;
    respawnPosition;
    deathCallback;
    respawnCallback;
    gameOverCallback;
    constructor(scene, startX, startY) {
        this.scene = scene;
        this.respawnPosition = { x: startX, y: startY };
    }
    /**
     * Set callbacks for death/respawn events
     */
    setCallbacks(onDeath, onRespawn, onGameOver) {
        this.deathCallback = onDeath;
        this.respawnCallback = onRespawn;
        this.gameOverCallback = onGameOver;
    }
    /**
     * Trigger player death
     */
    triggerDeath() {
        if (this.isDead)
            return;
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
            }
            else {
                this.gameOver();
            }
        });
    }
    /**
     * Respawn player at checkpoint
     */
    respawn() {
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
    gameOver() {
        console.log('Game Over!');
        // Call game over callback
        if (this.gameOverCallback) {
            this.gameOverCallback();
        }
    }
    /**
     * Set respawn/checkpoint position
     */
    setRespawnPosition(x, y) {
        this.respawnPosition = { x, y };
    }
    /**
     * Get respawn position
     */
    getRespawnPosition() {
        return { ...this.respawnPosition };
    }
    /**
     * Get current lives
     */
    getLives() {
        return this.lives;
    }
    /**
     * Add a life
     */
    addLife() {
        this.lives++;
    }
    /**
     * Check if player is dead
     */
    isPlayerDead() {
        return this.isDead;
    }
    /**
     * Reset life system (for level restart)
     */
    reset(lives = 3) {
        this.lives = lives;
        this.isDead = false;
    }
}
