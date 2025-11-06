import { describe, it, expect } from 'vitest';
import { PhysicsConstants } from '../PhysicsConstants';
/**
 * Test suite for Physics Constants
 * Validates that all values match the Sonic Physics Guide specifications
 */
describe('PhysicsConstants', () => {
    describe('Ground Movement', () => {
        it('should have correct acceleration value', () => {
            expect(PhysicsConstants.ACCELERATION).toBe(0.046875);
        });
        it('should have correct deceleration value', () => {
            expect(PhysicsConstants.DECELERATION).toBe(0.5);
        });
        it('should have correct friction value', () => {
            expect(PhysicsConstants.FRICTION).toBe(0.046875);
        });
        it('should have correct top speed', () => {
            expect(PhysicsConstants.TOP_SPEED).toBe(6);
        });
        it('should have correct top speed cap', () => {
            expect(PhysicsConstants.TOP_SPEED_CAP).toBe(16);
        });
    });
    describe('Air Movement', () => {
        it('should have correct gravity value', () => {
            expect(PhysicsConstants.GRAVITY).toBe(0.21875);
        });
        it('should have correct jump force', () => {
            expect(PhysicsConstants.JUMP_FORCE).toBe(6.5);
        });
        it('should have correct jump release velocity', () => {
            expect(PhysicsConstants.JUMP_RELEASE).toBe(-4);
        });
        it('should have correct air acceleration', () => {
            expect(PhysicsConstants.AIR_ACCELERATION).toBe(0.09375);
            expect(PhysicsConstants.AIR_ACCELERATION).toBe(PhysicsConstants.ACCELERATION * 2);
        });
    });
    describe('Rolling', () => {
        it('should have correct roll friction', () => {
            expect(PhysicsConstants.ROLL_FRICTION).toBe(0.0234375);
        });
        it('should have correct roll deceleration', () => {
            expect(PhysicsConstants.ROLL_DECELERATION).toBe(0.125);
        });
        it('should have correct roll minimum speed', () => {
            expect(PhysicsConstants.ROLL_MIN_SPEED).toBe(0.5);
        });
    });
    describe('Slope Physics', () => {
        it('should have correct normal slope factor', () => {
            expect(PhysicsConstants.SLOPE_FACTOR_NORMAL).toBe(0.125);
        });
        it('should have correct roll uphill slope factor', () => {
            expect(PhysicsConstants.SLOPE_FACTOR_ROLLUP).toBe(0.078125);
        });
        it('should have correct roll downhill slope factor', () => {
            expect(PhysicsConstants.SLOPE_FACTOR_ROLLDOWN).toBe(0.3125);
        });
        it('should have correct fall angle threshold', () => {
            expect(PhysicsConstants.FALL_ANGLE).toBe(70);
        });
    });
    describe('Game Loop', () => {
        it('should run at 60 FPS', () => {
            expect(PhysicsConstants.FPS).toBe(60);
        });
        it('should have correct fixed timestep', () => {
            expect(PhysicsConstants.FIXED_TIMESTEP).toBeCloseTo(16.67, 2);
        });
    });
    describe('Physics Relationships', () => {
        it('air acceleration should be exactly half of ground acceleration', () => {
            expect(PhysicsConstants.AIR_ACCELERATION).toBe(PhysicsConstants.ACCELERATION * 2);
        });
        it('roll friction should be half of normal friction', () => {
            expect(PhysicsConstants.ROLL_FRICTION).toBe(PhysicsConstants.FRICTION / 2);
        });
        it('deceleration should be much faster than acceleration', () => {
            expect(PhysicsConstants.DECELERATION).toBeGreaterThan(PhysicsConstants.ACCELERATION * 10);
        });
    });
});
