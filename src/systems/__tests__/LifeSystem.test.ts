import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LifeSystem } from '../LifeSystem';

// Mock Phaser.Scene
const mockScene = {
  time: {
    delayedCall: vi.fn((_delay: number, callback: () => void) => {
      // Immediately call the callback for testing
      callback();
    }),
  },
} as any;

describe('LifeSystem', () => {
  let lifeSystem: LifeSystem;

  beforeEach(() => {
    lifeSystem = new LifeSystem(mockScene, 100, 600);
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should start with 3 lives', () => {
      expect(lifeSystem.getLives()).toBe(3);
    });

    it('should not be dead initially', () => {
      expect(lifeSystem.isPlayerDead()).toBe(false);
    });

    it('should store initial respawn position', () => {
      const respawnPos = lifeSystem.getRespawnPosition();
      expect(respawnPos.x).toBe(100);
      expect(respawnPos.y).toBe(600);
    });
  });

  describe('Death mechanics', () => {
    it('should decrement lives on death', () => {
      lifeSystem.triggerDeath();
      expect(lifeSystem.getLives()).toBe(2);
    });

    it('should set isDead flag on death', () => {
      // Create a system without auto-executing callbacks to test the flag
      const noCallbackScene = {
        time: {
          delayedCall: vi.fn(), // Don't auto-execute
        },
      } as any;

      const testLifeSystem = new LifeSystem(noCallbackScene, 100, 600);
      testLifeSystem.triggerDeath();
      expect(testLifeSystem.isPlayerDead()).toBe(true);
    });

    it('should call death callback when set', () => {
      const deathCallback = vi.fn();
      lifeSystem.setCallbacks(deathCallback);

      lifeSystem.triggerDeath();

      expect(deathCallback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger death twice simultaneously', () => {
      // Use a non-auto-executing mock to test this properly
      const noCallbackScene = {
        time: {
          delayedCall: vi.fn(),
        },
      } as any;

      const testLifeSystem = new LifeSystem(noCallbackScene, 100, 600);
      const deathCallback = vi.fn();
      testLifeSystem.setCallbacks(deathCallback);

      testLifeSystem.triggerDeath();
      testLifeSystem.triggerDeath(); // Second call should be ignored

      expect(deathCallback).toHaveBeenCalledTimes(1);
      expect(testLifeSystem.getLives()).toBe(2); // Only decremented once
    });
  });

  describe('Respawn mechanics', () => {
    it('should call respawn callback when lives > 0', () => {
      const respawnCallback = vi.fn();
      lifeSystem.setCallbacks(undefined, respawnCallback);

      lifeSystem.triggerDeath();

      expect(respawnCallback).toHaveBeenCalledTimes(1);
    });

    it('should clear isDead flag after respawn', () => {
      const respawnCallback = vi.fn(() => {
        // After respawn callback, isDead should still be true briefly
        expect(lifeSystem.isPlayerDead()).toBe(false);
      });
      lifeSystem.setCallbacks(undefined, respawnCallback);

      lifeSystem.triggerDeath();
    });

    it('should update respawn position', () => {
      lifeSystem.setRespawnPosition(200, 300);

      const respawnPos = lifeSystem.getRespawnPosition();
      expect(respawnPos.x).toBe(200);
      expect(respawnPos.y).toBe(300);
    });

    it('should respawn at updated checkpoint', () => {
      lifeSystem.setRespawnPosition(500, 700);

      const respawnPos = lifeSystem.getRespawnPosition();
      expect(respawnPos.x).toBe(500);
      expect(respawnPos.y).toBe(700);
    });
  });

  describe('Game over mechanics', () => {
    it('should trigger game over when lives reach 0', () => {
      const gameOverCallback = vi.fn();
      lifeSystem.setCallbacks(undefined, undefined, gameOverCallback);

      // Die 3 times to reach 0 lives
      lifeSystem.triggerDeath(); // 2 lives left
      lifeSystem.triggerDeath(); // 1 life left
      lifeSystem.triggerDeath(); // 0 lives left = game over

      expect(gameOverCallback).toHaveBeenCalledTimes(1);
      expect(lifeSystem.getLives()).toBe(0);
    });

    it('should not call respawn callback on game over', () => {
      const respawnCallback = vi.fn();
      const gameOverCallback = vi.fn();
      lifeSystem.setCallbacks(undefined, respawnCallback, gameOverCallback);

      // Die 3 times
      lifeSystem.triggerDeath();
      lifeSystem.triggerDeath();
      lifeSystem.triggerDeath();

      // Respawn should be called twice (lives 2 and 1)
      // Game over should be called once (lives 0)
      expect(respawnCallback).toHaveBeenCalledTimes(2);
      expect(gameOverCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Life management', () => {
    it('should add a life', () => {
      lifeSystem.addLife();
      expect(lifeSystem.getLives()).toBe(4);
    });

    it('should allow multiple extra lives', () => {
      lifeSystem.addLife();
      lifeSystem.addLife();
      lifeSystem.addLife();
      expect(lifeSystem.getLives()).toBe(6);
    });

    it('should reset lives to default (3)', () => {
      lifeSystem.triggerDeath(); // 2 lives
      lifeSystem.reset();
      expect(lifeSystem.getLives()).toBe(3);
    });

    it('should reset lives to custom value', () => {
      lifeSystem.reset(5);
      expect(lifeSystem.getLives()).toBe(5);
    });

    it('should clear isDead flag on reset', () => {
      // Create a system with a mock that doesn't auto-execute callbacks
      const delayedMockScene = {
        time: {
          delayedCall: vi.fn(), // Don't execute - just mock
        },
      } as any;

      const delayedLifeSystem = new LifeSystem(delayedMockScene, 100, 600);
      delayedLifeSystem.triggerDeath();
      expect(delayedLifeSystem.isPlayerDead()).toBe(true);

      delayedLifeSystem.reset();
      expect(delayedLifeSystem.isPlayerDead()).toBe(false);
    });
  });

  describe('Callback system', () => {
    it('should handle missing callbacks gracefully', () => {
      // No callbacks set
      expect(() => lifeSystem.triggerDeath()).not.toThrow();
    });

    it('should call all callbacks in correct order', () => {
      const callOrder: string[] = [];

      const deathCallback = vi.fn(() => callOrder.push('death'));
      const respawnCallback = vi.fn(() => callOrder.push('respawn'));

      lifeSystem.setCallbacks(deathCallback, respawnCallback);
      lifeSystem.triggerDeath();

      expect(callOrder).toEqual(['death', 'respawn']);
    });

    it('should allow updating callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      lifeSystem.setCallbacks(callback1);
      lifeSystem.triggerDeath();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(0);

      lifeSystem.setCallbacks(callback2);
      lifeSystem.triggerDeath();

      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
