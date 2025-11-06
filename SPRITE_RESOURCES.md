# Sprite Resources for Sonic Platformer

## Overview
This document contains all the sprite resources needed for the Sonic platformer clone, sourced primarily from **The Spriters Resource** - a comprehensive archive of game sprites available for fan projects and non-commercial use.

---

## 🎮 Primary Resource: The Spriters Resource

**Main Page**: https://www.spriters-resource.com/sega_genesis/sonicth1/

This page contains all original Sonic the Hedgehog (1991) Genesis sprites, organized into categories:
- Playable Characters (1 sheet)
- Enemies & Bosses (2 sheets)
- Stages (22 sheets)
- Backgrounds (14 sheets)
- Tilesets (9 sheets)
- Stage Objects (7 sheets)
- Miscellaneous (11 sheets including HUD, Title Screen, etc.)

**Total**: 66 sprite sheets covering every asset from the original game

---

## 📋 Required Sprites by Priority

### Priority 1: Player Character ⭐⭐⭐

**Sonic the Hedgehog Sprite Sheet**
- **Direct Link**: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/21628/
- **Size**: 690x1558 pixels
- **Animations Included**:
  - Idle/Standing
  - Jog (walking)
  - Jog Angled (diagonal movement)
  - Run (fast running)
  - Run Angled (diagonal running)
  - Jump (spin ball during jump)
  - Roll (spin dash and rolling)
  - Tunnel (specialized movement)
  - Falling/Hurt poses
  - Death animation
  - Victory/Ending poses

**Usage Priority**: IMMEDIATE - Required for player visibility

---

### Priority 2: Level Art ⭐⭐⭐

**Green Hill Zone Tileset**
- **Direct Link**: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/27190/
- **Contains**:
  - Ground tiles (grass tops, dirt, checkered patterns)
  - Platform tiles (16x16 solid tiles)
  - Slope tiles (various angles)
  - Loop tiles (curved sections for loop-de-loops)
  - Bridge tiles
  - Background elements

**Green Hill Zone Backgrounds**
- **Available on main page**: Multiple background layers for parallax scrolling
- **Contains**:
  - Sky gradient
  - Clouds (multiple layers)
  - Mountains/hills in distance
  - Waterfall effects
  - Foliage (flowers, palm trees)

**Usage Priority**: IMMEDIATE - Required for visual level representation

---

### Priority 3: Collectibles & Items ⭐⭐⭐

**Rings**
- **Location**: Stage Objects section on main page
- **Contains**:
  - Ring idle animation (rotating ring, ~8 frames)
  - Ring sparkle/collect effect
  - Ring scatter animation (when hit)

**Item Boxes**
- **Location**: Stage Objects section
- **Contains**:
  - Box base sprite
  - Ring icon (10 rings)
  - Shield icon (blue shield)
  - Invincibility icon
  - Speed shoes icon
  - 1-Up icon (Sonic face)
  - Destruction animation

**Springs**
- **Location**: Stage Objects section
- **Contains**:
  - Yellow spring (normal) - compressed & extended states
  - Red spring (high bounce) - compressed & extended states
  - Horizontal spring variants

**Usage Priority**: HIGH - Required for gameplay loop (rings especially)

---

### Priority 4: Enemies ⭐⭐

**Badniks (Enemies) Sprite Sheet**
- **Available on main page**: "Badniks" sheet
- **Contains Green Hill Zone enemies**:
  - **Motobug**: Ladybug-like robot that walks back and forth
    - Walking animation (~4 frames)
    - Turn-around animation
    - Destruction frames
  - **Crabmeat**: Crab robot that shoots projectiles
    - Walking animation
    - Shooting pose
    - Projectile sprites (2-3 frames)
    - Destruction frames
  - **Newtron**: Dragonfly robot (optional)
  - **Chopper**: Fish robot (optional)

**Small Animals** (released from destroyed enemies)
- **Location**: Miscellaneous section
- **Contains**:
  - Flicky (bird)
  - Pocky (squirrel)
  - Pecky (penguin)
  - Ricky (seal)
  - Picky (chicken)
  - Cucky (chicken)
  - Rocky (penguin)

**Usage Priority**: HIGH - Required for combat and gameplay challenge

---

### Priority 5: HUD & UI ⭐⭐

**HUD Overlay**
- **Direct Link**: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/37424/
- **Contains**:
  - Number sprites (0-9) for score/rings/time
  - Letters (ABCDEFGHIJKLMNOPQRSTUVWXYZ)
  - "SCORE" text label
  - "TIME" text label
  - "RINGS" text label
  - Life counter icon (Sonic head)
  - Act numbers (1, 2, 3)
  - UI circles and decorative elements

**Additional UI Elements**
- **Location**: Miscellaneous section
- **Contains**:
  - Title screen logos
  - "GAME OVER" text
  - "PRESS START" text
  - Stage title cards ("GREEN HILL ZONE", "ACT 1", etc.)
  - Continue screen elements

**Usage Priority**: MEDIUM - Important for polish and player feedback

---

### Priority 6: Effects & Polish ⭐

**Miscellaneous Effects**
- **Location**: Miscellaneous and Stage Objects sections
- **Contains**:
  - Dust clouds (landing, running)
  - Water splash effects
  - Sparkles (ring collection, invincibility)
  - Explosion sprites (enemy destruction)
  - Speed lines
  - Shield bubble sprites

**Goal Post**
- **Location**: Stage Objects section
- **Contains**:
  - Sign post base
  - "SONIC" sign (front)
  - "EGGMAN" sign (back)
  - Spinning animation frames
  - Landing animation

**Usage Priority**: MEDIUM - Adds polish and feedback

---

## 🎨 Alternative Resources

### Sonic Galaxy.net
- **URL**: https://www.sonicgalaxy.net/sprites-gen-sonic/
- **Contains**: 79 sprite sheets from Sonic The Hedgehog (Genesis)
- **Format**: Organized by category similar to Spriters Resource
- **Use Case**: Backup source if Spriters Resource is unavailable

### Sprite Database
- **URL**: https://spritedatabase.net/game/95
- **Contains**: Sonic the Hedgehog sprite collection
- **License**: Free for private or non-commercial use
- **Use Case**: Alternative download source

### Custom/Enhanced Sprites
- **URL**: https://www.spriters-resource.com/custom_edited/sonicthehedgehogcustoms/
- **Contains**: Fan-made enhancements and variations of original sprites
- **Notable**:
  - Enhanced life counter icons
  - Remastered sprite sheets
  - Additional animation frames
- **Use Case**: Optional enhancements after implementing original sprites

---

## 📐 Sprite Specifications

### Original Sonic 1 (Genesis) Specifications
- **Resolution**: 320x224 pixels (native Genesis resolution)
- **Tile Size**: 16x16 pixels
- **Sonic Sprite**: ~20x32 pixels (varies by pose)
- **Ring Sprite**: 8x8 pixels
- **Item Box**: 16x16 pixels (1 tile)
- **Color Palette**: 16 colors per sprite (Genesis limitation)
- **Frame Rate**: 60 FPS animations

### Our Implementation Target
- **Game Resolution**: 960x672 pixels (3x scale)
- **Tile Size**: 16x16 pixels (matching original)
- **Scaling**: Can apply 2x or 3x nearest-neighbor scaling for modern displays
- **Format**: PNG with transparency
- **Atlas**: Combine sprites into texture atlases for performance

---

## 📥 Download Instructions

### Method 1: Direct Download from Spriters Resource
1. Visit the sprite sheet link (e.g., https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/21628/)
2. Click the "Download" button or "Save" icon
3. Save PNG file to local directory
4. Repeat for each needed sprite sheet

### Method 2: Bulk Download
1. Visit main page: https://www.spriters-resource.com/sega_genesis/sonicth1/
2. Browse categories (Playable Characters, Enemies, Stage Objects, etc.)
3. Download individual sheets as needed
4. Organize into folders by category

### Recommended Folder Structure
```
public/assets/
├── sprites/
│   ├── sonic/
│   │   └── sonic-spritesheet.png
│   ├── enemies/
│   │   ├── motobug.png
│   │   ├── crabmeat.png
│   │   └── badnik-destruction.png
│   ├── items/
│   │   ├── rings.png
│   │   ├── item-boxes.png
│   │   └── springs.png
│   ├── effects/
│   │   ├── explosions.png
│   │   ├── sparkles.png
│   │   └── dust-clouds.png
│   └── ui/
│       ├── hud-numbers.png
│       ├── hud-text.png
│       └── life-icons.png
├── tilesets/
│   ├── green-hill-zone.png
│   └── green-hill-objects.png
└── backgrounds/
    ├── ghz-sky.png
    ├── ghz-clouds.png
    └── ghz-mountains.png
```

---

## 🔨 Implementation Priority Order

### Phase 1: Visual Foundation (Week 1)
1. ✅ Download Sonic sprite sheet
2. ✅ Download Green Hill Zone tileset
3. ✅ Download ring sprites
4. ✅ Download HUD overlay
5. ⬜ Create sprite atlases
6. ⬜ Implement sprite loader in PreloadScene
7. ⬜ Replace player placeholder with Sonic sprites

### Phase 2: Gameplay Assets (Week 2)
8. ⬜ Download enemy sprites (Motobug, Crabmeat)
9. ⬜ Download item box sprites
10. ⬜ Download effect sprites (explosions, sparkles)
11. ⬜ Download small animal sprites
12. ⬜ Integrate enemies into game
13. ⬜ Add destruction effects

### Phase 3: Polish Assets (Week 3)
14. ⬜ Download background layers
15. ⬜ Download goal post sprites
16. ⬜ Download UI elements (title screen, game over, etc.)
17. ⬜ Implement parallax backgrounds
18. ⬜ Add stage title cards
19. ⬜ Polish all visual effects

---

## ⚖️ Licensing & Legal

### Important Notes
- **Original Assets**: Sonic the Hedgehog sprites are © SEGA
- **Fan Use**: The Spriters Resource hosts these for fan projects and educational use
- **Non-Commercial**: This project should remain non-commercial
- **Attribution**: Consider crediting SEGA and The Spriters Resource
- **Distribution**: Do not redistribute sprite sheets separately from the game

### Recommended Attribution
```
Sonic the Hedgehog © SEGA
Original sprites from Sonic the Hedgehog (1991) for Sega Genesis
Sprites sourced from The Spriters Resource (spriters-resource.com)
This is a non-commercial fan project for educational purposes
```

---

## 📚 Additional Resources

### Sonic Physics Guide
- **URL**: https://info.sonicretro.org/Sonic_Physics_Guide
- **Contains**: Complete physics documentation (already implemented)

### Sonic Retro Forums
- **URL**: https://forums.sonicretro.org/
- **Contains**: Community discussions, sprite rips, tile extractors
- **Use Case**: Technical questions, advanced sprite manipulation

### Sprite Animation Tools
- **Aseprite**: https://www.aseprite.org/ - Sprite editor and animator
- **Piskel**: https://www.piskelapp.com/ - Free online sprite editor
- **TexturePacker**: https://www.codeandweb.com/texturepacker - Create sprite atlases

---

## 🎯 Next Actions

### Immediate (Today)
1. Download Sonic character sprite sheet
2. Download Green Hill Zone tileset
3. Download ring animation sprites
4. Download HUD overlay sprites

### This Week
5. Create public/assets directory structure
6. Organize downloaded sprites into folders
7. Update PreloadScene.ts to load sprite sheets
8. Create Phaser sprite configurations
9. Replace placeholder graphics with real sprites

### Next Week
10. Download enemy sprites
11. Download item and effect sprites
12. Integrate all sprites into game scenes
13. Test all animations and visual elements

---

## 📝 Technical Notes

### Sprite Sheet Parsing
- Use Phaser's `this.load.spritesheet()` for grid-based sheets
- Use Phaser's `this.load.atlas()` for JSON-defined sprite atlases
- Consider creating custom JSON definitions for animation frames

### Animation Frame Rates
- Walking: ~8 FPS (frames change every 7-8 game frames at 60 FPS)
- Running: ~12 FPS (frames change every 5 game frames)
- Spinning: ~16 FPS (frames change every 4 game frames)
- Ring rotation: ~8 FPS

### Performance Considerations
- Combine small sprites into atlases to reduce draw calls
- Use texture packing tools to minimize memory usage
- Implement sprite culling for off-screen objects
- Cache frequently used animations

---

## ✅ Checklist

- [ ] Downloaded: Sonic character sprites
- [ ] Downloaded: Green Hill Zone tileset
- [ ] Downloaded: Ring sprites
- [ ] Downloaded: HUD overlay
- [ ] Downloaded: Enemy sprites (Motobug, Crabmeat)
- [ ] Downloaded: Item box sprites
- [ ] Downloaded: Spring sprites
- [ ] Downloaded: Effect sprites (explosions, sparkles)
- [ ] Downloaded: Background layers
- [ ] Downloaded: Goal post sprites
- [ ] Created: Asset directory structure
- [ ] Implemented: Sprite loading in PreloadScene
- [ ] Implemented: Sonic animations
- [ ] Implemented: Ring animations
- [ ] Implemented: Enemy animations
- [ ] Tested: All sprites display correctly in-game

---

**Last Updated**: 2025-11-06
**Status**: Ready for implementation
