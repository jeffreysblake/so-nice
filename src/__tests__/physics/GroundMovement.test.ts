import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSimulator } from '../helpers/PhysicsSimulator';
import { PhysicsConstants } from '../../config/PhysicsConstants';

/**
 * Test suite for ground movement physics
 * Validates acceleration, deceleration, friction, and speed limits
 */
describe('Ground Movement Physics', () => {
  let simulator: PhysicsSimulator;

  beforeEach(() => {
    simulator = new PhysicsSimulator(0, 0);
    // Start on ground
    simulator.setState({ isGrounded: true });
  });

  describe('Acceleration', () => {
    it('should accelerate from standstill when pressing right', () => {
      const initialSpeed = simulator.getState().groundSpeed;

      simulator.update({ left: false, right: true, jump: false, down: false }, 1);

      const newSpeed = simulator.getState().groundSpeed;
      expect(newSpeed).toBeGreaterThan(initialSpeed);
      expect(newSpeed).toBeCloseTo(PhysicsConstants.ACCELERATION, 5);
    });

    it('should accelerate left when pressing left', () => {
      simulator.update({ left: true, right: false, jump: false, down: false }, 1);

      const speed = simulator.getState().groundSpeed;
      expect(speed).toBeLessThan(0);
      expect(speed).toBeCloseTo(-PhysicsConstants.ACCELERATION, 5);
    });

    it('should reach top speed after sustained input', () => {
      // Simulate 200 frames of right input
      simulator.simulateFrames(200, { left: false, right: true, jump: false, down: false });

      const speed = simulator.getState().groundSpeed;
      expect(speed).toBeCloseTo(PhysicsConstants.TOP_SPEED, 1);
    });

    it('should not exceed top speed during normal acceleration', () => {
      simulator.simulateFrames(500, { left: false, right: true, jump: false, down: false });

      const speed = simulator.getState().groundSpeed;
      expect(speed).toBeLessThanOrEqual(PhysicsConstants.TOP_SPEED);
    });
  });

  describe('Deceleration', () => {
    it('should decelerate quickly when pressing opposite direction', () => {
      // First accelerate right
      simulator.setState({ groundSpeed: 3 });

      // Then press left
      const initialSpeed = simulator.getState().groundSpeed;
      simulator.update({ left: true, right: false, jump: false, down: false }, 1);

      const newSpeed = simulator.getState().groundSpeed;
      const speedLost = initialSpeed - newSpeed;

      expect(speedLost).toBeCloseTo(PhysicsConstants.DECELERATION, 5);
      expect(speedLost).toBeGreaterThan(PhysicsConstants.ACCELERATION * 10);
    });

    it('should eventually reverse direction when holding opposite input', () => {
      simulator.setState({ groundSpeed: 2 });

      // Hold left until we reverse
      simulator.simulateFrames(100, { left: true, right: false, jump: false, down: false });

      const speed = simulator.getState().groundSpeed;
      expect(speed).toBeLessThan(0);
    });
  });

  describe('Friction', () => {
    it('should apply friction when no input', () => {
      simulator.setState({ groundSpeed: 2 });

      const initialSpeed = simulator.getState().groundSpeed;
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const newSpeed = simulator.getState().groundSpeed;
      expect(newSpeed).toBeLessThan(initialSpeed);
      expect(initialSpeed - newSpeed).toBeCloseTo(PhysicsConstants.FRICTION, 5);
    });

    it('should stop completely after enough frames with no input', () => {
      simulator.setState({ groundSpeed: 1 });

      simulator.simulateFrames(100, { left: false, right: false, jump: false, down: false });

      const speed = simulator.getState().groundSpeed;
      expect(Math.abs(speed)).toBeLessThan(0.01);
    });

    it('should apply friction in both directions', () => {
      // Test positive speed
      simulator.setState({ groundSpeed: 1 });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);
      expect(simulator.getState().groundSpeed).toBeLessThan(1);

      // Test negative speed
      simulator.setState({ groundSpeed: -1 });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);
      expect(simulator.getState().groundSpeed).toBeGreaterThan(-1);
    });
  });

  describe('Speed Relationships', () => {
    it('should decelerate much faster than accelerating', () => {
      // Measure acceleration
      simulator.setState({ groundSpeed: 0 });
      simulator.update({ left: false, right: true, jump: false, down: false }, 1);
      const accelAmount = simulator.getState().groundSpeed;

      // Measure deceleration
      simulator.setState({ groundSpeed: 3 });
      simulator.update({ left: true, right: false, jump: false, down: false }, 1);
      const decelAmount = 3 - simulator.getState().groundSpeed;

      expect(decelAmount).toBeGreaterThan(accelAmount * 10);
    });

    it('should have friction equal to acceleration', () => {
      expect(PhysicsConstants.FRICTION).toBe(PhysicsConstants.ACCELERATION);
    });
  });

  describe('Rolling', () => {
    it('should start rolling when pressing down at sufficient speed', () => {
      simulator.setState({ groundSpeed: 1, isRolling: false });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      expect(simulator.getState().isRolling).toBe(true);
    });

    it('should not roll when speed is too low', () => {
      simulator.setState({ groundSpeed: 0.3, isRolling: false });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      expect(simulator.getState().isRolling).toBe(false);
    });

    it('should stop rolling when speed drops below threshold', () => {
      simulator.setState({ groundSpeed: 0.3, isRolling: true });

      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      expect(simulator.getState().isRolling).toBe(false);
    });
  });

  describe('Multi-Frame Behavior', () => {
    it('should produce smooth acceleration curve', () => {
      const speeds: number[] = [];

      for (let i = 0; i < 50; i++) {
        simulator.update({ left: false, right: true, jump: false, down: false }, 1);
        speeds.push(simulator.getState().groundSpeed);
      }

      // Each frame should increase speed (until cap)
      for (let i = 1; i < speeds.length; i++) {
        if (speeds[i - 1] < PhysicsConstants.TOP_SPEED) {
          expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1]);
        }
      }
    });

    it('should maintain constant speed at top speed', () => {
      // Reach top speed
      simulator.simulateFrames(200, { left: false, right: true, jump: false, down: false });

      const speed1 = simulator.getState().groundSpeed;

      // Continue holding
      simulator.simulateFrames(10, { left: false, right: true, jump: false, down: false });

      const speed2 = simulator.getState().groundSpeed;

      expect(speed2).toBeCloseTo(speed1, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero speed correctly', () => {
      simulator.setState({ groundSpeed: 0 });

      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      expect(simulator.getState().groundSpeed).toBe(0);
    });

    it('should handle very small speeds', () => {
      simulator.setState({ groundSpeed: 0.001 });

      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      // Friction should reduce to zero
      expect(Math.abs(simulator.getState().groundSpeed)).toBeLessThan(0.001);
    });

    it('should handle simultaneous left and right input (should cancel out)', () => {
      simulator.setState({ groundSpeed: 0 });

      simulator.update({ left: true, right: true, jump: false, down: false }, 1);

      // Speed should remain at or near zero
      expect(Math.abs(simulator.getState().groundSpeed)).toBeLessThan(0.1);
    });
  });
});
