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
        if (groundResult.collided) {
            if (!wasGrounded || this.state.yVelocity >= 0) {
                this.state.isGrounded = true;
                this.state.groundAngle = groundResult.angle;
                this.state.y -= groundResult.distance;
                if (!wasGrounded && this.state.yVelocity > 0) {
                    const angleRad = (groundResult.angle * Math.PI) / 180;
                    const slopeFactor = Math.sin(angleRad);
                    this.state.groundSpeed += this.state.yVelocity * slopeFactor * 0.5;
                }
                this.state.yVelocity = 0;
                this.state.isJumping = false;
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
        const { ACCELERATION, DECELERATION, FRICTION, TOP_SPEED, ROLL_MIN_SPEED } = PhysicsConstants;
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
        // Friction
        if (!input.left && !input.right) {
            if (this.state.groundSpeed > 0) {
                this.state.groundSpeed -= Math.min(this.state.groundSpeed, FRICTION * delta);
            }
            else if (this.state.groundSpeed < 0) {
                this.state.groundSpeed += Math.min(Math.abs(this.state.groundSpeed), FRICTION * delta);
            }
        }
        // Cap speed
        if (Math.abs(this.state.groundSpeed) > TOP_SPEED) {
            this.state.groundSpeed = Math.sign(this.state.groundSpeed) * TOP_SPEED;
        }
        // Rolling
        if (input.down && !this.state.isRolling && Math.abs(this.state.groundSpeed) > ROLL_MIN_SPEED) {
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
                // Uphill (negative sine): use weaker factor for rolling uphill
                // Downhill (positive sine): use stronger factor for rolling downhill
                slopeFactor = sinAngle < 0
                    ? PhysicsConstants.SLOPE_FACTOR_ROLLUP
                    : PhysicsConstants.SLOPE_FACTOR_ROLLDOWN;
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
            this.state.yVelocity = this.state.groundSpeed * Math.sin(angleRad);
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
