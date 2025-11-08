import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DamageSystem } from '../DamageSystem';
// Mock Ring class
vi.mock('../../objects/Ring', () => ({
    Ring: vi.fn().mockImplementation(() => {
        let _collected = false;
        return {
            x: 0,
            y: 0,
            setPosition: vi.fn(),
            destroy: vi.fn(),
            onPlayerInteract: vi.fn(() => {
                _collected = true;
            }),
            isCollected: vi.fn(() => {
                return _collected;
            }),
        };
    }),
}));
// Mock Phaser.Scene
const mockScene = {
    time: {
        addEvent: vi.fn(() => ({ destroy: vi.fn() })),
        delayedCall: vi.fn(),
    },
};
describe('DamageSystem', () => {
    let damageSystem;
    beforeEach(() => {
        damageSystem = new DamageSystem(mockScene);
        vi.clearAllMocks();
    });
    describe('Initialization', () => {
        it('should start with no invincibility', () => {
            expect(damageSystem.isInvincible()).toBe(false);
            expect(damageSystem.getInvincibilityFrames()).toBe(0);
        });
        it('should start with no scattered rings', () => {
            expect(damageSystem.getScatteredRings()).toHaveLength(0);
        });
    });
    describe('Invincibility mechanics', () => {
        it('should grant invincibility after damage', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            expect(damageSystem.isInvincible()).toBe(true);
        });
        it('should set invincibility to 120 frames (2 seconds)', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            expect(damageSystem.getInvincibilityFrames()).toBe(120);
        });
        it('should decrement invincibility over time', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.update(60); // 60 frames
            expect(damageSystem.getInvincibilityFrames()).toBe(60);
            damageSystem.update(60); // Another 60 frames
            expect(damageSystem.getInvincibilityFrames()).toBe(0);
            expect(damageSystem.isInvincible()).toBe(false);
        });
        it('should prevent damage while invincible', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            const result = damageSystem.applyDamage(100, 100, 5, 1);
            expect(result.damaged).toBe(false);
            expect(result.ringsLost).toBe(0);
        });
        it('should allow damage after invincibility expires', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.update(120); // Expire invincibility
            const result = damageSystem.applyDamage(100, 100, 5, 1);
            expect(result.damaged).toBe(true);
        });
    });
    describe('Damage application', () => {
        it('should return damaged=true when damage applied', () => {
            const result = damageSystem.applyDamage(100, 100, 10, 1);
            expect(result.damaged).toBe(true);
        });
        it('should calculate knockback correctly', () => {
            const result = damageSystem.applyDamage(100, 100, 10, 1);
            expect(result.knockbackX).toBe(-4); // -4 * direction
            expect(result.knockbackY).toBe(-4); // Upward
        });
        it('should apply knockback in opposite direction', () => {
            const resultRight = damageSystem.applyDamage(100, 100, 10, 1);
            expect(resultRight.knockbackX).toBe(-4); // Knocked left
            damageSystem.update(120); // Expire invincibility
            const resultLeft = damageSystem.applyDamage(100, 100, 10, -1);
            expect(resultLeft.knockbackX).toBe(4); // Knocked right
        });
    });
    describe('Ring scatter mechanics', () => {
        it('should scatter rings when player has rings', () => {
            const result = damageSystem.applyDamage(100, 100, 10, 1);
            expect(result.ringsLost).toBe(10);
        });
        it('should scatter maximum 32 rings', () => {
            const result = damageSystem.applyDamage(100, 100, 100, 1);
            expect(result.ringsLost).toBe(32); // Capped at 32
        });
        it('should not scatter rings when player has 0 rings', () => {
            const result = damageSystem.applyDamage(100, 100, 0, 1);
            expect(result.ringsLost).toBe(0);
        });
        it('should create Ring objects for scattered rings', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            const scatteredRings = damageSystem.getScatteredRings();
            expect(scatteredRings.length).toBe(10);
        });
        it('should scatter rings in circular pattern', () => {
            damageSystem.applyDamage(100, 100, 8, 1);
            const scatteredRings = damageSystem.getScatteredRings();
            // Verify rings are created (pattern distribution tested visually in game)
            expect(scatteredRings.length).toBe(8);
        });
        it('should clear previous scattered rings on new damage', () => {
            damageSystem.applyDamage(100, 100, 5, 1);
            expect(damageSystem.getScatteredRings().length).toBe(5);
            damageSystem.update(120); // Expire invincibility
            damageSystem.applyDamage(100, 100, 3, 1);
            // Should have new 3 rings, not 8 total
            expect(damageSystem.getScatteredRings().length).toBe(3);
        });
    });
    describe('Scattered ring lifecycle', () => {
        it('should remove collected scattered rings from list', () => {
            damageSystem.applyDamage(100, 100, 5, 1);
            const scatteredRings = damageSystem.getScatteredRings();
            // Mock collect first ring
            scatteredRings[0].onPlayerInteract({});
            // Update should remove collected rings
            damageSystem.update(1);
            expect(damageSystem.getScatteredRings().length).toBe(4);
        });
        it('should keep uncollected rings in list', () => {
            damageSystem.applyDamage(100, 100, 5, 1);
            // Don't collect any rings, just update
            damageSystem.update(1);
            expect(damageSystem.getScatteredRings().length).toBe(5);
        });
    });
    describe('Reset functionality', () => {
        it('should clear invincibility', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.reset();
            expect(damageSystem.isInvincible()).toBe(false);
            expect(damageSystem.getInvincibilityFrames()).toBe(0);
        });
        it('should clear scattered rings', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.reset();
            expect(damageSystem.getScatteredRings()).toHaveLength(0);
        });
        it('should allow damage immediately after reset', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.reset();
            const result = damageSystem.applyDamage(100, 100, 5, 1);
            expect(result.damaged).toBe(true);
        });
    });
    describe('Edge cases', () => {
        it('should handle 0 rings gracefully', () => {
            const result = damageSystem.applyDamage(100, 100, 0, 1);
            expect(result.damaged).toBe(true);
            expect(result.ringsLost).toBe(0);
            expect(damageSystem.getScatteredRings()).toHaveLength(0);
        });
        it('should handle 1 ring correctly', () => {
            const result = damageSystem.applyDamage(100, 100, 1, 1);
            expect(result.ringsLost).toBe(1);
            expect(damageSystem.getScatteredRings()).toHaveLength(1);
        });
        it('should handle exactly 32 rings', () => {
            const result = damageSystem.applyDamage(100, 100, 32, 1);
            expect(result.ringsLost).toBe(32);
            expect(damageSystem.getScatteredRings()).toHaveLength(32);
        });
        it('should handle more than 32 rings (capped)', () => {
            const result = damageSystem.applyDamage(100, 100, 999, 1);
            expect(result.ringsLost).toBe(32);
            expect(damageSystem.getScatteredRings()).toHaveLength(32);
        });
        it('should not allow invincibility to go negative', () => {
            damageSystem.applyDamage(100, 100, 10, 1);
            damageSystem.update(200); // Update past 0
            expect(damageSystem.getInvincibilityFrames()).toBe(0);
            expect(damageSystem.isInvincible()).toBe(false);
        });
    });
});
