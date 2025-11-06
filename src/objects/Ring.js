import { GameObject } from './GameObject';
/**
 * Ring - Collectible ring object
 * Sonic's primary collectible that protects from damage
 */
export class Ring extends GameObject {
    collected = false;
    animationFrame = 0;
    graphics;
    constructor(scene, x, y) {
        super(scene, x, y);
        // Create visual representation
        this.graphics = scene.add.graphics();
        this.add(this.graphics);
        this.drawRing();
        // Start animation
        scene.time.addEvent({
            delay: 100, // 10 FPS animation
            callback: this.animate,
            callbackScope: this,
            loop: true,
        });
    }
    drawRing() {
        this.graphics.clear();
        // Draw a simple ring (circle with hole)
        // Gold/yellow color
        const outerRadius = 8;
        const innerRadius = 5;
        // Outer circle (gold)
        this.graphics.fillStyle(0xffff00, 1);
        this.graphics.fillCircle(0, 0, outerRadius);
        // Inner circle (black/transparent hole)
        this.graphics.fillStyle(0x000000, 0);
        this.graphics.fillCircle(0, 0, innerRadius);
        // Add shine effect based on animation frame
        if (this.animationFrame % 2 === 0) {
            this.graphics.fillStyle(0xffffff, 0.5);
            this.graphics.fillCircle(-2, -2, 2);
        }
    }
    animate() {
        if (this.collected)
            return;
        this.animationFrame++;
        // Simple rotation animation
        this.graphics.rotation += 0.2;
        // Redraw with shine effect
        if (this.animationFrame % 4 === 0) {
            this.drawRing();
        }
    }
    checkPlayerCollision(playerX, playerY, playerRadius) {
        if (this.collected || !this.isObjectActive)
            return false;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Ring collection radius (8 pixels)
        return distance < (playerRadius + 8);
    }
    onPlayerInteract(_player) {
        if (this.collected || !this.isObjectActive)
            return;
        // Mark as collected
        this.collected = true;
        // Play collection animation/effect
        this.playCollectionEffect();
        // Hide the ring
        this.setVisible(false);
        this.setObjectActive(false);
        console.log('Ring collected!');
    }
    playCollectionEffect() {
        // Create sparkle effect
        const sparkle = this.scene.add.graphics();
        sparkle.fillStyle(0xffff00, 1);
        sparkle.fillCircle(this.x, this.y, 12);
        // Fade out sparkle
        this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => {
                sparkle.destroy();
            },
        });
        // Play collection sound (if available)
        // this.scene.sound.play('ring-collect');
    }
    update(_time, _delta) {
        // Ring behavior update (if needed)
    }
    /**
     * Check if ring has been collected
     */
    isCollected() {
        return this.collected;
    }
    /**
     * Reset ring (for testing or respawn)
     */
    reset() {
        this.collected = false;
        this.setVisible(true);
        this.setObjectActive(true);
    }
}
