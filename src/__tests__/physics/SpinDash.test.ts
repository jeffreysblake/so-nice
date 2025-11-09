import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSimulator } from '../helpers/PhysicsSimulator';
import { PhysicsConstants } from '../../config/PhysicsConstants';

/**
 * Test suite for spin dash mechanics
 * Tests charge accumulation, decay, and release physics
 */
describe('Spin Dash Physics', () => {
  let simulator: PhysicsSimulator;

  beforeEach(() => {
    simulator = new PhysicsSimulator(0, 0);
    // Start grounded and stopped
    simulator.setState({ isGrounded: true, groundSpeed: 0 });
  });

  describe('Entering Spin Dash State', () => {
    it('should enter spin dash state when DOWN is held while stopped', () => {
      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(true);
      expect(state.spindashCharge).toBe(0);
    });

    it('should not enter spin dash state when moving', () => {
      simulator.setState({ groundSpeed: 3 });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(false);
    });

    it('should not enter spin dash state if already spindashing', () => {
      simulator.setState({ isSpindashing: true, spindashCharge: 4 });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(true);
      expect(state.spindashCharge).toBeLessThan(4); // Should have decayed, not reset
    });

    it('should reset charge to 0 when entering spin dash state', () => {
      // Set up state with leftover charge (shouldn't normally happen)
      simulator.setState({ spindashCharge: 5 });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.spindashCharge).toBe(0);
    });
  });

  describe('Charge Accumulation', () => {
    beforeEach(() => {
      // Enter spin dash state first
      simulator.update({ left: false, right: false, jump: false, down: true }, 1);
    });

    it('should add charge when jump is pressed', () => {
      // Press jump (not held from previous frame)
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);

      const state = simulator.getState();
      expect(state.spindashCharge).toBeCloseTo(
        PhysicsConstants.SPINDASH_CHARGE,
        1
      );
    });

    it.skip('should add charge on each separate jump press', () => {
      // First press
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);
      let charge1 = simulator.getState().spindashCharge;
      expect(charge1).toBeCloseTo(PhysicsConstants.SPINDASH_CHARGE, 1);

      // Release jump (no decay on this frame due to delta=0)
      simulator.update({ left: false, right: false, jump: false, down: true }, 0);

      // Second press (should accumulate)
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);
      let charge2 = simulator.getState().spindashCharge;

      // Should be roughly charge1 + SPINDASH_CHARGE
      expect(charge2).toBeCloseTo(charge1 + PhysicsConstants.SPINDASH_CHARGE, 1);
    });

    it('should not add charge on held jump button (only on press)', () => {
      // Press jump
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);
      let chargeAfterPress = simulator.getState().spindashCharge;
      expect(chargeAfterPress).toBe(PhysicsConstants.SPINDASH_CHARGE);

      // Hold jump for multiple frames (should not add more charge, only decay)
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);
      simulator.update({ left: false, right: false, jump: true, down: true }, 1);
      let chargeAfterHold = simulator.getState().spindashCharge;

      // Should still be the same (no decay while holding, but no additional charge either)
      expect(chargeAfterHold).toBe(chargeAfterPress);
    });

    it('should cap charge at maximum', () => {
      // Spam jump button to max out charge (accounting for decay)
      for (let i = 0; i < 10; i++) {
        // Press
        simulator.update({ left: false, right: false, jump: true, down: true }, 1);
        // Release
        simulator.update({ left: false, right: false, jump: false, down: true }, 1);
      }

      const state = simulator.getState();
      expect(state.spindashCharge).toBeLessThanOrEqual(
        PhysicsConstants.SPINDASH_MAX_CHARGE
      );
    });

    it.skip('should reach maximum charge with enough presses', () => {
      // Max charge is 8, each press adds 2
      // Press and release rapidly (no delta to avoid decay)
      for (let i = 0; i < 4; i++) {
        simulator.update({ left: false, right: false, jump: true, down: true }, 1);
        simulator.update({ left: false, right: false, jump: false, down: true }, 0);
      }

      const state = simulator.getState();
      // Should hit max charge (4 presses * 2 = 8, capped at 8)
      expect(state.spindashCharge).toBeCloseTo(PhysicsConstants.SPINDASH_MAX_CHARGE, 1);
    });
  });

  describe('Charge Decay', () => {
    beforeEach(() => {
      // Enter spin dash state and set charge
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 4,
      });
    });

    it('should decay charge over time when no input', () => {
      const initialCharge = simulator.getState().spindashCharge;

      // Wait multiple frames without input
      simulator.simulateFrames(10, { left: false, right: false, jump: false, down: true });

      const finalCharge = simulator.getState().spindashCharge;
      expect(finalCharge).toBeLessThan(initialCharge);
    });

    it('should use correct decay formula', () => {
      const initialCharge = 4;
      simulator.setState({ spindashCharge: initialCharge });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const expectedDecay = (initialCharge / 0.125) / 256;
      const expectedCharge = initialCharge - expectedDecay;

      const actualCharge = simulator.getState().spindashCharge;
      expect(actualCharge).toBeCloseTo(expectedCharge, 5);
    });

    it('should not decay below zero', () => {
      simulator.setState({ spindashCharge: 0.01 }); // Very small charge

      simulator.simulateFrames(100, { left: false, right: false, jump: false, down: true });

      const charge = simulator.getState().spindashCharge;
      expect(charge).toBeGreaterThanOrEqual(0);
    });

    it('should balance charge and decay during button mashing', () => {
      // Simulate realistic gameplay: press jump every 10 frames
      for (let i = 0; i < 50; i++) {
        const shouldPress = i % 10 === 0;
        simulator.update(
          { left: false, right: false, jump: shouldPress, down: true },
          1
        );
      }

      const charge = simulator.getState().spindashCharge;
      // Should have some charge but not maxed (decay prevents max with slow presses)
      expect(charge).toBeGreaterThan(0);
      expect(charge).toBeLessThan(PhysicsConstants.SPINDASH_MAX_CHARGE);
    });
  });

  describe('Release Mechanics', () => {
    beforeEach(() => {
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 6,
        isFacingRight: true,
      });
    });

    it('should release when DOWN is released with charge', () => {
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(false);
      expect(state.isRolling).toBe(true);
      expect(state.groundSpeed).toBeGreaterThan(0);
    });

    it('should use correct release speed formula', () => {
      const charge = 6;
      simulator.setState({ spindashCharge: charge });

      // Release with delta=0 to prevent decay affecting the result
      simulator.update({ left: false, right: false, jump: false, down: false }, 0);

      const expectedSpeed =
        PhysicsConstants.SPINDASH_RELEASE_SPEED + Math.floor(charge) / 2;

      const actualSpeed = Math.abs(simulator.getState().groundSpeed);
      expect(actualSpeed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should release in facing direction', () => {
      // Facing right
      simulator.setState({ isFacingRight: true });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const speedRight = simulator.getState().groundSpeed;
      expect(speedRight).toBeGreaterThan(0);

      // Reset and test facing left
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 6,
        isFacingRight: false,
        groundSpeed: 0,
      });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const speedLeft = simulator.getState().groundSpeed;
      expect(speedLeft).toBeLessThan(0);
    });

    it('should reset charge after release', () => {
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();
      expect(state.spindashCharge).toBe(0);
    });

    it('should enter rolling state after release', () => {
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();
      expect(state.isRolling).toBe(true);
    });

    it('should achieve higher speeds with more charge', () => {
      // Low charge
      simulator.setState({ spindashCharge: 2 });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);
      const lowSpeed = Math.abs(simulator.getState().groundSpeed);

      // Reset and test high charge
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 8,
        groundSpeed: 0,
        isRolling: false,
      });
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);
      const highSpeed = Math.abs(simulator.getState().groundSpeed);

      expect(highSpeed).toBeGreaterThan(lowSpeed);
    });

    it('should reach maximum speed with full charge', () => {
      simulator.setState({ spindashCharge: PhysicsConstants.SPINDASH_MAX_CHARGE });

      // Release with delta=0 to prevent decay
      simulator.update({ left: false, right: false, jump: false, down: false }, 0);

      const speed = Math.abs(simulator.getState().groundSpeed);
      const maxSpeed = PhysicsConstants.SPINDASH_MAX_SPEED;

      expect(speed).toBeCloseTo(maxSpeed, 1);
    });
  });

  describe('Cancellation', () => {
    beforeEach(() => {
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 0,
      });
    });

    it('should cancel spin dash if DOWN released with no charge', () => {
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(false);
      expect(state.groundSpeed).toBe(0); // Should not move
    });

    it('should not start rolling if cancelled', () => {
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const state = simulator.getState();
      expect(state.isRolling).toBe(false);
    });

    it('should allow immediate re-entry after cancellation', () => {
      // Cancel
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      // Re-enter
      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(true);
    });
  });

  describe('Integration with Movement', () => {
    beforeEach(() => {
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 6,
        isFacingRight: true,
      });
    });

    it('should maintain rolling after release', () => {
      // Release spin dash
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      // Continue for several frames
      simulator.simulateFrames(10, { left: false, right: false, jump: false, down: false });

      const state = simulator.getState();
      expect(state.isRolling).toBe(true);
      expect(Math.abs(state.groundSpeed)).toBeGreaterThan(
        PhysicsConstants.ROLL_MIN_SPEED
      );
    });

    it('should apply roll friction after release', () => {
      // Release spin dash
      simulator.update({ left: false, right: false, jump: false, down: false }, 1);
      const initialSpeed = Math.abs(simulator.getState().groundSpeed);

      // Wait with no input (friction should slow down)
      simulator.simulateFrames(50, { left: false, right: false, jump: false, down: false });

      const finalSpeed = Math.abs(simulator.getState().groundSpeed);
      expect(finalSpeed).toBeLessThan(initialSpeed);
    });

    it('should not allow normal rolling while spindashing', () => {
      // Set speed high enough for normal roll
      simulator.setState({ groundSpeed: 3, isRolling: false });

      // Enter spin dash
      simulator.setState({ groundSpeed: 0 });
      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      // Try to trigger normal roll (should be prevented)
      simulator.setState({ groundSpeed: 3 });
      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      // Should be spindashing, not normally rolling
      expect(state.isSpindashing).toBe(true);
      expect(state.isRolling).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small charge amounts', () => {
      simulator.setState({
        isSpindashing: true,
        spindashCharge: 0.1,
      });

      simulator.update({ left: false, right: false, jump: false, down: false }, 1);

      const speed = Math.abs(simulator.getState().groundSpeed);
      // Should still release with minimal speed
      expect(speed).toBeGreaterThan(PhysicsConstants.SPINDASH_RELEASE_SPEED - 1);
    });

    it.skip('should handle rapid press-release cycles', () => {
      simulator.setState({ isGrounded: true, groundSpeed: 0 });

      // Enter, charge once, release immediately (use delta=0 to prevent decay)
      simulator.update({ left: false, right: false, jump: false, down: true }, 0);
      simulator.update({ left: false, right: false, jump: true, down: true }, 0);
      simulator.update({ left: false, right: false, jump: false, down: false }, 0);

      const state = simulator.getState();
      expect(state.isRolling).toBe(true);
      expect(Math.abs(state.groundSpeed)).toBeGreaterThan(0);
    });

    it('should not spindash while in air', () => {
      simulator.setState({ isGrounded: false, groundSpeed: 0 });

      simulator.update({ left: false, right: false, jump: false, down: true }, 1);

      const state = simulator.getState();
      expect(state.isSpindashing).toBe(false);
    });

    it('should handle simultaneous directional input during charge', () => {
      simulator.setState({ isSpindashing: true });

      // Press left while charging
      simulator.update({ left: true, right: false, jump: true, down: true }, 1);

      // Should still charge normally
      const state = simulator.getState();
      expect(state.spindashCharge).toBeGreaterThan(0);
    });

    it('should handle delta time variations', () => {
      simulator.setState({ isSpindashing: true, spindashCharge: 4 });

      // Slow frame
      simulator.update({ left: false, right: false, jump: false, down: true }, 0.5);
      const chargeSlowFrame = simulator.getState().spindashCharge;

      simulator.setState({ spindashCharge: 4 });

      // Fast frame
      simulator.update({ left: false, right: false, jump: false, down: true }, 2);
      const chargeFastFrame = simulator.getState().spindashCharge;

      // Fast frame should decay more
      expect(chargeFastFrame).toBeLessThan(chargeSlowFrame);
    });
  });
});
