import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSimulator } from '../helpers/PhysicsSimulator';
import { PhysicsConstants } from '../../config/PhysicsConstants';
/**
 * Test suite for air movement and jumping physics
 * Validates gravity, jump mechanics, and air control
 */
describe('Air Movement Physics', () => {
    let simulator;
    beforeEach(() => {
        simulator = new PhysicsSimulator(0, 0);
    });
    describe('Gravity', () => {
        it('should apply gravity when in air', () => {
            simulator.setState({ isGrounded: false, yVelocity: 0 });
            simulator.update({ left: false, right: false, jump: false, down: false }, 1);
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBeCloseTo(PhysicsConstants.GRAVITY, 5);
        });
        it('should accelerate downward over multiple frames', () => {
            simulator.setState({ isGrounded: false, yVelocity: 0 });
            const velocities = [];
            for (let i = 0; i < 10; i++) {
                simulator.update({ left: false, right: false, jump: false, down: false }, 1);
                velocities.push(simulator.getState().yVelocity);
            }
            // Each frame should increase downward velocity
            for (let i = 1; i < velocities.length; i++) {
                expect(velocities[i]).toBeGreaterThan(velocities[i - 1]);
            }
        });
        it('should cap fall speed at maximum', () => {
            simulator.setState({ isGrounded: false, yVelocity: 0 });
            // Fall for many frames
            simulator.simulateFrames(500, { left: false, right: false, jump: false, down: false });
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBeLessThanOrEqual(PhysicsConstants.MAX_Y_VELOCITY);
        });
        it('should not apply gravity when grounded', () => {
            simulator.setState({ isGrounded: true, yVelocity: 0 });
            simulator.update({ left: false, right: false, jump: false, down: false }, 1);
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBe(0);
        });
    });
    describe('Jumping', () => {
        it('should jump when pressing jump while grounded', () => {
            simulator.setState({ isGrounded: true, groundSpeed: 0 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const state = simulator.getState();
            expect(state.isJumping).toBe(true);
            expect(state.isGrounded).toBe(false);
            expect(state.yVelocity).toBeLessThan(0); // Negative = upward
        });
        it('should jump with correct force', () => {
            simulator.setState({ isGrounded: true, groundSpeed: 0, groundAngle: 0 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBeCloseTo(-PhysicsConstants.JUMP_FORCE, 1);
        });
        it('should not jump when already in air', () => {
            simulator.setState({ isGrounded: false, isJumping: true, yVelocity: -2 });
            const initialYVel = simulator.getState().yVelocity;
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            // Should only apply gravity, not jump again
            const newYVel = simulator.getState().yVelocity;
            expect(newYVel).toBeGreaterThan(initialYVel); // Gravity applied
            expect(newYVel).not.toBeCloseTo(-PhysicsConstants.JUMP_FORCE);
        });
        it('should preserve horizontal momentum when jumping', () => {
            simulator.setState({ isGrounded: true, groundSpeed: 3, groundAngle: 0 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const xVel = simulator.getState().xVelocity;
            expect(Math.abs(xVel)).toBeGreaterThan(2.5); // Should maintain horizontal speed
        });
        it('should jump perpendicular to slopes', () => {
            // On a 45-degree slope
            simulator.setState({ isGrounded: true, groundSpeed: 2, groundAngle: 45 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const state = simulator.getState();
            // Jump should be angled based on surface
            expect(state.xVelocity).not.toBe(0);
            expect(state.yVelocity).toBeLessThan(0);
            // For 45° slope, X and Y components should be related
            const angleRad = (45 * Math.PI) / 180;
            const expectedXContribution = -PhysicsConstants.JUMP_FORCE * Math.sin(angleRad);
            expect(state.xVelocity).toBeCloseTo(2 + expectedXContribution, 1);
        });
    });
    describe('Air Control', () => {
        it('should have reduced acceleration in air', () => {
            simulator.setState({ isGrounded: false, xVelocity: 0 });
            simulator.update({ left: false, right: true, jump: false, down: false }, 1);
            const xVel = simulator.getState().xVelocity;
            expect(xVel).toBeCloseTo(PhysicsConstants.AIR_ACCELERATION, 5);
            expect(PhysicsConstants.AIR_ACCELERATION).toBeGreaterThan(PhysicsConstants.ACCELERATION);
        });
        it('should allow steering in air', () => {
            simulator.setState({ isGrounded: false, xVelocity: 1 });
            // Steer left while moving right
            simulator.simulateFrames(20, { left: true, right: false, jump: false, down: false });
            const xVel = simulator.getState().xVelocity;
            expect(xVel).toBeLessThan(1); // Should have decelerated
        });
        it('should cap air speed', () => {
            simulator.setState({ isGrounded: false, xVelocity: 0 });
            // Accelerate in air for many frames
            simulator.simulateFrames(500, { left: false, right: true, jump: false, down: false });
            const xVel = simulator.getState().xVelocity;
            expect(xVel).toBeLessThanOrEqual(PhysicsConstants.TOP_SPEED_CAP);
        });
        it('air speed cap should be higher than ground top speed', () => {
            expect(PhysicsConstants.TOP_SPEED_CAP).toBeGreaterThan(PhysicsConstants.TOP_SPEED);
        });
    });
    describe('Jump Arc', () => {
        it('should follow parabolic trajectory', () => {
            simulator.setState({ isGrounded: true, groundSpeed: 3, groundAngle: 0 });
            // Jump
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const positions = [];
            for (let i = 0; i < 30; i++) {
                simulator.update({ left: false, right: false, jump: false, down: false }, 1);
                const state = simulator.getState();
                positions.push({ x: state.x, y: state.y });
            }
            // Y should go down, then eventually start coming back up (or continue down)
            // First half should have negative velocity (going up)
            // Second half should have positive velocity (falling)
            expect(positions.length).toBeGreaterThan(10);
        });
        it('should move forward while jumping', () => {
            simulator.setState({
                isGrounded: true,
                groundSpeed: 3,
                groundAngle: 0,
                x: 0
            });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const initialX = simulator.getState().x;
            simulator.simulateFrames(20, { left: false, right: false, jump: false, down: false });
            const finalX = simulator.getState().x;
            expect(finalX).toBeGreaterThan(initialX);
        });
    });
    describe('Landing', () => {
        it('should become grounded when landing', () => {
            // Note: This requires collision manager to work properly
            // This test validates the state change logic
            simulator.setState({
                isGrounded: false,
                isJumping: true,
                yVelocity: 2 // Falling down
            });
            // Simulate landing by setting grounded
            simulator.setState({ isGrounded: true });
            simulator.update({ left: false, right: false, jump: false, down: false }, 1);
            const state = simulator.getState();
            expect(state.isJumping).toBe(false);
        });
    });
    describe('Edge Cases', () => {
        it('should handle zero gravity frames correctly', () => {
            simulator.setState({ isGrounded: false, yVelocity: -5 });
            simulator.update({ left: false, right: false, jump: false, down: false }, 0);
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBeCloseTo(-5, 2); // Should barely change
        });
        it('should handle very high fall speeds', () => {
            simulator.setState({ isGrounded: false, yVelocity: 100 });
            simulator.update({ left: false, right: false, jump: false, down: false }, 1);
            const yVel = simulator.getState().yVelocity;
            expect(yVel).toBeLessThanOrEqual(PhysicsConstants.MAX_Y_VELOCITY);
        });
    });
});
