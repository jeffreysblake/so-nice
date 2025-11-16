/**
 * PhysicsSimulator - Headless physics simulation for testing
 * Simulates Sonic physics without Phaser dependencies
 */
import { PhysicsConstants } from '../../config/PhysicsConstants';
import { GroundMode } from '../../types/SonicTypes';
export class PhysicsSimulator {
    state;
    collisionManager = null;
    sensorWidth = 9;
    heightRadius = 20;
    hasLoggedLanding = false; // For diagnostic logging
    wasGroundedLastFrame = false; // Track grounded state across frames
    wasJumpPressedLastFrame = false; // Track jump button state for JustDown detection
    constructor(x = 0, y = 0) {
        this.state = {
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
    }
    setCollisionManager(manager) {
        this.collisionManager = manager;
    }
    getState() {
        return { ...this.state };
    }
    setState(newState) {
        // Track previous grounded state before updating
        if ('isGrounded' in newState) {
            this.wasGroundedLastFrame = this.state.isGrounded;
        }
        this.state = { ...this.state, ...newState };
    }
    /**
     * Simulate one frame of physics
     */
    update(input, deltaFrames = 1) {
        // Update control lock
        if (this.state.controlLock > 0) {
            this.state.controlLock--;
        }
        // Check ground collision if we have a collision manager
        if (this.collisionManager) {
            this.checkGroundCollision();
        }
        // If we just landed (became grounded), clear jumping state
        if (!this.wasGroundedLastFrame && this.state.isGrounded) {
            this.state.isJumping = false;
        }
        // If we just left the ground (and didn't jump), convert groundSpeed to air velocity
        if (this.wasGroundedLastFrame && !this.state.isGrounded && !this.state.isJumping) {
            const angleRad = (this.state.groundAngle * Math.PI) / 180;
            this.state.xVelocity = this.state.groundSpeed * Math.cos(angleRad);
            this.state.yVelocity = this.state.groundSpeed * -Math.sin(angleRad);
        }
        if (this.state.isGrounded) {
            this.updateGroundMovement(input, deltaFrames);
            this.applySlopePhysics(deltaFrames);
            this.checkJump(input);
        }
        else {
            this.updateAirMovement(input, deltaFrames);
        }
        // Move player
        this.movePlayer(deltaFrames);
        // Track grounded state for next frame
        this.wasGroundedLastFrame = this.state.isGrounded;
        // Track jump button state for next frame (for JustDown detection)
        this.wasJumpPressedLastFrame = input.jump;
    }
    /**
     * Check ground collision using sensors
     */
    checkGroundCollision() {
        if (!this.collisionManager)
            return;
        const sensorY = this.state.y + this.heightRadius;
        const groundResult = this.collisionManager.checkGroundSensors(this.state.x, sensorY, this.sensorWidth, this.state.groundMode);
        const wasGrounded = this.state.isGrounded;
        // DIAGNOSTIC: Log every collision detection
        if (groundResult.collided && !wasGrounded && !this.hasLoggedLanding) {
            console.log(`[COLLISION] sensorY=${sensorY.toFixed(2)}, distance=${groundResult.distance.toFixed(2)}, player.y=${this.state.y.toFixed(2)}`);
        }
        if (groundResult.collided) {
            // Only snap to surface when landing from air
            if (!wasGrounded) {
                // Diagnostic logging for first landing only
                const shouldLog = !this.hasLoggedLanding;
                if (shouldLog) {
                    console.log(`[LANDING] player.y=${this.state.y.toFixed(2)}, sensorY=${sensorY.toFixed(2)}`);
                    console.log(`[LANDING] collisionDistance=${groundResult.distance.toFixed(2)}`);
                    console.log(`[LANDING] tile: gridY=${Math.floor(sensorY / 16)}, tileY=${Math.floor(sensorY / 16) * 16}`);
                }
                this.state.isGrounded = true;
                this.state.groundAngle = groundResult.angle;
                this.state.y -= groundResult.distance;
                if (shouldLog) {
                    console.log(`[LANDING] after snap: player.y=${this.state.y.toFixed(2)}, sensor at ${(this.state.y + this.heightRadius).toFixed(2)}`);
                    this.hasLoggedLanding = true;
                }
                // Convert air velocity to ground speed when landing
                const angleRad = (groundResult.angle * Math.PI) / 180;
                const surfaceX = Math.cos(angleRad);
                const surfaceY = Math.sin(angleRad);
                // Dot product to project velocity onto surface direction
                // Note: yVelocity sign is already in screen coords (Y+ down)
                const speedAlongSurface = this.state.xVelocity * surfaceX - this.state.yVelocity * surfaceY;
                this.state.groundSpeed = speedAlongSurface;
                this.state.yVelocity = 0;
                this.state.isJumping = false;
            }
            else {
                // Already grounded - just update angle
                this.state.isGrounded = true;
                this.state.groundAngle = groundResult.angle;
            }
        }
        else {
            if (wasGrounded && !this.state.isJumping) {
                const angle = Math.abs(this.state.groundAngle);
                if (angle > PhysicsConstants.FALL_ANGLE && angle < (360 - PhysicsConstants.FALL_ANGLE)) {
                    const angleRad = (this.state.groundAngle * Math.PI) / 180;
                    this.state.xVelocity = this.state.groundSpeed * Math.cos(angleRad);
                    this.state.yVelocity = this.state.groundSpeed * Math.sin(angleRad);
                    this.state.isGrounded = false;
                }
            }
            if (!this.state.isJumping && groundResult.distance > 4) {
                this.state.isGrounded = false;
            }
        }
    }
    /**
     * Ground movement physics
     */
    updateGroundMovement(input, delta) {
        const { ACCELERATION, DECELERATION, FRICTION, ROLL_FRICTION, TOP_SPEED, ROLL_MIN_SPEED } = PhysicsConstants;
        const controlsLocked = this.state.controlLock > 0;
        if (!controlsLocked) {
            if (input.left) {
                if (this.state.groundSpeed > 0) {
                    this.state.groundSpeed -= DECELERATION * delta;
                }
                else if (this.state.groundSpeed > -TOP_SPEED) {
                    this.state.groundSpeed -= ACCELERATION * delta;
                }
            }
            else if (input.right) {
                if (this.state.groundSpeed < 0) {
                    this.state.groundSpeed += DECELERATION * delta;
                }
                else if (this.state.groundSpeed < TOP_SPEED) {
                    this.state.groundSpeed += ACCELERATION * delta;
                }
            }
        }
        // Friction - use different values for rolling vs running
        if (!input.left && !input.right) {
            const frictionValue = this.state.isRolling ? ROLL_FRICTION : FRICTION;
            if (this.state.groundSpeed > 0) {
                this.state.groundSpeed -= Math.min(this.state.groundSpeed, frictionValue * delta);
            }
            else if (this.state.groundSpeed < 0) {
                this.state.groundSpeed += Math.min(Math.abs(this.state.groundSpeed), frictionValue * delta);
            }
        }
        // Cap speed
        if (Math.abs(this.state.groundSpeed) > TOP_SPEED) {
            this.state.groundSpeed = Math.sign(this.state.groundSpeed) * TOP_SPEED;
        }
        // Spin dash mechanics
        const isStopped = Math.abs(this.state.groundSpeed) < 0.5;
        // Enter spin dash state when DOWN is held while stopped
        if (input.down && isStopped && !this.state.isSpindashing) {
            this.state.isSpindashing = true;
            this.state.spindashCharge = 0;
        }
        // Spin dash charging and decay
        if (this.state.isSpindashing) {
            // Charge on jump button press (JustDown simulation)
            const jumpJustPressed = input.jump && !this.wasJumpPressedLastFrame;
            if (jumpJustPressed) {
                this.state.spindashCharge = Math.min(this.state.spindashCharge + PhysicsConstants.SPINDASH_CHARGE, PhysicsConstants.SPINDASH_MAX_CHARGE);
            }
            // Apply decay each frame (but not on the same frame as charging)
            if (this.state.spindashCharge > 0 && !jumpJustPressed) {
                this.state.spindashCharge -=
                    (this.state.spindashCharge / 0.125) / 256 * delta;
                // Clamp to zero to prevent negative charge
                if (this.state.spindashCharge < 0) {
                    this.state.spindashCharge = 0;
                }
            }
            // Release spin dash when DOWN is released
            if (!input.down && this.state.spindashCharge > 0) {
                // Convert charge to ground speed
                const releaseSpeed = PhysicsConstants.SPINDASH_RELEASE_SPEED +
                    Math.floor(this.state.spindashCharge) / 2;
                // Apply in facing direction
                this.state.groundSpeed =
                    this.state.isFacingRight ? releaseSpeed : -releaseSpeed;
                // Start rolling
                this.state.isRolling = true;
                this.state.isSpindashing = false;
                this.state.spindashCharge = 0;
            }
            // Cancel spin dash if DOWN released with no charge
            if (!input.down && this.state.spindashCharge === 0) {
                this.state.isSpindashing = false;
            }
        }
        // Rolling (normal roll, not from spin dash)
        if (input.down && !this.state.isRolling && !this.state.isSpindashing && Math.abs(this.state.groundSpeed) > ROLL_MIN_SPEED) {
            this.state.isRolling = true;
        }
        if (this.state.isRolling && Math.abs(this.state.groundSpeed) < ROLL_MIN_SPEED) {
            this.state.isRolling = false;
        }
    }
    /**
     * Air movement physics
     */
    updateAirMovement(input, delta) {
        const { AIR_ACCELERATION, GRAVITY, MAX_Y_VELOCITY } = PhysicsConstants;
        if (input.left) {
            this.state.xVelocity -= AIR_ACCELERATION * delta;
        }
        else if (input.right) {
            this.state.xVelocity += AIR_ACCELERATION * delta;
        }
        this.state.yVelocity += GRAVITY * delta;
        if (this.state.yVelocity > MAX_Y_VELOCITY) {
            this.state.yVelocity = MAX_Y_VELOCITY;
        }
        const maxAirSpeed = PhysicsConstants.TOP_SPEED_CAP;
        if (Math.abs(this.state.xVelocity) > maxAirSpeed) {
            this.state.xVelocity = Math.sign(this.state.xVelocity) * maxAirSpeed;
        }
    }
    /**
     * Apply slope physics
     */
    applySlopePhysics(delta) {
        const angle = this.state.groundAngle;
        if (angle !== 0 && angle !== 180) {
            const angleRad = (angle * Math.PI) / 180;
            const sinAngle = Math.sin(angleRad);
            let slopeFactor;
            if (this.state.isRolling) {
                // Note: In screen coords with Y+ down, negative sin = downhill
                // e.g., 315° (downhill right) has sin(315°) = -0.707
                // Downhill (negative sine): use stronger factor for rolling downhill
                // Uphill (positive sine): use weaker factor for rolling uphill
                slopeFactor = sinAngle < 0
                    ? PhysicsConstants.SLOPE_FACTOR_ROLLDOWN
                    : PhysicsConstants.SLOPE_FACTOR_ROLLUP;
            }
            else {
                slopeFactor = PhysicsConstants.SLOPE_FACTOR_NORMAL;
            }
            this.state.groundSpeed -= slopeFactor * sinAngle * delta;
        }
    }
    /**
     * Check and execute jump
     */
    checkJump(input) {
        if (input.jump && this.state.isGrounded && !this.state.isJumping) {
            const angleRad = (this.state.groundAngle * Math.PI) / 180;
            const jumpForce = PhysicsConstants.JUMP_FORCE;
            this.state.xVelocity = this.state.groundSpeed - jumpForce * Math.sin(angleRad);
            this.state.yVelocity = -jumpForce * Math.cos(angleRad);
            this.state.isJumping = true;
            this.state.isGrounded = false;
        }
    }
    /**
     * Move player based on velocity
     */
    movePlayer(delta) {
        if (this.state.isGrounded) {
            const angleRad = (this.state.groundAngle * Math.PI) / 180;
            this.state.xVelocity = this.state.groundSpeed * Math.cos(angleRad);
            // Negate Y because screen coordinates have Y increasing downward
            // Standard trig: sin(45°) = +0.707 (up), sin(315°) = -0.707 (down)
            // Screen coords: Y+ is down, so we negate to get correct screen direction
            this.state.yVelocity = this.state.groundSpeed * -Math.sin(angleRad);
        }
        this.state.x += this.state.xVelocity * delta;
        this.state.y += this.state.yVelocity * delta;
    }
    /**
     * Simulate multiple frames
     */
    simulateFrames(frames, input) {
        for (let i = 0; i < frames; i++) {
            this.update(input, 1);
        }
    }
}
