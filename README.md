# Sonic Platformer

A 2D platformer clone of Sonic the Hedgehog (1991) built with Phaser 3 and TypeScript.

## Features

This project aims to recreate the authentic Sonic physics and gameplay mechanics from the original Sega Genesis game:

- ✅ Momentum-based physics system
- ✅ Ground acceleration, deceleration, and friction
- ✅ Variable jump height
- ✅ Sensor-based collision detection
- ✅ 360-degree movement on slopes
- ✅ Slope physics (speed affected by angle)
- ✅ Character rotation on slopes
- ✅ Perpendicular jumping from surfaces
- ✅ Heightmap-based terrain tiles
- 🚧 Full loop-de-loops with gravity switching
- 🚧 Rolling and spin dash
- 🚧 Ring collection system
- 🚧 Enemies and item boxes
- 🚧 Green Hill Zone inspired level

## Physics Implementation

Based on the [Sonic Physics Guide](https://info.sonicretro.org/Sonic_Physics_Guide) from Sonic Retro.

### Core Constants
- Acceleration: 0.046875 px/frame
- Deceleration: 0.5 px/frame
- Friction: 0.046875 px/frame
- Top Speed: 6 px/frame
- Gravity: 0.21875 px/frame
- Jump Force: 6.5 px/frame

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
src/
├── config/          # Game configuration and constants
│   └── PhysicsConstants.ts
├── entities/        # Game entities (Player, Enemies, etc.)
│   └── Player.ts
├── scenes/          # Phaser scenes
│   ├── PreloadScene.ts
│   └── GameScene.ts
├── terrain/         # Terrain and collision system
│   ├── TerrainTile.ts      # 16x16 heightmap tiles
│   ├── CollisionManager.ts # Sensor-based collision
│   └── TerrainManager.ts   # Level building and rendering
├── types/           # TypeScript type definitions
│   └── SonicTypes.ts
└── main.ts          # Entry point
```

## Controls

- **Arrow Keys**: Move left/right
- **Z**: Jump (perpendicular to surface)
- **Down Arrow**: Roll (when moving)
- **D**: Toggle debug visualization

## References

- [Sonic Physics Guide](https://info.sonicretro.org/Sonic_Physics_Guide) - Comprehensive physics documentation
- [Open Sonic JS](https://github.com/clarkeadg/opensonic-js) - Web-based Sonic clone
- [Open Sonic 1 Recreation](https://github.com/GalaxyShad/Open-Sonic-1-Recreation) - C++ recreation

## Roadmap

### Phase 1: Core Physics ✅ (Complete)
- [x] Basic game loop (60 FPS)
- [x] Ground movement physics
- [x] Jumping mechanics with variable height
- [x] Sensor-based collision detection
- [x] Slope physics with angle detection
- [x] 360-degree movement on slopes
- [x] Character rotation based on surface
- [x] Heightmap terrain system
- [ ] Full loop de loop mechanics with gravity switching

### Phase 2: Player Character
- [ ] Sprite animations
- [ ] State machine
- [ ] Rolling physics
- [ ] Spin dash

### Phase 3: Level Design
- [x] Heightmap tilemap system
- [x] Sensor-based collision layers
- [x] Test level with slopes and curves
- [ ] Full Green Hill Zone level layout
- [ ] Parallax backgrounds

### Phase 4: Game Objects
- [ ] Ring system
- [ ] Enemies (2-3 types)
- [ ] Item boxes
- [ ] Springs and bumpers

### Phase 5: Polish
- [ ] Sound effects
- [ ] Music
- [ ] HUD
- [ ] Camera system
- [ ] Particle effects

## License

This is a fan project for educational purposes. Sonic the Hedgehog is owned by SEGA.
