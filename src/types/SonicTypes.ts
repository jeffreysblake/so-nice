/**
 * Type definitions for Sonic game objects
 */

export enum PlayerState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  JUMPING = 'jumping',
  ROLLING = 'rolling',
  SPINDASH = 'spindash',
  HURT = 'hurt',
  DEAD = 'dead',
}

export enum GroundMode {
  FLOOR = 0,
  RIGHT_WALL = 1,
  CEILING = 2,
  LEFT_WALL = 3,
}

export interface SonicPhysicsState {
  // Position
  x: number;
  y: number;

  // Velocity
  groundSpeed: number;  // Speed along the ground/surface
  xVelocity: number;    // Horizontal air velocity
  yVelocity: number;    // Vertical air velocity

  // Angle and orientation
  groundAngle: number;  // Angle of the ground (0-360 degrees)
  groundMode: GroundMode;

  // State flags
  isGrounded: boolean;
  isJumping: boolean;
  isRolling: boolean;
  isSpindashing: boolean;
  isFacingRight: boolean;

  // Control locks
  controlLock: number;  // Frames of control lock remaining

  // Spindash
  spindashCharge: number;
}

export interface CollisionSensors {
  // Ground sensors (A-F from Sonic Physics Guide)
  groundLeft: Phaser.Math.Vector2;
  groundRight: Phaser.Math.Vector2;

  // Wall sensors
  wallTop: Phaser.Math.Vector2;
  wallBottom: Phaser.Math.Vector2;

  // Ceiling sensors
  ceilingLeft: Phaser.Math.Vector2;
  ceilingRight: Phaser.Math.Vector2;
}

export interface TileCollision {
  angle: number;
  height: number;
  solid: boolean;
}
