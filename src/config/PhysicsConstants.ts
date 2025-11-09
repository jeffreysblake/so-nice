/**
 * Sonic Physics Constants
 * Based on the Sonic Physics Guide from Sonic Retro
 * Original values are from Sonic the Hedgehog (1991) for Sega Genesis
 *
 * All values are per frame at 60 FPS
 */

export class PhysicsConstants {
  // Ground Movement
  static readonly ACCELERATION = 0.046875;      // 12 subpixels per step
  static readonly DECELERATION = 0.5;           // 128 subpixels per step
  static readonly FRICTION = 0.046875;          // 12 subpixels per step
  static readonly TOP_SPEED = 6;                // pixels per step
  static readonly TOP_SPEED_CAP = 16;           // Maximum speed (rolling downhill)

  // Air Movement
  static readonly GRAVITY = 0.21875;            // 56 subpixels per step
  static readonly JUMP_FORCE = 6.5;             // Initial jump velocity
  static readonly JUMP_RELEASE = -4;            // Minimum jump velocity when button released
  static readonly AIR_ACCELERATION = 0.09375;   // 24 subpixels per step (half of ground)

  // Rolling
  static readonly ROLL_FRICTION = 0.0234375;    // 6 subpixels per step
  static readonly ROLL_DECELERATION = 0.125;    // 32 subpixels per step
  static readonly ROLL_MIN_SPEED = 0.5;         // Minimum speed to maintain roll

  // Slope Physics
  static readonly SLOPE_FACTOR_NORMAL = 0.125;  // 32 subpixels per step
  static readonly SLOPE_FACTOR_ROLLUP = 0.078125;    // 20 subpixels per step
  static readonly SLOPE_FACTOR_ROLLDOWN = 0.3125;    // 80 subpixels per step

  // Angle and Rotation
  static readonly ANGLE_MODE_THRESHOLD = 45;    // Degrees - when to switch gravity modes
  static readonly MAX_SLOPE_ANGLE = 90;         // Maximum angle Sonic can stand on
  static readonly FALL_ANGLE = 70;              // Angle at which Sonic falls off

  // Gravity Modes (angles that trigger mode switches)
  static readonly MODE_FLOOR_MIN = 315;         // Floor mode: 315° - 45°
  static readonly MODE_FLOOR_MAX = 45;
  static readonly MODE_RWALL_MIN = 45;          // Right wall: 45° - 135°
  static readonly MODE_RWALL_MAX = 135;
  static readonly MODE_CEILING_MIN = 135;       // Ceiling: 135° - 225°
  static readonly MODE_CEILING_MAX = 225;
  static readonly MODE_LWALL_MIN = 225;         // Left wall: 225° - 315°
  static readonly MODE_LWALL_MAX = 315;

  // Loop Requirements
  static readonly LOOP_SPEED_THRESHOLD = 4.0;   // Minimum speed to stay in loop

  // Collision
  static readonly SENSOR_WIDTH = 9;             // Width between ground sensors
  static readonly SENSOR_HEIGHT = 20;           // Height of side sensors
  static readonly PUSH_RADIUS = 10;             // Collision push-out radius

  // Speed States
  static readonly WALK_SPEED = 1.0;             // Threshold for walk animation
  static readonly RUN_SPEED = 6.0;              // Threshold for run animation
  static readonly PEELOUT_SPEED = 12.0;         // Super peel-out speed

  // Game Loop
  static readonly FPS = 60;
  static readonly FIXED_TIMESTEP = 1000 / 60;   // ~16.67ms per frame

  // Spindash (from SPG:Special_Abilities)
  static readonly SPINDASH_CHARGE = 2;          // Charge added per button press
  static readonly SPINDASH_MAX_CHARGE = 8;      // Maximum charge value
  static readonly SPINDASH_RELEASE_SPEED = 8;   // Base release speed (8 + floor(charge)/2)
  static readonly SPINDASH_MAX_SPEED = 12;      // Maximum speed at full charge (8 + 8/2 = 12)

  // Terminal Velocities
  static readonly MAX_X_VELOCITY = 16;
  static readonly MAX_Y_VELOCITY = 16;

  // Camera
  static readonly CAMERA_LAG_X = 16;            // Horizontal camera lag
  static readonly CAMERA_LOOKAHEAD = 64;        // How far ahead camera looks
}
