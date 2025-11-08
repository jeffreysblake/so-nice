import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreSystem } from '../ScoreSystem';

describe('ScoreSystem', () => {
  let scoreSystem: ScoreSystem;

  beforeEach(() => {
    scoreSystem = new ScoreSystem();
  });

  describe('Timer functionality', () => {
    it('should start with time at 0', () => {
      expect(scoreSystem.getRawTime()).toBe(0);
      expect(scoreSystem.getTimeInSeconds()).toBe(0);
    });

    it('should not increment time when not started', () => {
      scoreSystem.update(1);
      expect(scoreSystem.getRawTime()).toBe(0);
    });

    it('should increment time when running', () => {
      scoreSystem.start();
      scoreSystem.update(60); // 60 frames = 1 second
      expect(scoreSystem.getTimeInSeconds()).toBe(1);
    });

    it('should stop incrementing when stopped', () => {
      scoreSystem.start();
      scoreSystem.update(60);
      scoreSystem.stop();
      scoreSystem.update(60);
      expect(scoreSystem.getTimeInSeconds()).toBe(1); // Still 1 second
    });

    it('should resume from stopped time when restarted', () => {
      scoreSystem.start();
      scoreSystem.update(60);
      scoreSystem.stop();
      scoreSystem.start();
      scoreSystem.update(60);
      expect(scoreSystem.getTimeInSeconds()).toBe(2); // 2 seconds total
    });

    it('should format time correctly as M:SS', () => {
      scoreSystem.start();
      scoreSystem.update(0); // 0 seconds
      expect(scoreSystem.getFormattedTime()).toBe('0:00');

      scoreSystem.update(1800); // 30 seconds
      expect(scoreSystem.getFormattedTime()).toBe('0:30');

      scoreSystem.update(1800); // 60 seconds = 1 minute
      expect(scoreSystem.getFormattedTime()).toBe('1:00');

      scoreSystem.update(3900); // 125 seconds = 2:05
      expect(scoreSystem.getFormattedTime()).toBe('2:05');
    });

    it('should reset time to 0', () => {
      scoreSystem.start();
      scoreSystem.update(120);
      scoreSystem.resetTime();
      expect(scoreSystem.getRawTime()).toBe(0);
      expect(scoreSystem.getTimeInSeconds()).toBe(0);
    });
  });

  describe('Score tracking', () => {
    it('should start with score at 0', () => {
      expect(scoreSystem.getScore()).toBe(0);
    });

    it('should add 10 points for ring collection', () => {
      scoreSystem.addRingPoints();
      expect(scoreSystem.getScore()).toBe(10);

      scoreSystem.addRingPoints();
      expect(scoreSystem.getScore()).toBe(20);
    });

    it('should add 100 points for enemy defeat', () => {
      scoreSystem.addEnemyPoints();
      expect(scoreSystem.getScore()).toBe(100);

      scoreSystem.addEnemyPoints();
      expect(scoreSystem.getScore()).toBe(200);
    });

    it('should add 500 points for checkpoint', () => {
      scoreSystem.addCheckpointPoints();
      expect(scoreSystem.getScore()).toBe(500);
    });

    it('should add custom points', () => {
      scoreSystem.addPoints(1234);
      expect(scoreSystem.getScore()).toBe(1234);
    });

    it('should accumulate points from multiple sources', () => {
      scoreSystem.addRingPoints(); // +10
      scoreSystem.addEnemyPoints(); // +100
      scoreSystem.addCheckpointPoints(); // +500
      expect(scoreSystem.getScore()).toBe(610);
    });

    it('should maintain score when timer stops/starts', () => {
      scoreSystem.addRingPoints(); // +10
      scoreSystem.start();
      scoreSystem.update(60);
      scoreSystem.stop();
      scoreSystem.addEnemyPoints(); // +100
      expect(scoreSystem.getScore()).toBe(110);
    });
  });

  describe('Time bonus calculation', () => {
    it('should give 50000 bonus for time < 30 seconds', () => {
      scoreSystem.start();
      scoreSystem.update(1500); // 25 seconds
      expect(scoreSystem.calculateTimeBonus()).toBe(50000);
    });

    it('should give 10000 bonus for time < 45 seconds', () => {
      scoreSystem.start();
      scoreSystem.update(2400); // 40 seconds
      expect(scoreSystem.calculateTimeBonus()).toBe(10000);
    });

    it('should give 5000 bonus for time < 60 seconds', () => {
      scoreSystem.start();
      scoreSystem.update(3300); // 55 seconds
      expect(scoreSystem.calculateTimeBonus()).toBe(5000);
    });

    it('should give 4000 bonus for time < 90 seconds', () => {
      scoreSystem.start();
      scoreSystem.update(5100); // 85 seconds
      expect(scoreSystem.calculateTimeBonus()).toBe(4000);
    });

    it('should give 0 bonus for time >= 300 seconds', () => {
      scoreSystem.start();
      scoreSystem.update(18000); // 300 seconds
      expect(scoreSystem.calculateTimeBonus()).toBe(0);
    });
  });

  describe('Ring bonus calculation', () => {
    it('should give 0 bonus for 0 rings', () => {
      expect(scoreSystem.calculateRingBonus(0)).toBe(0);
    });

    it('should give 100 points per ring', () => {
      expect(scoreSystem.calculateRingBonus(1)).toBe(100);
      expect(scoreSystem.calculateRingBonus(10)).toBe(1000);
      expect(scoreSystem.calculateRingBonus(50)).toBe(5000);
    });
  });

  describe('Reset functionality', () => {
    it('should reset score and time', () => {
      scoreSystem.start();
      scoreSystem.addRingPoints();
      scoreSystem.addEnemyPoints();
      scoreSystem.update(120);

      scoreSystem.reset();

      expect(scoreSystem.getScore()).toBe(0);
      expect(scoreSystem.getRawTime()).toBe(0);
      expect(scoreSystem.getTimeInSeconds()).toBe(0);
    });

    it('should stop timer after reset', () => {
      scoreSystem.start();
      scoreSystem.update(60);
      scoreSystem.reset();
      scoreSystem.update(60); // Should not increment
      expect(scoreSystem.getTimeInSeconds()).toBe(0);
    });
  });
});
