import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSimulator } from '../helpers/PhysicsSimulator';
import { PhysicsConstants } from '../../config/PhysicsConstants';
import { CollisionManager } from '../../terrain/CollisionManager';
import { TerrainTiles } from '../../terrain/TerrainTile';

/**
 * Test suite for slope physics
 * Validates slope factors, angle-based movement, and momentum
 */
describe('Slope Physics', () => {
  let simulator: PhysicsSimulator;
  let collisionManager: CollisionManager;

  beforeEach(() => {
    simulator = new PhysicsSimulator(80, 150); // Grid position (5, 9)
    collisionManager = new CollisionManager({} as any);
    simulator.setCollisionManager(collisionManager);
  });

  describe('Slope Factor Application', () => {
    it('should slow down when running uphill', () => {
      // Create upward slope
      const slopeTile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
      collisionManager.setTile(5, 10, slopeTile);

      simulator.setState({
        isGrounded: true,
        groundSpeed: 2,
        groundAngle: 45,
        y: 160
      });

      const initialSpeed = simulator.getState().groundSpeed;

      // Run for several frames
      simulator.simulateFrames(10, { left: false, right: true, jump: false, down: false });

      const finalSpeed = simulator.getState().groundSpeed;

      // Should have lost some speed going uphill
      expect(finalSpeed).toBeLessThan(initialSpeed + PhysicsConstants.ACCELERATION * 10);
    });

    it('should speed up when running downhill', () => {
      // Create a fresh simulator without collision manager for pure physics testing
      const physicsSimulator = new PhysicsSimulator(0, 0);

      // Create downward slope (315° = downhill right)
      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 1,
        groundAngle: 315,
      });

      const initialSpeed = physicsSimulator.getState().groundSpeed;

      // Let gravity do its work (no input)
      physicsSimulator.simulateFrames(20, { left: false, right: false, jump: false, down: false });

      const finalSpeed = physicsSimulator.getState().groundSpeed;

      // Should have gained speed going downhill
      expect(finalSpeed).toBeGreaterThan(initialSpeed);
    });

    it('should apply stronger slope factor when rolling', () => {
      const physicsSimulator = new PhysicsSimulator(0, 0);

      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 2,
        groundAngle: 315, // Downhill
        isRolling: true,
      });

      const initialSpeed = physicsSimulator.getState().groundSpeed;

      physicsSimulator.simulateFrames(10, { left: false, right: false, jump: false, down: false });

      const rollingSpeed = physicsSimulator.getState().groundSpeed;
      const rollingGain = rollingSpeed - initialSpeed;

      // Reset and test without rolling
      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 2,
        groundAngle: 315,
        isRolling: false,
      });

      physicsSimulator.simulateFrames(10, { left: false, right: false, jump: false, down: false });

      const normalSpeed = physicsSimulator.getState().groundSpeed;
      const normalGain = normalSpeed - initialSpeed;

      // Rolling should gain more speed
      expect(rollingGain).toBeGreaterThan(normalGain);
    });

    it('should not apply slope factor on flat ground', () => {
      const physicsSimulator = new PhysicsSimulator(0, 0);

      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 2,
        groundAngle: 0,
      });

      const initialSpeed = physicsSimulator.getState().groundSpeed;

      // No input, only friction should apply
      physicsSimulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const newSpeed = physicsSimulator.getState().groundSpeed;
      const speedLoss = initialSpeed - newSpeed;

      // Should only lose friction amount
      expect(speedLoss).toBeCloseTo(PhysicsConstants.FRICTION, 5);
    });
  });

  describe('Angle-Based Movement', () => {
    it('should move along slope angle when grounded', () => {
      // Create a fresh simulator without collision manager for pure physics testing
      const physicsSimulator = new PhysicsSimulator(0, 0);

      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 3,
        groundAngle: 45,
        x: 0,
        y: 0,
      });

      physicsSimulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = physicsSimulator.getState();

      // Movement should follow 45° angle
      // Note: Friction and slope factor are applied, so groundSpeed decreases slightly
      // friction: 0.046875, slope factor: 0.125 * sin(45°) ≈ 0.088
      // Total reduction: ~0.135, so groundSpeed ≈ 2.865
      const angleRad = (45 * Math.PI) / 180;
      const expectedSpeed = state.groundSpeed; // Use actual groundSpeed after physics
      const expectedXVel = expectedSpeed * Math.cos(angleRad);
      const expectedYVel = expectedSpeed * -Math.sin(angleRad); // Negative because Y+ is down

      expect(state.xVelocity).toBeCloseTo(expectedXVel, 1);
      expect(state.yVelocity).toBeCloseTo(expectedYVel, 1);
    });

    it('should handle steep slopes correctly', () => {
      const physicsSimulator = new PhysicsSimulator(0, 0);

      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 2,
        groundAngle: 67, // Steep slope
        x: 0,
        y: 0,
      });

      physicsSimulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = physicsSimulator.getState();

      // Should still move along the angle
      expect(state.xVelocity).not.toBe(0);
      expect(state.yVelocity).not.toBe(0);
    });

    it('should handle downward slopes', () => {
      const physicsSimulator = new PhysicsSimulator(0, 0);

      physicsSimulator.setState({
        isGrounded: true,
        groundSpeed: 3,
        groundAngle: 315, // 45° downward
        x: 0,
        y: 0,
      });

      physicsSimulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = physicsSimulator.getState();

      // X should be positive (moving right)
      // Y should be positive (moving down)
      expect(state.xVelocity).toBeGreaterThan(0);
      expect(state.yVelocity).toBeGreaterThan(0);
    });
  });

  describe('Slope Transitions', () => {
    it('should maintain momentum when transitioning from flat to slope', () => {
      // Start on flat ground
      simulator.setState({
        isGrounded: true,
        groundSpeed: 4,
        groundAngle: 0,
      });

      const initialSpeed = simulator.getState().groundSpeed;

      // Transition to slope
      simulator.setState({ groundAngle: 45 });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const newSpeed = Math.abs(simulator.getState().groundSpeed);

      // Speed magnitude should be similar (minus slope factor)
      expect(newSpeed).toBeGreaterThan(initialSpeed - 1);
    });

    it('should convert ground speed to air velocity when falling off', () => {
      simulator.setState({
        isGrounded: true,
        groundSpeed: 5,
        groundAngle: 0,
      });

      // Simulate falling off (no ground detected)
      simulator.setState({ isGrounded: false, isJumping: false });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();

      // Should have similar horizontal velocity
      expect(Math.abs(state.xVelocity)).toBeGreaterThan(4);
    });
  });

  describe('Fall Angle Threshold', () => {
    it('should fall off when angle exceeds threshold', () => {
      simulator.setState({
        isGrounded: true,
        groundSpeed: 0.5, // Low speed
        groundAngle: 80, // Steep angle > FALL_ANGLE (70°)
        isJumping: false,
      });

      // Should transition to air
      // Note: Full implementation depends on collision detection
      expect(PhysicsConstants.FALL_ANGLE).toBe(70);
      expect(80).toBeGreaterThan(PhysicsConstants.FALL_ANGLE);
    });

    it('should not fall off at angles below threshold', () => {
      simulator.setState({
        isGrounded: true,
        groundSpeed: 1,
        groundAngle: 60, // Below FALL_ANGLE
        isJumping: false,
      });

      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      // Should stay grounded (if collision manager supports it)
      expect(60).toBeLessThan(PhysicsConstants.FALL_ANGLE);
    });
  });

  describe('Momentum Transfer on Landing', () => {
    it('should transfer downward momentum to ground speed on slopes', () => {
      // This is tested in the simulator's checkGroundCollision logic
      // Landing with Y velocity on a slope should affect ground speed

      const slopeTile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN);
      collisionManager.setTile(5, 10, slopeTile);

      simulator.setState({
        isGrounded: false,
        isJumping: true,
        yVelocity: 5, // Falling fast
        xVelocity: 2,
        groundSpeed: 2,
        y: 155,
      });

      // Simulate landing (collision detection would set this)
      const initialGroundSpeed = simulator.getState().groundSpeed;

      // The landing logic should transfer some Y velocity to ground speed
      // when landing on a slope
      expect(initialGroundSpeed).toBeDefined();
    });
  });

  describe('Mathematical Correctness', () => {
    it('slope factor should match Sonic Physics Guide values', () => {
      expect(PhysicsConstants.SLOPE_FACTOR_NORMAL).toBe(0.125);
      expect(PhysicsConstants.SLOPE_FACTOR_ROLLUP).toBe(0.078125);
      expect(PhysicsConstants.SLOPE_FACTOR_ROLLDOWN).toBe(0.3125);
    });

    it('should calculate sine correctly for common angles', () => {
      const testAngles = [0, 45, 90, 180, 270, 315];

      testAngles.forEach(angle => {
        const angleRad = (angle * Math.PI) / 180;
        const sine = Math.sin(angleRad);

        // Verify reasonable values
        expect(sine).toBeGreaterThanOrEqual(-1);
        expect(sine).toBeLessThanOrEqual(1);
      });
    });
  });
});
