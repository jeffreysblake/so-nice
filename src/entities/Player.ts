import Phaser from 'phaser';
import { PhysicsConstants } from '../config/PhysicsConstants';
import {
  PlayerState,
  GroundMode,
  SonicPhysicsState,
} from '../types/SonicTypes';
import { CollisionManager } from '../terrain/CollisionManager';
import { GravityUtils } from '../utils/GravityUtils';
import { getSonicAnimationForState } from '../config/SonicAnimations';
import { DamageSystem } from '../systems/DamageSystem';
import { LifeSystem } from '../systems/LifeSystem';

/**
 * Player - Sonic character with authentic physics
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  // Physics state
  private physicsState: SonicPhysicsState;

  // Collision system
  private collisionManager: CollisionManager | null = null;

  // Damage system
  private damageSystem: DamageSystem;
  private ringCount: number = 0;

  // Life system
  private lifeSystem!: LifeSystem;

  // Input tracking
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private rollKey!: Phaser.Input.Keyboard.Key;

  // Sensor dimensions
  private readonly sensorWidth = 9;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use Sonic spritesheet if available, fallback to placeholder
    const texture = scene.textures.exists('sonic-spritesheet')
      ? 'sonic-spritesheet'
      : 'sonic-placeholder';
    super(scene, x, y, texture);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Initialize physics state
    this.physicsState = {
      x,
      y,
      groundSpeed: 0,
      xVelocity: 0,
      yVelocity: 0,
      groundAngle: 0,
      groundMode: GroundMode.FLOOR,
      isGrounded: false,
      isJumping: false,
      isRolling: false,
      isSpindashing: false,
      isFacingRight: true,
      controlLock: 0,
      spindashCharge: 0,
    };

    // Set up sprite properties
    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(true);

    // Start with idle animation if available
    if (texture === 'sonic-spritesheet' && scene.anims.exists('sonic-idle')) {
      this.play('sonic-idle');
    }

    // Set up arcade physics body - we'll use it for basic movement but not collision
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(20, 32);
      body.setOffset(6, 0);
      body.setMaxVelocity(
        PhysicsConstants.MAX_X_VELOCITY * 60,
        PhysicsConstants.MAX_Y_VELOCITY * 60
      );
      // Disable default gravity and collision - we'll handle it manually
      body.setAllowGravity(false);
      body.setCollideWorldBounds(false);
    }

    // Set up input
    this.setupInput(scene);

    // Initialize damage system
    this.damageSystem = new DamageSystem(scene);
  }

  /**
   * Set the collision manager (called by GameScene)
   */
  setCollisionManager(manager: CollisionManager): void {
    this.collisionManager = manager;
  }

  /**
   * Set the life system (called by GameScene)
   */
  setLifeSystem(lifeSystem: LifeSystem): void {
    this.lifeSystem = lifeSystem;
  }

  private setupInput(scene: Phaser.Scene) {
    if (scene.input.keyboard) {
      this.jumpKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.Z
      );
      this.rollKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.DOWN
      );
    }
  }

  update(
    _time: number,
    delta: number,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
  ) {
    if (!this.collisionManager) return;

    // Normalize delta to expected frame time (60 FPS)
    const deltaNormalized = delta / PhysicsConstants.FIXED_TIMESTEP;

    // Update damage system
    this.damageSystem.update(deltaNormalized);

    // Update control lock
    if (this.physicsState.controlLock > 0) {
      this.physicsState.controlLock--;
    }

    // Handle invincibility visual effect (blinking)
    if (this.isInvincible()) {
      // Blink every 4 frames
      const blinkFrame = Math.floor(_time / 66); // ~15 blinks per second
      this.setAlpha(blinkFrame % 2 === 0 ? 0.3 : 1.0);
    } else {
      this.setAlpha(1.0);
    }

    // Check ground collision using sensors
    this.checkGroundCollision();

    if (this.physicsState.isGrounded) {
      this.updateGroundMovement(cursors, deltaNormalized);
      this.applySlopePhysics(deltaNormalized);
      this.checkJump();
    } else {
      this.updateAirMovement(cursors, deltaNormalized);
    }

    // Move the player
    this.movePlayer(deltaNormalized);

    // Update position in physics state
    this.physicsState.x = this.x;
    this.physicsState.y = this.y;

    // Check for death conditions
    this.checkDeathConditions();

    // Update sprite facing direction
    if (this.physicsState.groundSpeed > 0) {
      this.setFlipX(false);
      this.physicsState.isFacingRight = true;
    } else if (this.physicsState.groundSpeed < 0) {
      this.setFlipX(true);
      this.physicsState.isFacingRight = false;
    }

    // Update sprite rotation based on ground angle
    if (this.physicsState.isGrounded) {
      this.setAngle(this.physicsState.groundAngle);
    } else {
      // Smoothly rotate back to 0 in air
      this.setAngle(Phaser.Math.Linear(this.angle, 0, 0.2));
    }

    // Update animation based on state
    this.updateAnimation();
  }

  /**
   * Update animation based on player state
   */
  private updateAnimation(): void {
    const animationName = getSonicAnimationForState(
      this.physicsState.isGrounded,
      this.physicsState.isRolling,
      this.physicsState.isJumping,
      this.physicsState.groundSpeed
    );

    // Only change animation if it's different from current
    if (this.anims.currentAnim && this.anims.currentAnim.key !== animationName) {
      this.play(animationName, true);
    } else if (!this.anims.currentAnim) {
      this.play(animationName, true);
    }
  }

  /**
   * Check ground collision using sensor system with gravity modes
   */
  private checkGroundCollision(): void {
    if (!this.collisionManager) return;

    // Get sensor offsets based on current gravity mode
    const sensorOffsets = GravityUtils.getSensorOffsets(this.physicsState.groundMode);

    const groundResult = this.collisionManager.checkGroundSensors(
      this.x + sensorOffsets.primary.x,
      this.y + sensorOffsets.primary.y,
      this.sensorWidth,
      this.physicsState.groundMode
    );

    const wasGrounded = this.physicsState.isGrounded;

    if (groundResult.collided) {
      // We hit ground
      if (!wasGrounded || this.isFallingTowardsSurface()) {
        // Landing or already on ground
        this.physicsState.isGrounded = true;
        this.physicsState.groundAngle = groundResult.angle;

        // Update gravity mode based on new angle
        this.physicsState.groundMode = GravityUtils.getGravityModeFromAngle(groundResult.angle);

        // Snap to surface (distance depends on mode)
        this.adjustPositionToSurface(groundResult.distance, this.physicsState.groundMode);

        // Landing: convert velocity to ground speed
        if (!wasGrounded) {
          this.convertVelocityToGroundSpeed(groundResult.angle);
        }

        this.physicsState.yVelocity = 0;
        this.physicsState.isJumping = false;
      } else {
        // Already grounded - check if we should update mode
        if (wasGrounded) {
          this.physicsState.groundAngle = groundResult.angle;
          const newMode = GravityUtils.getGravityModeFromAngle(groundResult.angle);

          if (newMode !== this.physicsState.groundMode) {
            this.physicsState.groundMode = newMode;
          }

          // Check if we should fall off due to insufficient speed or bad angle
          if (GravityUtils.shouldFallOff(
            this.physicsState.groundSpeed,
            this.physicsState.groundAngle,
            this.physicsState.groundMode
          )) {
            this.detachFromSurface();
          }
        }
      }
    } else {
      // No ground detected
      if (wasGrounded && !this.physicsState.isJumping) {
        this.detachFromSurface();
      }

      if (!this.physicsState.isJumping && groundResult.distance > 4) {
        this.physicsState.isGrounded = false;
      }
    }
  }

  /**
   * Check if player is falling towards the current surface
   */
  private isFallingTowardsSurface(): boolean {
    const gravityVec = GravityUtils.getGravityVector(this.physicsState.groundMode);

    // Check if velocity component in gravity direction is positive
    const velocityInGravityDir =
      this.physicsState.xVelocity * gravityVec.x +
      this.physicsState.yVelocity * gravityVec.y;

    return velocityInGravityDir > 0;
  }

  /**
   * Adjust position to snap to surface based on gravity mode
   */
  private adjustPositionToSurface(distance: number, mode: GroundMode): void {
    const gravityVec = GravityUtils.getGravityVector(mode);

    // Move opposite to gravity direction
    this.x -= gravityVec.x * distance;
    this.y -= gravityVec.y * distance;
  }

  /**
   * Convert air velocity to ground speed when landing
   */
  private convertVelocityToGroundSpeed(angle: number): void {
    const angleRad = (angle * Math.PI) / 180;

    // Project current velocity onto the surface direction
    const surfaceX = Math.cos(angleRad);
    const surfaceY = Math.sin(angleRad);

    // Dot product gives speed along surface
    const speedAlongSurface =
      this.physicsState.xVelocity * surfaceX +
      this.physicsState.yVelocity * surfaceY;

    this.physicsState.groundSpeed = speedAlongSurface;
  }

  /**
   * Detach from surface and convert to air physics
   */
  private detachFromSurface(): void {
    const angleRad = (this.physicsState.groundAngle * Math.PI) / 180;
    this.physicsState.xVelocity = this.physicsState.groundSpeed * Math.cos(angleRad);
    this.physicsState.yVelocity = this.physicsState.groundSpeed * Math.sin(angleRad);
    this.physicsState.isGrounded = false;
    this.physicsState.groundMode = GroundMode.FLOOR; // Reset to floor mode when in air
  }

  /**
   * Apply slope physics (slope factor affects ground speed)
   */
  private applySlopePhysics(delta: number): void {
    const angle = this.physicsState.groundAngle;

    // Only apply slope physics if on a slope
    if (angle !== 0 && angle !== 180) {
      const angleRad = (angle * Math.PI) / 180;
      const slopeFactor = this.physicsState.isRolling
        ? PhysicsConstants.SLOPE_FACTOR_ROLLDOWN
        : PhysicsConstants.SLOPE_FACTOR_NORMAL;

      // Apply slope factor: downhill adds speed, uphill removes speed
      this.physicsState.groundSpeed -= slopeFactor * Math.sin(angleRad) * delta;
    }
  }

  /**
   * Move player based on ground speed and angle
   */
  private movePlayer(delta: number): void {
    if (this.physicsState.isGrounded) {
      // Move along ground based on angle
      const angleRad = (this.physicsState.groundAngle * Math.PI) / 180;
      this.physicsState.xVelocity = this.physicsState.groundSpeed * Math.cos(angleRad);
      this.physicsState.yVelocity = this.physicsState.groundSpeed * Math.sin(angleRad);
    }

    // Apply movement
    this.x += this.physicsState.xVelocity * delta;
    this.y += this.physicsState.yVelocity * delta;
  }

  /**
   * Ground movement with authentic Sonic physics
   */
  private updateGroundMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    delta: number
  ) {
    const { ACCELERATION, DECELERATION, FRICTION, TOP_SPEED } =
      PhysicsConstants;

    const controlsLocked = this.physicsState.controlLock > 0;

    // Left/Right input
    if (!controlsLocked) {
      if (cursors.left?.isDown) {
        if (this.physicsState.groundSpeed > 0) {
          // Moving right, pressing left - decelerate faster
          this.physicsState.groundSpeed -= DECELERATION * delta;
        } else if (this.physicsState.groundSpeed > -TOP_SPEED) {
          // Moving left or stopped - accelerate left
          this.physicsState.groundSpeed -= ACCELERATION * delta;
        }
      } else if (cursors.right?.isDown) {
        if (this.physicsState.groundSpeed < 0) {
          // Moving left, pressing right - decelerate faster
          this.physicsState.groundSpeed += DECELERATION * delta;
        } else if (this.physicsState.groundSpeed < TOP_SPEED) {
          // Moving right or stopped - accelerate right
          this.physicsState.groundSpeed += ACCELERATION * delta;
        }
      }
    }

    // Apply friction when no input
    if (!cursors.left?.isDown && !cursors.right?.isDown) {
      if (this.physicsState.groundSpeed > 0) {
        this.physicsState.groundSpeed -= Math.min(
          this.physicsState.groundSpeed,
          FRICTION * delta
        );
      } else if (this.physicsState.groundSpeed < 0) {
        this.physicsState.groundSpeed += Math.min(
          Math.abs(this.physicsState.groundSpeed),
          FRICTION * delta
        );
      }
    }

    // Cap to top speed
    if (Math.abs(this.physicsState.groundSpeed) > TOP_SPEED) {
      this.physicsState.groundSpeed =
        Math.sign(this.physicsState.groundSpeed) * TOP_SPEED;
    }

    // Check for roll
    if (
      this.rollKey?.isDown &&
      !this.physicsState.isRolling &&
      Math.abs(this.physicsState.groundSpeed) > PhysicsConstants.ROLL_MIN_SPEED
    ) {
      this.physicsState.isRolling = true;
    }

    // Rolling physics (reduced control, different friction)
    if (this.physicsState.isRolling) {
      // Can't unroll until speed is too low
      if (Math.abs(this.physicsState.groundSpeed) < PhysicsConstants.ROLL_MIN_SPEED) {
        this.physicsState.isRolling = false;
      }
    }
  }

  /**
   * Air movement with reduced control
   */
  private updateAirMovement(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    delta: number
  ) {
    const { AIR_ACCELERATION, GRAVITY, JUMP_RELEASE, MAX_Y_VELOCITY } =
      PhysicsConstants;

    // Air control (reduced compared to ground)
    if (cursors.left?.isDown) {
      this.physicsState.xVelocity -= AIR_ACCELERATION * delta;
    } else if (cursors.right?.isDown) {
      this.physicsState.xVelocity += AIR_ACCELERATION * delta;
    }

    // Apply gravity
    this.physicsState.yVelocity += GRAVITY * delta;

    // Cap fall speed
    if (this.physicsState.yVelocity > MAX_Y_VELOCITY) {
      this.physicsState.yVelocity = MAX_Y_VELOCITY;
    }

    // Variable jump height - release jump early for shorter jump
    if (this.physicsState.isJumping && !this.jumpKey?.isDown) {
      if (this.physicsState.yVelocity < JUMP_RELEASE) {
        this.physicsState.yVelocity = JUMP_RELEASE;
      }
    }

    // Cap horizontal air speed
    const maxAirSpeed = PhysicsConstants.TOP_SPEED_CAP;
    if (Math.abs(this.physicsState.xVelocity) > maxAirSpeed) {
      this.physicsState.xVelocity =
        Math.sign(this.physicsState.xVelocity) * maxAirSpeed;
    }
  }

  /**
   * Check and execute jump
   */
  private checkJump() {
    if (
      Phaser.Input.Keyboard.JustDown(this.jumpKey) &&
      this.physicsState.isGrounded &&
      !this.physicsState.isJumping
    ) {
      // Jump perpendicular to surface
      const angleRad = (this.physicsState.groundAngle * Math.PI) / 180;
      const jumpForce = PhysicsConstants.JUMP_FORCE;

      // Jump direction is perpendicular to ground angle
      this.physicsState.xVelocity = this.physicsState.groundSpeed - jumpForce * Math.sin(angleRad);
      this.physicsState.yVelocity = -jumpForce * Math.cos(angleRad);

      this.physicsState.isJumping = true;
      this.physicsState.isGrounded = false;

      console.log('Jump!', { angle: this.physicsState.groundAngle });
    }
  }

  /**
   * Get current physics state (for debugging)
   */
  public getPhysicsState(): SonicPhysicsState {
    return { ...this.physicsState };
  }

  /**
   * Get current player state
   */
  public getCurrentState(): PlayerState {
    if (!this.physicsState.isGrounded) {
      return PlayerState.JUMPING;
    }
    if (this.physicsState.isRolling) {
      return PlayerState.ROLLING;
    }
    if (Math.abs(this.physicsState.groundSpeed) > PhysicsConstants.RUN_SPEED) {
      return PlayerState.RUNNING;
    }
    if (Math.abs(this.physicsState.groundSpeed) > 0.1) {
      return PlayerState.WALKING;
    }
    return PlayerState.IDLE;
  }

  /**
   * Take damage from enemy or hazard
   * Returns true if damage was applied
   */
  public takeDamage(knockbackDirection: number = 1): boolean {
    // Check if player will die from this damage (0 rings)
    if (this.ringCount === 0) {
      // Player dies
      this.die();
      return true;
    }

    const result = this.damageSystem.applyDamage(
      this.x,
      this.y,
      this.ringCount,
      knockbackDirection
    );

    if (result.damaged) {
      // Reset ring count
      this.ringCount = 0;

      // Apply knockback
      this.physicsState.xVelocity = result.knockbackX;
      this.physicsState.yVelocity = result.knockbackY;
      this.physicsState.isGrounded = false;
      this.physicsState.isJumping = true;

      // Reset control lock to prevent immediate input
      this.physicsState.controlLock = 30; // Half second
    }

    return result.damaged;
  }

  /**
   * Collect a ring
   */
  public collectRing(): void {
    this.ringCount++;
  }

  /**
   * Get current ring count
   */
  public getRingCount(): number {
    return this.ringCount;
  }

  /**
   * Check if player is invincible
   */
  public isInvincible(): boolean {
    return this.damageSystem.isInvincible();
  }

  /**
   * Get damage system (for accessing scattered rings)
   */
  public getDamageSystem(): DamageSystem {
    return this.damageSystem;
  }

  /**
   * Check for death conditions (pit fall, etc.)
   */
  private checkDeathConditions(): void {
    if (!this.lifeSystem || this.lifeSystem.isPlayerDead()) return;

    // Death by falling into pit (below world bounds + buffer)
    if (this.y > 700) {
      console.log('Player fell into pit!');
      this.die();
    }

    // TODO: Add time limit death condition
  }

  /**
   * Trigger player death
   */
  public die(): void {
    if (!this.lifeSystem || this.lifeSystem.isPlayerDead()) return;

    // Play death animation
    this.playDeathAnimation();

    // Trigger death through life system
    this.lifeSystem.triggerDeath();
  }

  /**
   * Play death animation
   */
  private playDeathAnimation(): void {
    // Freeze player state
    this.physicsState.groundSpeed = 0;
    this.physicsState.xVelocity = 0;
    this.physicsState.yVelocity = -8; // Jump up slightly
    this.physicsState.isGrounded = false;

    // Animate death (fall off screen)
    this.scene.tweens.add({
      targets: this,
      y: this.y + 200,
      alpha: 0,
      duration: 1500,
      ease: 'Quad.easeIn',
    });

    console.log('Death animation playing...');
  }

  /**
   * Respawn player at checkpoint
   */
  public respawn(): void {
    if (!this.lifeSystem) return;

    const respawnPos = this.lifeSystem.getRespawnPosition();

    // Reset position
    this.x = respawnPos.x;
    this.y = respawnPos.y;
    this.setAlpha(1.0);

    // Reset physics state
    this.physicsState.x = respawnPos.x;
    this.physicsState.y = respawnPos.y;
    this.physicsState.groundSpeed = 0;
    this.physicsState.xVelocity = 0;
    this.physicsState.yVelocity = 0;
    this.physicsState.groundAngle = 0;
    this.physicsState.isGrounded = false;
    this.physicsState.isJumping = false;
    this.physicsState.isRolling = false;
    this.physicsState.controlLock = 30; // Brief control lock

    // Reset damage system
    this.damageSystem.reset();

    // Start with some rings
    this.ringCount = 0;

    console.log('Player respawned!');
  }

  /**
   * Get life system
   */
  public getLifeSystem(): LifeSystem | null {
    return this.lifeSystem || null;
  }
}
