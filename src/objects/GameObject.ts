import Phaser from 'phaser';

/**
 * Base class for interactive game objects (springs, rings, etc.)
 */
export abstract class GameObject extends Phaser.GameObjects.Container {
  protected isObjectActive: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
  }

  /**
   * Check collision with player
   */
  abstract checkPlayerCollision(playerX: number, playerY: number, playerRadius: number): boolean;

  /**
   * Handle player interaction
   */
  abstract onPlayerInteract(player: any): void;

  /**
   * Update game object
   */
  update(_time: number, _delta: number): void {
    // Override in subclasses
  }

  setObjectActive(isActive: boolean): this {
    this.isObjectActive = isActive;
    this.setVisible(isActive);
    return this;
  }

  isActive(): boolean {
    return this.isObjectActive;
  }
}
