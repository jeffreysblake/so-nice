import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TerrainManager } from '../terrain/TerrainManager';
import { Spring, SpringType, SpringOrientation } from '../objects/Spring';
/**
 * GameScene - Main gameplay scene
 */
export class GameScene extends Phaser.Scene {
    player;
    terrainManager;
    springs = [];
    cursors;
    debugText;
    debugKey;
    constructor() {
        super({ key: 'GameScene' });
    }
    create() {
        // Set up physics world
        this.physics.world.setBounds(0, 0, 3840, 672); // 4x screen width for scrolling
        // Create terrain system
        this.terrainManager = new TerrainManager(this);
        this.terrainManager.buildGreenHillZone();
        // Create player
        this.player = new Player(this, 100, 600);
        this.player.setCollisionManager(this.terrainManager.getCollisionManager());
        // Create springs at strategic locations
        // Spring at bottom of downhill run (launches player)
        this.springs.push(new Spring(this, 110 * 16, 46 * 16, SpringType.YELLOW, SpringOrientation.UP));
        // Spring in valley (Section 5)
        this.springs.push(new Spring(this, 123 * 16, 47 * 16, SpringType.RED, SpringOrientation.UP));
        // Spring before platform section to help with gap
        this.springs.push(new Spring(this, 168 * 16, 41 * 16, SpringType.YELLOW, SpringOrientation.UP));
        // Set up camera
        this.cameras.main.setBounds(0, 0, 3840, 672);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        // Debug text
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 },
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
        console.log('GameScene created');
    }
    update(time, delta) {
        if (!this.player)
            return;
        // Update player with input
        this.player.update(time, delta, this.cursors);
        // Update springs and check for collisions
        this.springs.forEach(spring => {
            if (spring.checkPlayerCollision(this.player.x, this.player.y, 20)) {
                spring.onPlayerInteract(this.player);
            }
            spring.update(time, delta);
        });
        // Update terrain (for debug rendering)
        this.terrainManager.update();
        // Toggle debug mode
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.terrainManager.toggleDebug();
        }
        // Update debug info
        this.updateDebugInfo();
    }
    updateDebugInfo() {
        const state = this.player.getPhysicsState();
        const modeNames = ['FLOOR', 'RIGHT_WALL', 'CEILING', 'LEFT_WALL'];
        this.debugText.setText([
            `FPS: ${Math.round(this.game.loop.actualFps)}`,
            `Pos: (${Math.round(state.x)}, ${Math.round(state.y)})`,
            `Ground Speed: ${state.groundSpeed.toFixed(3)}`,
            `Velocity: (${state.xVelocity.toFixed(2)}, ${state.yVelocity.toFixed(2)})`,
            `State: ${this.player.getCurrentState()}`,
            `Grounded: ${state.isGrounded}`,
            `Angle: ${state.groundAngle}°`,
            `Gravity Mode: ${modeNames[state.groundMode]}`,
            '',
            'Controls:',
            'Arrow Keys: Move',
            'Z: Jump',
            'Down: Roll (when moving)',
            'D: Toggle Debug',
        ].join('\n'));
    }
}
