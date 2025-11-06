/**
 * Sonic Physics Constants
 * Based on the Sonic Physics Guide from Sonic Retro
 * Original values are from Sonic the Hedgehog (1991) for Sega Genesis
 *
 * All values are per frame at 60 FPS
 */
export class PhysicsConstants {
    // Ground Movement
    static ACCELERATION = 0.046875; // 12 subpixels per step
    static DECELERATION = 0.5; // 128 subpixels per step
    static FRICTION = 0.046875; // 12 subpixels per step
    static TOP_SPEED = 6; // pixels per step
    static TOP_SPEED_CAP = 16; // Maximum speed (rolling downhill)
    // Air Movement
    static GRAVITY = 0.21875; // 56 subpixels per step
    static JUMP_FORCE = 6.5; // Initial jump velocity
    static JUMP_RELEASE = -4; // Minimum jump velocity when button released
    static AIR_ACCELERATION = 0.09375; // 24 subpixels per step (half of ground)
    // Rolling
    static ROLL_FRICTION = 0.0234375; // 6 subpixels per step
    static ROLL_DECELERATION = 0.125; // 32 subpixels per step
    static ROLL_MIN_SPEED = 0.5; // Minimum speed to maintain roll
    // Slope Physics
    static SLOPE_FACTOR_NORMAL = 0.125; // 32 subpixels per step
    static SLOPE_FACTOR_ROLLUP = 0.078125; // 20 subpixels per step
    static SLOPE_FACTOR_ROLLDOWN = 0.3125; // 80 subpixels per step
    // Angle and Rotation
    static ANGLE_MODE_THRESHOLD = 45; // Degrees - when to switch gravity modes
    static MAX_SLOPE_ANGLE = 90; // Maximum angle Sonic can stand on
    static FALL_ANGLE = 70; // Angle at which Sonic falls off
    // Collision
    static SENSOR_WIDTH = 9; // Width between ground sensors
    static SENSOR_HEIGHT = 20; // Height of side sensors
    static PUSH_RADIUS = 10; // Collision push-out radius
    // Speed States
    static WALK_SPEED = 1.0; // Threshold for walk animation
    static RUN_SPEED = 6.0; // Threshold for run animation
    static PEELOUT_SPEED = 12.0; // Super peel-out speed
    // Game Loop
    static FPS = 60;
    static FIXED_TIMESTEP = 1000 / 60; // ~16.67ms per frame
    // Spindash
    static SPINDASH_CHARGE = 2; // Charge rate per button press
    static SPINDASH_RELEASE = 8; // Base release speed
    // Terminal Velocities
    static MAX_X_VELOCITY = 16;
    static MAX_Y_VELOCITY = 16;
    // Camera
    static CAMERA_LAG_X = 16; // Horizontal camera lag
    static CAMERA_LOOKAHEAD = 64; // How far ahead camera looks
}
