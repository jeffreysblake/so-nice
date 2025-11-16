import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { PreloadScene } from './scenes/PreloadScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,  // 3x original Genesis resolution (320x224)
  height: 672,
  parent: 'game-container',
  backgroundColor: '#7DC8F7',  // Sonic 1 Green Hill Zone sky blue
  fps: {
    target: 60,           // Target 60 FPS (Sonic physics designed for 60 FPS)
    forceSetTimeOut: false, // Use requestAnimationFrame for smooth rendering
    min: 30,              // Minimum FPS before slowing down
    smoothStep: true,     // Smooth out frame spikes
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },  // We'll handle gravity manually for Sonic physics
      debug: false,  // Disabled for performance (was causing 23 FPS instead of 60)
      fps: 60,       // Physics update rate (must match game FPS)
    },
  },
  scene: [PreloadScene, GameScene],
  pixelArt: true,  // Important for retro pixel graphics
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,      // No antialiasing for pixel art
    pixelArt: true,        // Ensure crisp pixels
    roundPixels: true,     // Round to nearest pixel to prevent sub-pixel rendering
    preserveDrawingBuffer: true,  // Required for canvas.toDataURL() screenshots
  },
};

const game = new Phaser.Game(config);

export default game;
