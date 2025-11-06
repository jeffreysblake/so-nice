import Phaser from 'phaser';
import { PhysicsConstants } from '../config/PhysicsConstants';
import {
  PlayerState,
  GroundMode,
  SonicPhysicsState,
} from '../types/SonicTypes';

/**
 * Player - Sonic character with authentic physics
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  // Physics state
  private physicsState: SonicPhysicsState;

  // Input tracking
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private rollKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sonic-placeholder');

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

    // Set up arcade physics body
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(20, 32);
      body.setOffset(6, 0);
      body.setMaxVelocity(
        PhysicsConstants.MAX_X_VELOCITY * 60,
        PhysicsConstants.MAX_Y_VELOCITY * 60
      );
      // Disable default gravity - we'll handle it manually
      body.setAllowGravity(false);
    }

    // Set up input
    this.setupInput(scene);
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
    // Normalize delta to expected frame time (60 FPS)
    const deltaNormalized = delta / PhysicsConstants.FIXED_TIMESTEP;

    // Update control lock
    if (this.physicsState.controlLock > 0) {
      this.physicsState.controlLock--;
    }

    // Check if grounded (using Phaser's built-in collision)
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.physicsState.isGrounded = body.touching.down;

    if (this.physicsState.isGrounded) {
      this.updateGroundMovement(cursors, deltaNormalized);
      this.checkJump();
    } else {
      this.updateAirMovement(cursors, deltaNormalized);
    }

    // Apply velocity to sprite
    this.applyVelocity();

    // Update position in physics state
    this.physicsState.x = this.x;
    this.physicsState.y = this.y;

    // Update sprite facing direction
    if (this.physicsState.groundSpeed > 0) {
      this.setFlipX(false);
      this.physicsState.isFacingRight = true;
    } else if (this.physicsState.groundSpeed < 0) {
      this.setFlipX(true);
      this.physicsState.isFacingRight = false;
    }
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

    // Reset air velocity when landing
    if (!this.physicsState.isGrounded && (this.body as Phaser.Physics.Arcade.Body).touching.down) {
      this.physicsState.isGrounded = true;
      this.physicsState.yVelocity = 0;
      this.physicsState.isJumping = false;
    }

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

    // Convert ground speed to x velocity
    this.physicsState.xVelocity = this.physicsState.groundSpeed;
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
      // Set jump velocity
      this.physicsState.yVelocity = -PhysicsConstants.JUMP_FORCE;
      this.physicsState.isJumping = true;
      this.physicsState.isGrounded = false;

      // Preserve horizontal momentum
      this.physicsState.xVelocity = this.physicsState.groundSpeed;

      console.log('Jump!');
    }
  }

  /**
   * Apply calculated velocities to the sprite
   */
  private applyVelocity() {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Convert our velocity (pixels per frame) to Phaser's velocity (pixels per second)
    body.setVelocityX(this.physicsState.xVelocity * PhysicsConstants.FPS);
    body.setVelocityY(this.physicsState.yVelocity * PhysicsConstants.FPS);
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
}
