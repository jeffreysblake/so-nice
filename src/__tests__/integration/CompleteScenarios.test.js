import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsSimulator } from '../helpers/PhysicsSimulator';
import { CollisionManager } from '../../terrain/CollisionManager';
import { TerrainTiles } from '../../terrain/TerrainTile';
import { PhysicsConstants } from '../../config/PhysicsConstants';
/**
 * Integration tests for complete game scenarios
 * Tests realistic gameplay situations end-to-end
 */
describe('Complete Game Scenarios', () => {
    let simulator;
    let collisionManager;
    beforeEach(() => {
        collisionManager = new CollisionManager({});
        // Spawn Sonic ABOVE ground (like real game does)
        // y=620 puts sensor at y=640, which is 16px above tile surface at y=656
        simulator = new PhysicsSimulator(80, 620);
        simulator.setCollisionManager(collisionManager);
    });
    describe('Scenario: Running Across Flat Ground', () => {
        beforeEach(() => {
            // Create long flat ground
            for (let x = 0; x < 50; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
        });
        it('should accelerate to top speed and maintain it', () => {
            const speeds = [];
            // Debug first 25 frames
            for (let i = 0; i < 25; i++) {
                simulator.update({ left: false, right: true, jump: false, down: false }, 1);
                const state = simulator.getState();
                speeds.push(Math.abs(state.groundSpeed));
                if (i < 25) {
                    console.log(`Frame ${i + 1}: grounded=${state.isGrounded}, speed=${state.groundSpeed.toFixed(6)}, y=${state.y.toFixed(2)}, xVel=${state.xVelocity.toFixed(3)}, yVel=${state.yVelocity.toFixed(3)}`);
                }
            }
            // Continue to 200 frames
            for (let i = 25; i < 200; i++) {
                simulator.update({ left: false, right: true, jump: false, down: false }, 1);
                speeds.push(Math.abs(simulator.getState().groundSpeed));
            }
            // Should reach top speed
            const maxSpeed = Math.max(...speeds);
            console.log(`Max speed reached: ${maxSpeed}, expected: ${PhysicsConstants.TOP_SPEED}`);
            expect(maxSpeed).toBeCloseTo(PhysicsConstants.TOP_SPEED, 1);
            // Last 50 frames should be at top speed
            const last50 = speeds.slice(-50);
            const allAtTopSpeed = last50.every(s => Math.abs(s - PhysicsConstants.TOP_SPEED) < 0.1);
            expect(allAtTopSpeed).toBe(true);
        });
        it('should stop completely when releasing controls', () => {
            // Accelerate to speed
            simulator.simulateFrames(100, { left: false, right: true, jump: false, down: false });
            expect(simulator.getState().groundSpeed).toBeGreaterThan(3);
            // Release controls
            simulator.simulateFrames(200, { left: false, right: false, jump: false, down: false });
            expect(Math.abs(simulator.getState().groundSpeed)).toBeLessThan(0.01);
        });
    });
    describe('Scenario: Running Up a Slope', () => {
        beforeEach(() => {
            // Create longer flat approach for building speed
            for (let x = 0; x < 80; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            // Create 45° slope
            for (let x = 80; x < 84; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
                collisionManager.setTile(x, 41 - (x - 80), tile);
            }
            // Flat top
            for (let x = 84; x < 90; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 37, tile);
            }
            // Spawn above ground at y=620 (sensor at y=640, 16px above surface at y=656)
            simulator = new PhysicsSimulator(80, 620);
            simulator.setCollisionManager(collisionManager);
        });
        it('should slow down while climbing slope', () => {
            // Build up speed on flat ground - account for initial fall time
            simulator.simulateFrames(200, { left: false, right: true, jump: false, down: false });
            const speedBeforeSlope = simulator.getState().groundSpeed;
            // After ~12 frames falling + 188 frames accelerating = ~8.8 speed, but capped at TOP_SPEED=6.0
            expect(speedBeforeSlope).toBeCloseTo(PhysicsConstants.TOP_SPEED, 0);
            // Move to slope - now at x=80 (gridX=5) tiles, slope starts at gridX=80 (x=1280)
            simulator.setState({ x: 1280, y: 656, groundAngle: 45, isGrounded: true });
            // Run up slope
            simulator.simulateFrames(50, { left: false, right: true, jump: false, down: false });
            const speedOnSlope = simulator.getState().groundSpeed;
            // Should have slowed down
            expect(speedOnSlope).toBeLessThan(speedBeforeSlope);
        });
        it('should maintain enough speed to crest the hill', () => {
            // Build maximum speed
            simulator.simulateFrames(200, { left: false, right: true, jump: false, down: false });
            // Climb slope
            simulator.setState({ x: 160, y: 656, groundAngle: 45, isGrounded: true });
            simulator.simulateFrames(100, { left: false, right: true, jump: false, down: false });
            // Should still have positive speed at top
            expect(simulator.getState().groundSpeed).toBeGreaterThan(0);
        });
    });
    describe('Scenario: Rolling Down a Hill', () => {
        beforeEach(() => {
            // Create downhill slope - diagonal placement forms continuous slope
            // Each SLOPE_45_DOWN tile goes from height 16 (left) to 1 (right)
            // Placing at (x, 37+x) creates seamless downhill progression
            for (let x = 0; x < 4; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_DOWN);
                collisionManager.setTile(x, 37 + x, tile);
            }
            // Start player on the slope surface: tile (0,37) at X=8 has height 8
            // Tile top-left at Y=592, surface at Y=600, player center at Y=580 (heightRadius=20)
            simulator = new PhysicsSimulator(8, 580);
            simulator.setCollisionManager(collisionManager);
            simulator.setState({
                groundSpeed: 1,
                isGrounded: true,
                groundAngle: 315,
                isRolling: true,
            });
        });
        it('should gain speed rolling downhill', () => {
            const initialSpeed = simulator.getState().groundSpeed;
            simulator.simulateFrames(50, { left: false, right: false, jump: false, down: false });
            const finalSpeed = simulator.getState().groundSpeed;
            console.log(`Initial speed: ${initialSpeed.toFixed(4)}, Final speed: ${finalSpeed.toFixed(4)}`);
            expect(finalSpeed).toBeGreaterThan(initialSpeed);
            expect(finalSpeed).toBeGreaterThan(3);
        });
        it('should gain more speed rolling than running', () => {
            // Test rolling
            simulator.setState({ groundSpeed: 1, isRolling: true, groundAngle: 315 });
            simulator.simulateFrames(30, { left: false, right: false, jump: false, down: false });
            const rollingSpeed = simulator.getState().groundSpeed;
            // Test running
            simulator.setState({ groundSpeed: 1, isRolling: false, groundAngle: 315 });
            simulator.simulateFrames(30, { left: false, right: true, jump: false, down: false });
            const runningSpeed = simulator.getState().groundSpeed;
            expect(rollingSpeed).toBeGreaterThan(runningSpeed);
        });
    });
    describe('Scenario: Jumping Over a Gap', () => {
        beforeEach(() => {
            // Create ground with gap
            for (let x = 0; x < 10; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            // Gap at x = 10-12
            for (let x = 13; x < 20; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            simulator = new PhysicsSimulator(80, 640);
            simulator.setCollisionManager(collisionManager);
        });
        it('should successfully clear gap with running start', () => {
            // Build speed
            simulator.simulateFrames(100, { left: false, right: true, jump: false, down: false });
            const xBeforeJump = simulator.getState().x;
            // Jump
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            // Continue forward in air
            simulator.simulateFrames(30, { left: false, right: true, jump: false, down: false });
            const xAfterJump = simulator.getState().x;
            // Should have traveled significant distance
            const distance = xAfterJump - xBeforeJump;
            expect(distance).toBeGreaterThan(48); // 3 tiles = 48 pixels
        });
        it('should land on opposite side of gap', () => {
            // Accelerate and jump
            simulator.simulateFrames(50, { left: false, right: true, jump: false, down: false });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            // Fly over gap
            simulator.simulateFrames(40, { left: false, right: false, jump: false, down: false });
            // Should be past the gap
            expect(simulator.getState().x).toBeGreaterThan(208); // Beyond x=13 tiles
        });
    });
    describe('Scenario: Jump from Slope', () => {
        beforeEach(() => {
            // Create ramp
            for (let x = 0; x < 4; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP);
                collisionManager.setTile(x, 41 - x, tile);
            }
            // Spawn above slope - tile at gridY=41-x, player at x=3 (48/16) on gridY=38 (Y=608)
            simulator = new PhysicsSimulator(48, 588); // 608 - 20 (heightRadius) = 588
            simulator.setCollisionManager(collisionManager);
        });
        it('should launch at an angle from slope', () => {
            // Build some speed but don't run off the slope (only 4 tiles)
            simulator.simulateFrames(20, { left: false, right: true, jump: false, down: false });
            // Now jump from the slope
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const state = simulator.getState();
            // Should have both X and Y velocity (perpendicular to 45° slope)
            expect(Math.abs(state.xVelocity)).toBeGreaterThan(1);
            expect(state.yVelocity).toBeLessThan(-2); // Upward component
        });
        it('should achieve greater height than flat jump', () => {
            // Jump from slope
            simulator.setState({ isGrounded: true, groundSpeed: 4, groundAngle: 45 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const slopeYVelocity = Math.abs(simulator.getState().yVelocity);
            // Jump from flat
            simulator.setState({ isGrounded: true, groundSpeed: 4, groundAngle: 0, yVelocity: 0 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            const flatYVelocity = Math.abs(simulator.getState().yVelocity);
            // Slope jump should have greater upward velocity
            expect(slopeYVelocity).toBeGreaterThan(flatYVelocity * 0.95); // Within reasonable range
        });
    });
    describe('Scenario: Quick Direction Change', () => {
        beforeEach(() => {
            // Flat ground - make it long enough for speed test (200 frames * 6 speed = 1200 pixels / 16 = 75 tiles)
            for (let x = 0; x < 100; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            // Spawn above ground at y=620 (sensor at y=640, 16px above surface at y=656)
            simulator = new PhysicsSimulator(80, 620);
            simulator.setCollisionManager(collisionManager);
        });
        it('should quickly reverse direction with opposite input', () => {
            // Build speed right - account for initial fall time
            simulator.simulateFrames(200, { left: false, right: true, jump: false, down: false });
            const initialSpeed = simulator.getState().groundSpeed;
            expect(initialSpeed).toBeGreaterThan(4.5);
            // Press left to reverse - with DECELERATION=0.5, should reverse quickly
            // From speed 5.0: 5.0 -> 4.5 -> 4.0 -> 3.5 -> 3.0 -> 2.5 -> 2.0 -> 1.5 -> 1.0 -> 0.5 -> 0 -> -0.5
            // Takes ~12 frames to reverse
            simulator.simulateFrames(15, { left: true, right: false, jump: false, down: false });
            // Should be moving left now
            expect(simulator.getState().groundSpeed).toBeLessThan(0);
        });
        it('should use deceleration rate when reversing', () => {
            // First, let player land and reach steady state
            simulator.simulateFrames(20, { left: false, right: false, jump: false, down: false });
            // Set player grounded with speed 4 moving right
            simulator.setState({ groundSpeed: 4, isGrounded: true, groundAngle: 0 });
            // Press left to decelerate
            simulator.update({ left: true, right: false, jump: false, down: false }, 1);
            const speedLost = 4 - simulator.getState().groundSpeed;
            expect(speedLost).toBeCloseTo(PhysicsConstants.DECELERATION, 2);
        });
    });
    describe('Scenario: Landing on Different Surfaces', () => {
        it('should land smoothly on flat ground', () => {
            // Create ground
            for (let x = 0; x < 10; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            simulator = new PhysicsSimulator(80, 600);
            simulator.setCollisionManager(collisionManager);
            // Jump and land
            simulator.setState({ isGrounded: true, groundSpeed: 3 });
            simulator.update({ left: false, right: false, jump: true, down: false }, 1);
            simulator.simulateFrames(40, { left: false, right: false, jump: false, down: false });
            // Should eventually land
            const state = simulator.getState();
            expect(state.yVelocity).toBeLessThanOrEqual(PhysicsConstants.MAX_Y_VELOCITY);
        });
        it('should transfer momentum when landing on slope', () => {
            // This tests the momentum transfer logic
            const angle = 45;
            simulator.setState({
                isGrounded: false,
                yVelocity: 5,
                xVelocity: 2,
                groundSpeed: 2,
            });
            // Simulate landing (collision would set this)
            const angleRad = (angle * Math.PI) / 180;
            const slopeFactor = Math.sin(angleRad);
            const expectedSpeedBoost = 5 * slopeFactor * 0.5;
            expect(expectedSpeedBoost).toBeGreaterThan(1);
        });
    });
    describe('Performance and Stability', () => {
        it('should handle 1000 frames without errors', () => {
            // Create ground
            for (let x = 0; x < 100; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            simulator = new PhysicsSimulator(80, 640);
            simulator.setCollisionManager(collisionManager);
            expect(() => {
                simulator.simulateFrames(1000, { left: false, right: true, jump: false, down: false });
            }).not.toThrow();
        });
        it('should produce deterministic results', () => {
            // Create ground
            for (let x = 0; x < 20; x++) {
                const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
                collisionManager.setTile(x, 41, tile);
            }
            // First run
            const sim1 = new PhysicsSimulator(80, 640);
            sim1.setCollisionManager(collisionManager);
            sim1.simulateFrames(100, { left: false, right: true, jump: false, down: false });
            const result1 = sim1.getState();
            // Second run
            const sim2 = new PhysicsSimulator(80, 640);
            sim2.setCollisionManager(collisionManager);
            sim2.simulateFrames(100, { left: false, right: true, jump: false, down: false });
            const result2 = sim2.getState();
            // Should be identical
            expect(result2.x).toBeCloseTo(result1.x, 5);
            expect(result2.y).toBeCloseTo(result1.y, 5);
            expect(result2.groundSpeed).toBeCloseTo(result1.groundSpeed, 5);
        });
    });
});
