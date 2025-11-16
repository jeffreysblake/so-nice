import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TerrainManager } from '../terrain/TerrainManager';
import { Spring, SpringType, SpringOrientation } from '../objects/Spring';
import { Ring } from '../objects/Ring';
import { Motobug } from '../objects/Motobug';
import { Crabmeat } from '../objects/Crabmeat';
import { Enemy } from '../objects/Enemy';
import { LifeSystem } from '../systems/LifeSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { GoalPost } from '../objects/GoalPost';

/**
 * GameScene - Main gameplay scene
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private terrainManager!: TerrainManager;
  private lifeSystem!: LifeSystem;
  private scoreSystem!: ScoreSystem;
  private springs: Spring[] = [];
  private rings: Ring[] = [];
  private enemies: Enemy[] = [];
  private goalPost!: GoalPost;
  private levelComplete: boolean = false;
  private springHitCount: number = 0; // Track spring hits for E2E testing
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private debugText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private debugKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Set up physics world
    // Level dimensions: 310 tiles wide × ~50 tiles tall (valley at y=752px)
    // Extended to match original GHZ Act 1 length (320 tiles = 5,120px)
    // Using 5,120 width to match original, 1,200 height for valley terrain
    this.physics.world.setBounds(0, 0, 5120, 1200);

    // Create terrain system and load collision data
    this.terrainManager = new TerrainManager(this);

    // Load collision data from Phaser cache
    const normalData = this.cache.binary.get('collision-normal');
    const rotatedData = this.cache.binary.get('collision-rotated');
    const angleData = this.cache.binary.get('collision-angles');

    if (normalData && rotatedData && angleData) {
      console.log('✅ GameScene: Loading Sonic 1 collision data into TerrainManager...');
      this.terrainManager.getCollisionDataLoader().loadFromBuffers(
        normalData,
        rotatedData,
        angleData
      );
      console.log('✅ GameScene: Collision data loaded successfully!');
    } else {
      console.error('❌ GameScene: Collision data NOT FOUND in cache!');
      console.error('   This means PreloadScene failed to load the .bin files');
      console.warn('⚠️ Falling back to programmatic terrain generation');
    }

    // Load chunk data from cache
    const chunksData = this.cache.binary.get('ghz-chunks');
    const collisionIndexData = this.cache.binary.get('ghz-collision-index');

    if (chunksData && collisionIndexData) {
      console.log('✅ GameScene: Loading GHZ chunk definitions...');
      this.terrainManager.getChunkLoader().loadFromBuffers(chunksData, collisionIndexData);
      this.terrainManager.markChunksLoaded(); // Mark chunks as loaded
      console.log('✅ GameScene: Chunk data loaded successfully!');
    } else {
      console.warn('⚠️ GameScene: Chunk data not found, using basic tile rendering');
    }

    // Load block data from cache (128×128 blocks made of 8×8 grid of chunks)
    const blocksData = this.cache.binary.get('ghz-blocks');

    if (blocksData) {
      console.log('✅ GameScene: Loading GHZ block definitions (128×128 blocks)...');
      this.terrainManager.getBlockLoader().loadFromBuffer(blocksData);
      this.terrainManager.markBlocksLoaded(); // Mark blocks as loaded
      console.log('✅ GameScene: Block data loaded successfully!');
    } else {
      console.warn('⚠️ GameScene: Block data not found, cannot render authentic GHZ');
    }

    // Load level layout from cache
    const layoutData = this.cache.binary.get('ghz1-layout');

    if (layoutData) {
      console.log('✅ GameScene: Loading GHZ Act 1 layout...');
      this.terrainManager.getLevelLayout().loadFromBuffer(layoutData);
      console.log('✅ GameScene: Level layout loaded successfully!');
    } else {
      console.warn('⚠️ GameScene: Level layout not found, using fallback terrain');
    }

    this.terrainManager.buildGreenHillZone();

    // Find spawn point in authentic layout
    const spawnPoint = this.terrainManager.findSpawnPoint();
    const spawnX = spawnPoint ? spawnPoint.x : 300;
    const spawnY = spawnPoint ? spawnPoint.y : 600;

    console.log(`🎮 Spawning player at (${spawnX}, ${spawnY})`);

    // Create player at authentic spawn point
    this.player = new Player(this, spawnX, spawnY);
    this.player.setCollisionManager(this.terrainManager.getCollisionManager());

    // Create life system and set callbacks - match player spawn position
    this.lifeSystem = new LifeSystem(this, spawnX, spawnY);
    this.lifeSystem.setCallbacks(
      () => this.onPlayerDeath(),
      () => this.onPlayerRespawn(),
      () => this.onGameOver()
    );
    this.player.setLifeSystem(this.lifeSystem);

    // Create score system and start timer
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.start();

    // Set player event callbacks for scoring
    this.player.setEventCallbacks(
      () => this.scoreSystem.addRingPoints(),
      () => this.scoreSystem.addEnemyPoints()
    );

    // Object placement offset - adjust all objects relative to spawn point
    // Old spawn was at ~x=300, new spawn is dynamic (e.g., x=3904)
    const objectOffset = spawnX - 300;

    // Create springs at strategic locations throughout the extended level
    // Spring 1: At bottom of downhill run (tiles 60-75, place at 74)
    this.springs.push(new Spring(this, 74 * 16 + objectOffset, 43 * 16, SpringType.YELLOW, SpringOrientation.UP));

    // Spring 2: In valley floor (tiles 85-97, place at 89)
    this.springs.push(new Spring(this, 89 * 16 + objectOffset, 47 * 16, SpringType.RED, SpringOrientation.UP));

    // Spring 3: Before uphill (tile 130)
    this.springs.push(new Spring(this, 130 * 16 + objectOffset, 40 * 16, SpringType.YELLOW, SpringOrientation.UP));

    // Spring 4: In extended valley (tiles 192-204, place at 198)
    this.springs.push(new Spring(this, 198 * 16 + objectOffset, 44 * 16, SpringType.YELLOW, SpringOrientation.UP));

    // Spring 5: Another extended valley (tiles 279-291, place at 285)
    this.springs.push(new Spring(this, 285 * 16 + objectOffset, 43 * 16, SpringType.RED, SpringOrientation.UP));

    // Create rings throughout the level
    this.createRings(objectOffset);

    // Create enemies
    this.createEnemies(objectOffset);

    // Create goal post at end of extended level (tile 305)
    this.goalPost = new GoalPost(this, 305 * 16 + objectOffset, 41 * 16);

    // Set up camera to match physics world
    this.cameras.main.setBounds(0, 0, 5120, 1200);
    // Smooth horizontal follow (0.1), instant vertical (1.0) to prevent bobbing
    this.cameras.main.startFollow(this.player, true, 0.1, 1.0);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.debugKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );

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

  update(time: number, delta: number) {
    if (!this.player) return;

    // Update score system (timer)
    this.scoreSystem.update(delta / (1000 / 60)); // Convert ms to frames

    // Update player with input
    this.player.update(time, delta, this.cursors);

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

    // Update springs and check for collisions
    this.springs.forEach(spring => {
      if (spring.checkPlayerCollision(this.player.x, this.player.y, 20)) {
        const bounced = spring.onPlayerInteract(this.player);
        if (bounced) {
          this.springHitCount++;
        }
      }
      spring.update(time, delta);
    });

    // Check goal post collision
    if (!this.levelComplete && this.goalPost.checkPlayerCollision(this.player.x, this.player.y, 20)) {
      this.goalPost.onPlayerInteract(this.player);
      this.onLevelComplete();
    }
    this.goalPost.update(time, delta);

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

  private updateDebugInfo() {
    const state = this.player.getPhysicsState();
    const modeNames = ['FLOOR', 'RIGHT_WALL', 'CEILING', 'LEFT_WALL'];

    // Expose state to window object for E2E testing
    (window as any).gameState = {
      fps: Math.round(this.game.loop.actualFps),
      x: Math.round(state.x),
      y: Math.round(state.y),
      groundSpeed: parseFloat(state.groundSpeed.toFixed(3)),
      xVelocity: parseFloat(state.xVelocity.toFixed(2)),
      yVelocity: parseFloat(state.yVelocity.toFixed(2)),
      playerState: this.player.getCurrentState(),
      isGrounded: state.isGrounded,
      angle: state.groundAngle,
      gravityMode: modeNames[state.groundMode],
      controlLock: state.controlLock, // Fixed: was controlsLocked (with 's')
      springHitCount: this.springHitCount,
      isFacingRight: state.isFacingRight,
    };

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

  private updateHUD() {
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
  private onPlayerDeath(): void {
    console.log('GameScene: Player died');
    // Stop the timer
    this.scoreSystem.stop();
    // Disable player input
    // Play death music (if available)
  }

  /**
   * Handle player respawn
   */
  private onPlayerRespawn(): void {
    console.log('GameScene: Player respawning');
    this.player.respawn();
    // Restart the timer
    this.scoreSystem.start();
    this.updateHUD();
  }

  /**
   * Handle game over
   */
  private onGameOver(): void {
    console.log('GameScene: Game Over!');

    // Show game over text
    const gameOverText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'GAME OVER',
      {
        fontSize: '64px',
        color: '#ff0000',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 8,
      }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(2000);

    // Wait 3 seconds then restart
    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }

  /**
   * Handle level completion
   */
  private onLevelComplete(): void {
    if (this.levelComplete) return;

    this.levelComplete = true;
    console.log('Level Complete!');

    // Stop the timer
    this.scoreSystem.stop();

    // Calculate bonuses
    const ringBonus = this.scoreSystem.calculateRingBonus(this.player.getRingCount());
    const timeBonus = this.scoreSystem.calculateTimeBonus();
    const totalBonus = ringBonus + timeBonus;

    // Add bonuses to score
    this.scoreSystem.addPoints(totalBonus);

    // Show level clear screen
    const clearText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      'LEVEL CLEAR!',
      {
        fontSize: '48px',
        color: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );
    clearText.setOrigin(0.5);
    clearText.setScrollFactor(0);
    clearText.setDepth(2000);

    // Show bonus breakdown
    const bonusText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      [
        `RING BONUS: ${ringBonus}`,
        `TIME BONUS: ${timeBonus}`,
        `TOTAL SCORE: ${this.scoreSystem.getScore()}`,
      ].join('\n'),
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        lineSpacing: 10,
      }
    );
    bonusText.setOrigin(0.5);
    bonusText.setScrollFactor(0);
    bonusText.setDepth(2000);

    // Play celebration animation
    this.tweens.add({
      targets: clearText,
      scale: 1.2,
      yoyo: true,
      duration: 500,
      repeat: -1,
    });

    // Wait 5 seconds then restart (or move to next level)
    this.time.delayedCall(5000, () => {
      console.log('Restarting level...');
      this.scene.restart();
    });
  }

  private createRings(offset: number) {
    // Starting area - line of rings
    for (let i = 0; i < 12; i++) {
      this.rings.push(new Ring(this, (5 + i * 2) * 16 + offset, 38 * 16));
    }

    // Before first hill
    for (let i = 0; i < 6; i++) {
      this.rings.push(new Ring(this, (30 + i * 2) * 16 + offset, 39 * 16));
    }

    // Arc before loop
    for (let i = 0; i < 6; i++) {
      const x = (44 + i) * 16 + offset;
      const y = (38 - i) * 16;
      this.rings.push(new Ring(this, x, y));
    }

    // After loop
    for (let i = 0; i < 8; i++) {
      this.rings.push(new Ring(this, (58 + i * 2) * 16 + offset, 40 * 16));
    }

    // Downhill run
    for (let i = 0; i < 10; i++) {
      this.rings.push(new Ring(this, (68 + i * 2) * 16 + offset, 41 * 16));
    }

    // Valley rings (around red spring)
    for (let i = 0; i < 8; i++) {
      this.rings.push(new Ring(this, (92 + i * 2) * 16 + offset, 45 * 16));
    }

    // Uphill section
    for (let i = 0; i < 10; i++) {
      this.rings.push(new Ring(this, (108 + i * 2) * 16 + offset, 40 * 16));
    }

    // Final section before goal
    for (let i = 0; i < 10; i++) {
      this.rings.push(new Ring(this, (145 + i * 2) * 16 + offset, 37 * 16));
    }

    // Goal area celebration
    for (let i = 0; i < 8; i++) {
      this.rings.push(new Ring(this, (157 + i * 2) * 16 + offset, 38 * 16));
    }

    console.log(`Created ${this.rings.length} rings in the level`);
  }

  private createEnemies(offset: number) {
    // Starting area - moved far from player spawn (player at X=100, ~tile 6)
    // Give player at least 40 tiles of safe space before first enemy
    this.enemies.push(new Motobug(this, 50 * 16 + offset, 41 * 16));
    this.enemies.push(new Crabmeat(this, 58 * 16 + offset, 41 * 16));

    // Before first hill
    this.enemies.push(new Motobug(this, 65 * 16 + offset, 40 * 16));

    // After loop - patrol area
    this.enemies.push(new Motobug(this, 60 * 16 + offset, 41 * 16));
    this.enemies.push(new Crabmeat(this, 68 * 16 + offset, 41 * 16));

    // Valley area - enemy cluster
    this.enemies.push(new Motobug(this, 92 * 16 + offset, 46 * 16));
    this.enemies.push(new Crabmeat(this, 97 * 16 + offset, 46 * 16));

    // Uphill section - challenge
    this.enemies.push(new Motobug(this, 110 * 16 + offset, 40 * 16));
    this.enemies.push(new Crabmeat(this, 120 * 16 + offset, 40 * 16));

    // Final area - last enemies before goal
    this.enemies.push(new Motobug(this, 145 * 16 + offset, 38 * 16));
    this.enemies.push(new Crabmeat(this, 155 * 16 + offset, 38 * 16));

    console.log(`Created ${this.enemies.length} enemies in the level`);
  }
}
