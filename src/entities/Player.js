import Phaser from 'phaser';
import { PhysicsConstants } from '../config/PhysicsConstants';
import { PlayerState, GroundMode, } from '../types/SonicTypes';
/**
 * Player - Sonic character with authentic physics
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
    // Physics state
    physicsState;
    // Collision system
    collisionManager = null;
    // Input tracking
    jumpKey;
    rollKey;
    // Sensor dimensions
    sensorWidth = 9;
    heightRadius = 20;
    constructor(scene, x, y) {
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
        // Set up arcade physics body - we'll use it for basic movement but not collision
        if (this.body) {
            const body = this.body;
            body.setSize(20, 32);
            body.setOffset(6, 0);
            body.setMaxVelocity(PhysicsConstants.MAX_X_VELOCITY * 60, PhysicsConstants.MAX_Y_VELOCITY * 60);
            // Disable default gravity and collision - we'll handle it manually
            body.setAllowGravity(false);
            body.setCollideWorldBounds(false);
        }
        // Set up input
        this.setupInput(scene);
    }
    /**
     * Set the collision manager (called by GameScene)
     */
    setCollisionManager(manager) {
        this.collisionManager = manager;
    }
    setupInput(scene) {
        if (scene.input.keyboard) {
            this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
            this.rollKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        }
    }
    update(_time, delta, cursors) {
        if (!this.collisionManager)
            return;
        // Normalize delta to expected frame time (60 FPS)
        const deltaNormalized = delta / PhysicsConstants.FIXED_TIMESTEP;
        // Update control lock
        if (this.physicsState.controlLock > 0) {
            this.physicsState.controlLock--;
        }
        // Check ground collision using sensors
        this.checkGroundCollision();
        if (this.physicsState.isGrounded) {
            this.updateGroundMovement(cursors, deltaNormalized);
            this.applySlopePhysics(deltaNormalized);
            this.checkJump();
        }
        else {
            this.updateAirMovement(cursors, deltaNormalized);
        }
        // Move the player
        this.movePlayer(deltaNormalized);
        // Update position in physics state
        this.physicsState.x = this.x;
        this.physicsState.y = this.y;
        // Update sprite facing direction
        if (this.physicsState.groundSpeed > 0) {
            this.setFlipX(false);
            this.physicsState.isFacingRight = true;
        }
        else if (this.physicsState.groundSpeed < 0) {
            this.setFlipX(true);
            this.physicsState.isFacingRight = false;
        }
        // Update sprite rotation based on ground angle
        if (this.physicsState.isGrounded) {
            this.setAngle(this.physicsState.groundAngle);
        }
        else {
            // Smoothly rotate back to 0 in air
            this.setAngle(Phaser.Math.Linear(this.angle, 0, 0.2));
        }
    }
    /**
     * Check ground collision using sensor system
     */
    checkGroundCollision() {
        if (!this.collisionManager)
            return;
        const sensorY = this.y + this.heightRadius;
        const groundResult = this.collisionManager.checkGroundSensors(this.x, sensorY, this.sensorWidth, this.physicsState.groundMode);
        const wasGrounded = this.physicsState.isGrounded;
        if (groundResult.collided) {
            // We hit ground
            if (!wasGrounded || this.physicsState.yVelocity >= 0) {
                // Landing or already on ground
                this.physicsState.isGrounded = true;
                this.physicsState.groundAngle = groundResult.angle;
                // Snap to surface
                this.y -= groundResult.distance;
                // Landing: convert Y velocity to ground speed
                if (!wasGrounded && this.physicsState.yVelocity > 0) {
                    // Transfer vertical momentum when landing on slopes
                    const angleRad = (groundResult.angle * Math.PI) / 180;
                    const slopeFactor = Math.sin(angleRad);
                    this.physicsState.groundSpeed += this.physicsState.yVelocity * slopeFactor * 0.5;
                }
                this.physicsState.yVelocity = 0;
                this.physicsState.isJumping = false;
            }
        }
        else {
            // No ground detected
            if (wasGrounded && !this.physicsState.isJumping) {
                // Check if we should fall (angle too steep or walked off edge)
                const angle = Math.abs(this.physicsState.groundAngle);
                if (angle > PhysicsConstants.FALL_ANGLE && angle < (360 - PhysicsConstants.FALL_ANGLE)) {
                    // Convert ground speed to air velocity when falling
                    const angleRad = (this.physicsState.groundAngle * Math.PI) / 180;
                    this.physicsState.xVelocity = this.physicsState.groundSpeed * Math.cos(angleRad);
                    this.physicsState.yVelocity = this.physicsState.groundSpeed * Math.sin(angleRad);
                    this.physicsState.isGrounded = false;
                }
            }
            if (!this.physicsState.isJumping && groundResult.distance > 4) {
                this.physicsState.isGrounded = false;
            }
        }
    }
    /**
     * Apply slope physics (slope factor affects ground speed)
     */
    applySlopePhysics(delta) {
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
    movePlayer(delta) {
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
    updateGroundMovement(cursors, delta) {
        const { ACCELERATION, DECELERATION, FRICTION, TOP_SPEED } = PhysicsConstants;
        const controlsLocked = this.physicsState.controlLock > 0;
        // Left/Right input
        if (!controlsLocked) {
            if (cursors.left?.isDown) {
                if (this.physicsState.groundSpeed > 0) {
                    // Moving right, pressing left - decelerate faster
                    this.physicsState.groundSpeed -= DECELERATION * delta;
                }
                else if (this.physicsState.groundSpeed > -TOP_SPEED) {
                    // Moving left or stopped - accelerate left
                    this.physicsState.groundSpeed -= ACCELERATION * delta;
                }
            }
            else if (cursors.right?.isDown) {
                if (this.physicsState.groundSpeed < 0) {
                    // Moving left, pressing right - decelerate faster
                    this.physicsState.groundSpeed += DECELERATION * delta;
                }
                else if (this.physicsState.groundSpeed < TOP_SPEED) {
                    // Moving right or stopped - accelerate right
                    this.physicsState.groundSpeed += ACCELERATION * delta;
                }
            }
        }
        // Apply friction when no input
        if (!cursors.left?.isDown && !cursors.right?.isDown) {
            if (this.physicsState.groundSpeed > 0) {
                this.physicsState.groundSpeed -= Math.min(this.physicsState.groundSpeed, FRICTION * delta);
            }
            else if (this.physicsState.groundSpeed < 0) {
                this.physicsState.groundSpeed += Math.min(Math.abs(this.physicsState.groundSpeed), FRICTION * delta);
            }
        }
        // Cap to top speed
        if (Math.abs(this.physicsState.groundSpeed) > TOP_SPEED) {
            this.physicsState.groundSpeed =
                Math.sign(this.physicsState.groundSpeed) * TOP_SPEED;
        }
        // Check for roll
        if (this.rollKey?.isDown &&
            !this.physicsState.isRolling &&
            Math.abs(this.physicsState.groundSpeed) > PhysicsConstants.ROLL_MIN_SPEED) {
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
    updateAirMovement(cursors, delta) {
        const { AIR_ACCELERATION, GRAVITY, JUMP_RELEASE, MAX_Y_VELOCITY } = PhysicsConstants;
        // Air control (reduced compared to ground)
        if (cursors.left?.isDown) {
            this.physicsState.xVelocity -= AIR_ACCELERATION * delta;
        }
        else if (cursors.right?.isDown) {
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
    checkJump() {
        if (Phaser.Input.Keyboard.JustDown(this.jumpKey) &&
            this.physicsState.isGrounded &&
            !this.physicsState.isJumping) {
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
    getPhysicsState() {
        return { ...this.physicsState };
    }
    /**
     * Get current player state
     */
    getCurrentState() {
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
