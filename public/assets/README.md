# Game Assets

This directory contains all visual assets for the Sonic platformer clone.

## 📥 Required Downloads

You need to download sprite sheets from **The Spriters Resource** to populate these folders.

### Quick Download Links

#### Priority 1: Essential Assets (Download First)
1. **Sonic Character Sprites**
   - Link: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/21628/
   - Save as: `sprites/sonic/sonic-spritesheet.png`

2. **Green Hill Zone Tileset & Ending**
   - Link: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/27190/
   - Save as: `tilesets/green-hill-zone.png`

3. **HUD Overlay**
   - Link: https://www.spriters-resource.com/genesis_32x_scd/sonicth1/sheet/37424/
   - Save as: `sprites/ui/hud-overlay.png`

#### Priority 2: Gameplay Assets (Download Next)
4. **Badniks (Enemies)**
   - Link: https://www.spriters-resource.com/sega_genesis/sonicth1/ (find "Badniks" sheet)
   - Save as: `sprites/enemies/badniks.png`

5. **Rings & Objects**
   - Link: https://www.spriters-resource.com/sega_genesis/sonicth1/ (find "Stage Objects" section)
   - Save rings as: `sprites/items/rings.png`
   - Save item boxes as: `sprites/items/item-boxes.png`
   - Save springs as: `sprites/items/springs.png`

#### Priority 3: Polish Assets (Optional)
6. **Backgrounds**
   - Link: https://www.spriters-resource.com/sega_genesis/sonicth1/ (find "Backgrounds" section)
   - Save sky/clouds as: `backgrounds/ghz-sky.png`
   - Save mountains as: `backgrounds/ghz-mountains.png`

7. **Effects**
   - Link: https://www.spriters-resource.com/sega_genesis/sonicth1/ (find "Miscellaneous" section)
   - Save explosion effects as: `sprites/effects/explosions.png`
   - Save sparkles as: `sprites/effects/sparkles.png`

## 📂 Directory Structure

```
assets/
├── sprites/
│   ├── sonic/          # Sonic character animations
│   ├── enemies/        # Enemy robots (Motobug, Crabmeat, etc.)
│   ├── items/          # Rings, item boxes, springs
│   ├── effects/        # Explosions, sparkles, dust clouds
│   └── ui/             # HUD, numbers, text, life icons
├── tilesets/           # Level tiles and terrain
└── backgrounds/        # Parallax background layers
```

## 🚀 Quick Setup

### Option 1: Interactive Setup (Recommended)
```bash
npm run setup-sprites
```
This interactive script will:
- Guide you through downloading each sprite
- Open browser links for you to click download
- Verify files are saved correctly
- Show installation status

### Option 2: Manual Download
1. Visit each link above
2. Click the download button on The Spriters Resource
3. Save PNG file to the specified location in this directory

### Option 3: Automated Download (May Not Work)
```bash
npm run download-sprites
```
Note: Automated download may fail due to website protections. Use Option 1 if this doesn't work.

## ⚠️ Important Notes

- **DO NOT commit sprite files to git** - They are copyrighted by SEGA
- The `.gitignore` file excludes `public/assets/**/*.png`
- Each developer must download sprites individually
- Keep original file names from Spriters Resource for consistency

## 📋 Checklist

After downloading, you should have:
- [ ] `sprites/sonic/sonic-spritesheet.png` (Sonic character)
- [ ] `tilesets/green-hill-zone.png` (Level tiles)
- [ ] `sprites/ui/hud-overlay.png` (Score, rings, time display)
- [ ] `sprites/enemies/badniks.png` (Motobug, Crabmeat)
- [ ] `sprites/items/rings.png` (Collectible rings)
- [ ] `sprites/items/item-boxes.png` (Power-ups)
- [ ] `sprites/items/springs.png` (Yellow and red springs)
- [ ] `sprites/effects/explosions.png` (Enemy destruction)
- [ ] `backgrounds/ghz-sky.png` (Background layer)
- [ ] `backgrounds/ghz-mountains.png` (Background layer)

## 🎨 Sprite Specifications

- **Format**: PNG with transparency
- **Color Depth**: Original Genesis uses 16 colors per sprite
- **Sonic Sprite**: ~20x32 pixels (varies by pose)
- **Tile Size**: 16x16 pixels
- **Ring**: 8x8 pixels
- **Item Box**: 16x16 pixels

## 📖 More Information

See [SPRITE_RESOURCES.md](../../SPRITE_RESOURCES.md) in the project root for:
- Complete sprite list with descriptions
- Animation frame specifications
- Implementation priorities
- Licensing information
- Technical integration details

## ⚖️ Legal

Sonic the Hedgehog © SEGA. Sprites are for non-commercial fan projects and educational use only. Do not redistribute sprites separately from this project.
