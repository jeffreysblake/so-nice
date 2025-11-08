import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TerrainManager } from '../terrain/TerrainManager';
import { Spring, SpringType, SpringOrientation } from '../objects/Spring';
import { Ring } from '../objects/Ring';
import { Motobug } from '../objects/Motobug';
import { Crabmeat } from '../objects/Crabmeat';
import { LifeSystem } from '../systems/LifeSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
/**
 * GameScene - Main gameplay scene
 */
export class GameScene extends Phaser.Scene {
    player;
    terrainManager;
    lifeSystem;
    scoreSystem;
    springs = [];
    rings = [];
    enemies = [];
    cursors;
    debugText;
    hudText;
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
        // Create life system and set callbacks
        this.lifeSystem = new LifeSystem(this, 100, 600);
        this.lifeSystem.setCallbacks(() => this.onPlayerDeath(), () => this.onPlayerRespawn(), () => this.onGameOver());
        this.player.setLifeSystem(this.lifeSystem);
        // Create score system and start timer
        this.scoreSystem = new ScoreSystem();
        this.scoreSystem.start();
        // Set player event callbacks for scoring
        this.player.setEventCallbacks(() => this.scoreSystem.addRingPoints(), () => this.scoreSystem.addEnemyPoints());
        // Create springs at strategic locations
        // Spring at bottom of downhill run (launches player)
        this.springs.push(new Spring(this, 110 * 16, 46 * 16, SpringType.YELLOW, SpringOrientation.UP));
        // Spring in valley (Section 5)
        this.springs.push(new Spring(this, 123 * 16, 47 * 16, SpringType.RED, SpringOrientation.UP));
        // Spring before platform section to help with gap
        this.springs.push(new Spring(this, 168 * 16, 41 * 16, SpringType.YELLOW, SpringOrientation.UP));
        // Create rings throughout the level
        this.createRings();
        // Create enemies
        this.createEnemies();
        // Set up camera
        this.cameras.main.setBounds(0, 0, 3840, 672);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        // HUD text (always visible)
        this.hudText = this.add.text(10, 10, '', {
            fontSize: '18px',
            color: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4,
        });
        this.hudText.setScrollFactor(0);
        this.hudText.setDepth(1001);
        this.updateHUD();
        // Debug text
        this.debugText = this.add.text(10, 80, '', {
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
        // Update score system (timer)
        this.scoreSystem.update(delta / (1000 / 60)); // Convert ms to frames
        // Update player with input
        this.player.update(time, delta, this.cursors);
        // Update springs and check for collisions
        this.springs.forEach(spring => {
            if (spring.checkPlayerCollision(this.player.x, this.player.y, 20)) {
                spring.onPlayerInteract(this.player);
            }
            spring.update(time, delta);
        });
        // Update rings and check for collection
        this.rings.forEach(ring => {
            if (ring.checkPlayerCollision(this.player.x, this.player.y, 20)) {
                ring.onPlayerInteract(this.player);
                if (ring.isCollected()) {
                    this.player.collectRing();
                    this.updateHUD();
                }
            }
            ring.update(time, delta);
        });
        // Update scattered rings (from damage) and check for collection
        const scatteredRings = this.player.getDamageSystem().getScatteredRings();
        scatteredRings.forEach(ring => {
            if (ring.checkPlayerCollision(this.player.x, this.player.y, 20)) {
                ring.onPlayerInteract(this.player);
                if (ring.isCollected()) {
                    this.player.collectRing();
                    this.updateHUD();
                }
            }
            ring.update(time, delta);
        });
        // Update enemies and check for collisions
        this.enemies.forEach(enemy => {
            if (enemy.checkPlayerCollision(this.player.x, this.player.y, 20)) {
                enemy.onPlayerInteract(this.player);
            }
            enemy.update(time, delta);
        });
        // Update terrain (for debug rendering)
        this.terrainManager.update();
        // Toggle debug mode
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.terrainManager.toggleDebug();
        }
        // Update debug info
        this.updateDebugInfo();
        // Update HUD (for timer)
        this.updateHUD();
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
    updateHUD() {
        const lives = this.lifeSystem ? this.lifeSystem.getLives() : 3;
        const score = this.scoreSystem ? this.scoreSystem.getScore() : 0;
        const time = this.scoreSystem ? this.scoreSystem.getFormattedTime() : '0:00';
        this.hudText.setText([
            `SCORE: ${score}`,
            `TIME: ${time}`,
            `RINGS: ${this.player.getRingCount()}  LIVES: ${lives}`,
        ].join('  '));
    }
    /**
     * Handle player death
     */
    onPlayerDeath() {
        console.log('GameScene: Player died');
        // Stop the timer
        this.scoreSystem.stop();
        // Disable player input
        // Play death music (if available)
    }
    /**
     * Handle player respawn
     */
    onPlayerRespawn() {
        console.log('GameScene: Player respawning');
        this.player.respawn();
        // Restart the timer
        this.scoreSystem.start();
        this.updateHUD();
    }
    /**
     * Handle game over
     */
    onGameOver() {
        console.log('GameScene: Game Over!');
        // Show game over text
        const gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 8,
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(2000);
        // Wait 3 seconds then restart
        this.time.delayedCall(3000, () => {
            this.scene.restart();
        });
    }
    createRings() {
        // Starting area - line of rings
        for (let i = 0; i < 10; i++) {
            this.rings.push(new Ring(this, (5 + i * 2) * 16, 35 * 16));
        }
        // Before first hill
        for (let i = 0; i < 5; i++) {
            this.rings.push(new Ring(this, (25 + i * 2) * 16, 38 * 16));
        }
        // Arc over first loop entrance
        for (let i = 0; i < 7; i++) {
            const x = (36 + i) * 16;
            const y = (32 - Math.abs(i - 3) * 2) * 16;
            this.rings.push(new Ring(this, x, y));
        }
        // High path rings
        for (let i = 0; i < 8; i++) {
            this.rings.push(new Ring(this, (62 + i * 3) * 16, 32 * 16));
        }
        // Low path rings
        for (let i = 0; i < 8; i++) {
            this.rings.push(new Ring(this, (64 + i * 3) * 16, 40 * 16));
        }
        // Downhill run
        for (let i = 0; i < 12; i++) {
            this.rings.push(new Ring(this, (95 + i * 2) * 16, (39 - i) * 16));
        }
        // Valley rings (around red spring)
        for (let i = 0; i < 6; i++) {
            this.rings.push(new Ring(this, (120 + i * 2) * 16, 46 * 16));
        }
        // Before second loop
        for (let i = 0; i < 5; i++) {
            this.rings.push(new Ring(this, (138 + i * 2) * 16, 38 * 16));
        }
        // Platform section - challenging placement
        this.rings.push(new Ring(this, 160 * 16, 35 * 16));
        this.rings.push(new Ring(this, 164 * 16, 33 * 16));
        this.rings.push(new Ring(this, 170 * 16, 35 * 16));
        this.rings.push(new Ring(this, 175 * 16, 37 * 16));
        // Goal area celebration
        for (let i = 0; i < 10; i++) {
            this.rings.push(new Ring(this, (200 + i * 2) * 16, 39 * 16));
        }
        console.log(`Created ${this.rings.length} rings in the level`);
    }
    createEnemies() {
        // Starting area - a few Motobugs
        this.enemies.push(new Motobug(this, 30 * 16, 38 * 16));
        this.enemies.push(new Motobug(this, 50 * 16, 38 * 16));
        // Before first loop - Crabmeat
        this.enemies.push(new Crabmeat(this, 35 * 16, 38 * 16));
        // After first loop on high path - Motobug patrol
        this.enemies.push(new Motobug(this, 70 * 16, 32 * 16));
        this.enemies.push(new Motobug(this, 85 * 16, 32 * 16));
        // Low path - Crabmeat guarding rings
        this.enemies.push(new Crabmeat(this, 75 * 16, 40 * 16));
        // Downhill run area - scattered enemies
        this.enemies.push(new Motobug(this, 100 * 16, 39 * 16));
        this.enemies.push(new Crabmeat(this, 108 * 16, 35 * 16));
        // Valley area - enemy cluster
        this.enemies.push(new Motobug(this, 118 * 16, 47 * 16));
        this.enemies.push(new Crabmeat(this, 125 * 16, 47 * 16));
        this.enemies.push(new Motobug(this, 130 * 16, 47 * 16));
        // Before second loop - guards
        this.enemies.push(new Motobug(this, 140 * 16, 38 * 16));
        this.enemies.push(new Crabmeat(this, 145 * 16, 38 * 16));
        // Platform section - challenging placement
        this.enemies.push(new Motobug(this, 162 * 16, 35 * 16));
        this.enemies.push(new Crabmeat(this, 172 * 16, 37 * 16));
        // Near goal - final challenge
        this.enemies.push(new Motobug(this, 190 * 16, 39 * 16));
        this.enemies.push(new Crabmeat(this, 195 * 16, 39 * 16));
        this.enemies.push(new Motobug(this, 200 * 16, 39 * 16));
        console.log(`Created ${this.enemies.length} enemies in the level`);
    }
}
