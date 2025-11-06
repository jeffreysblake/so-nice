import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,  // 3x original Genesis resolution (320x224)
  height: 672,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },  // We'll handle gravity manually for Sonic physics
      debug: true,  // Enable during development
    },
  },
  scene: [PreloadScene, GameScene],
  pixelArt: true,  // Important for retro pixel graphics
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

export default game;
