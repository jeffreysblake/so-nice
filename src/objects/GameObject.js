import Phaser from 'phaser';
/**
 * Base class for interactive game objects (springs, rings, etc.)
 */
export class GameObject extends Phaser.GameObjects.Container {
    isObjectActive = true;
    constructor(scene, x, y) {
        super(scene, x, y);
        scene.add.existing(this);
    }
    /**
     * Update game object
     */
    update(_time, _delta) {
        // Override in subclasses
    }
    setObjectActive(isActive) {
        this.isObjectActive = isActive;
        this.setVisible(isActive);
        return this;
    }
    isActive() {
        return this.isObjectActive;
    }
}
