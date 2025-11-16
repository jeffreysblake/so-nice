# Blockers to Address

Critical issues discovered during development. Most recent session: 2025-11-09 (physics debugging).

---

## 0. Collision Distance Calculation Bug ✅ RESOLVED

**Status**: ✅ FIXED (2025-11-09)

**Original Problem**:
- Player "bounces" uncontrollably - lands, gets pushed up, falls again (10-frame cycle)
- Collision correction overshoots by ~15 pixels instead of ~1 pixel
- Unit test confirms: distance returns 15 when it should return 1
- Causes player to never stay grounded, making acceleration impossible

**Root Cause**:
The collision distance formula in `CollisionManager.ts` was incorrect. The issue was a coordinate system mismatch:
- Tile height values are measured bottom-up (height from bottom edge)
- World coordinates are measured top-down (Y increases downward)
- The formula didn't properly convert between these two systems

**The Fix**:
```typescript
// OLD (BROKEN):
distance = localY - surfaceY;  // Returns 15 for 1px penetration

// NEW (FIXED):
const rawDistance = this.tileSize - height + localY;
distance = Math.abs(rawDistance);
collided = localY >= surfaceY;
```

**Additional Fix - Adjacent Tile Detection**:
Changed return logic to detect surfaces within maxDistance even when not currently colliding:
```typescript
// Return if we found a surface within maxDistance (whether colliding or not)
if (Math.abs(result.distance) < maxDistance) {
  return result;
}
```

**Results**:
- ✅ Debug test passing: Distance correctly returns 1 for 1px penetration
- ✅ All 20 CollisionManager tests passing
- ✅ Player now stays grounded and accelerates properly
- ✅ Test improvement: From 36→26 failing tests (366 passing)

**Files Modified**:
- `src/terrain/CollisionManager.ts:158-163` - Fixed distance formula
- `src/terrain/CollisionManager.ts:107` - Fixed adjacent tile detection
- `src/__tests__/debug-collision.test.ts` - Verified fix with unit test

---

## 1. Sonic Sprite Rendering Issues

**Status**: Partially Fixed - Needs Verification

**Problem**:
- Sonic displays as a green/colored rectangle instead of proper sprite
- Frame coordinates in `src/config/SonicAnimations.ts` were updated to use 78x78 pixel boxes
- Need to verify if sprites are actually rendering correctly or if there are additional issues

**Root Cause**:
- Spritesheet from Spriters Resource has sprites in 78x78 boxes with green borders
- Original coordinates (x:8, y:8, etc.) were pointing to header/background area
- Updated to correct box positions (x:24, y:243, etc.) but needs visual confirmation

**Files Affected**:
- `src/config/SonicAnimations.ts` - Frame coordinate definitions
- `src/scenes/PreloadScene.ts` - Sprite loading and initialization
- `public/assets/sprites/sonic/sonic-spritesheet.png` - Source asset

**Next Steps**:
1. Run game manually to visually verify Sonic renders correctly
2. If still showing rectangle, may need to:
   - Trim green borders from spritesheet
   - Adjust sprite extraction logic to skip borders
   - Create sprite atlas JSON for more precise frame definitions

---

## 2. Missing Green Hill Zone Tileset Graphics & Level Design

**Status**: Critical - Not Implemented

**Problem**:
- Level appears as basic rectangles and shapes, no authentic Green Hill Zone visuals
- Green Hill Zone tileset exists at `public/assets/tilesets/green-hill-zone.png` but NOT being used
- Loop-de-loops don't exist or aren't properly implemented
- Level design is minimal/broken - only extends ~100 pixels before becoming unplayable

**Current Behavior**:
- Terrain is drawn programmatically using `Phaser.GameObjects.Graphics`
- All platforms, slopes, and terrain use basic colored shapes (brown rectangles, triangles)
- No texturing or visual detail from the authentic Green Hill Zone tileset
- No recognizable Green Hill Zone features (loops, springs, checkered terrain)
- Level has gaps that cause instant death
- Cannot progress more than ~100 pixels into the level

**Root Cause**:
- Terrain system in `src/terrain/` uses mathematical curve generation
- No integration between loaded tileset and terrain rendering
- Missing tile mapping/placement system
- Incomplete level design - no proper layout created
- Loop-de-loop geometry may not be implemented correctly

**Files Affected**:
- `src/terrain/TerrainBuilder.ts` - Terrain generation logic
- `src/terrain/Slope.ts` - Slope rendering
- `src/terrain/Platform.ts` - Platform rendering
- `src/scenes/GameScene.ts` - Level layout definition
- `public/assets/tilesets/green-hill-zone.png` - Unused asset

**Next Steps**:
1. Implement tile-based rendering system
2. Map terrain geometry to tileset graphics
3. Apply proper tile textures to platforms and slopes (checkered grass, brown dirt, etc.)
4. Add background layers from Green Hill Zone (sky, clouds, mountains)
5. Design a complete, playable level layout (at least first section of Act 1)
6. Fix/implement loop-de-loop geometry properly
7. Remove or fix deadly gaps in terrain
8. Ensure level extends far enough for actual gameplay

---

## 3. Rings Using Programmatic Graphics Instead of Sprites

**Status**: Not Implemented

**Problem**:
- Rings are drawn using `Phaser.GameObjects.Graphics.fillCircle()`
- Appear as solid yellow circles instead of authentic Sonic ring sprites
- No rotation animation

**Current Implementation** (`src/entities/Ring.ts:30-50`):
```typescript
this.graphics.fillStyle(0xffff00, 1);
this.graphics.fillCircle(0, 0, outerRadius);
// ... draws yellow circle programmatically
```

**Expected Behavior**:
- Use actual ring sprite from Sonic 1
- Animated rotation frames
- Sparkle/shine effect

**Missing Assets**:
- `public/assets/sprites/items/rings.png` - Directory exists but empty (only .gitkeep)

**Files Affected**:
- `src/entities/Ring.ts` - Ring rendering logic
- `scripts/setup-sprites.js` - Asset download script (mentions rings as optional)

**Next Steps**:
1. Download authentic Sonic ring sprites
2. Replace Graphics rendering with sprite-based system
3. Implement rotation animation
4. Add collection sparkle effect

---

## 4. Enemies Using Programmatic Graphics Instead of Sprites

**Status**: Not Implemented

**Problem**:
- Motobug and Crabmeat enemies drawn using Graphics primitives
- Appear as simple colored shapes (black/red ellipses)
- No authentic sprite appearance or animations

**Current Implementation**:
- `src/entities/Motobug.ts:23-52` - Draws black ellipses programmatically
- `src/entities/Crabmeat.ts` - Similar programmatic drawing
- No sprite sheets loaded for enemies

**Missing Assets**:
- `public/assets/sprites/enemies/badniks.png` - Directory exists but empty (only .gitkeep)

**Files Affected**:
- `src/entities/Motobug.ts`
- `src/entities/Crabmeat.ts`
- `scripts/setup-sprites.js` - Asset download script mentions badniks

**Next Steps**:
1. Download Motobug and Crabmeat sprites from Spriters Resource
2. Replace Graphics rendering with sprite-based entities
3. Implement walking animations
4. Add destruction animation when defeated

---

## 5. Playwright Test Configuration Issues

**Status**: Fixed

**Problem**:
- Tests were connecting to wrong application (AI Chat Platform on port 5173)
- Vite dev server configured for port 3000 but already in use
- Playwright configured for port 5173 (different app)
- **CRITICAL**: Unlimited parallel workers caused system lockup/reboot
  - `fullyParallel: true` ran all test files simultaneously
  - `workers: undefined` spawned multiple workers (CPU cores)
  - Each worker ran full Phaser game at 60 FPS
  - Video recording consumed excessive memory/disk I/O
  - No test timeouts allowed runaway tests
  - No explicit cleanup of browser instances

**Solution Applied**:
- Changed both configs to use port 5174 (available)
- Tests now correctly connect to Sonic game
- **Resource Management Fixes (2025-11-09)**:
  - Limited workers to 1 to prevent multiple game instances
  - Disabled `fullyParallel` - tests run sequentially
  - Disabled video recording (`video: 'off'`)
  - Added 30s timeout per test
  - Added 10s action timeout
  - Added 15s navigation timeout
  - Added explicit `afterEach` cleanup in all test files
  - **Parallel Test Configuration**:
    - Vitest (unit tests) run in parallel using all CPU cores (safe - no game instances)
    - Playwright (E2E tests) default to 1 worker (safe - prevents lockup)
    - Added `PLAYWRIGHT_WORKERS` environment variable for scaling
    - Added `npm run test:e2e:2` script to test with 2 workers
    - To scale: `PLAYWRIGHT_WORKERS=2 npm run test:e2e` or use `npm run test:e2e:2`
  - **Per-Test Timeout Configuration**:
    - Default timeout: 30s (sufficient for basic tests)
    - Long navigation tests: 45-90s timeouts
    - Tests requiring level navigation past 1750px+ will FAIL until level is fixed
    - Added WARNING notes in tests that depend on complete level

**Files Modified**:
- `playwright.config.ts:11,19-26,40,42-46` - Resource limits, env var config, and timeouts
- `vitest.config.ts:8-11` - Explicit parallel execution for unit tests
- `package.json:16` - Added test:e2e:2 script
- `tests/e2e/01-basic-movement.spec.ts:18-21` - Added afterEach cleanup
- `tests/e2e/02-jumping.spec.ts:14-17` - Added afterEach cleanup
- `tests/e2e/03-loops-and-gravity.spec.ts:18-21,68,124` - Added afterEach cleanup, per-test timeouts
- `tests/e2e/04-springs.spec.ts:18-21,23,50,86,110,139` - Added afterEach cleanup, per-test timeouts

---

## 6. Game Mechanic Failures (Critical Gameplay Bugs)

**Status**: Critical - Game Breaking

**Problems Found**:

### A. Constant Jumping Bug
**User Report**: Player constantly/uncontrollably jumps
- Cannot progress normally through level
- Combined with terrain gaps, makes game unplayable after ~100 pixels
- **Severity**: CRITICAL - Breaks core gameplay

**Possible Causes**:
- Jump key stuck/repeating
- Jump logic not checking for grounded state properly
- Input handling bug causing automatic jumps

**Files to Investigate**:
- `src/entities/Player.ts:36-37` - Jump key input
- `src/entities/Player.ts` - Jump logic and grounded checks

### B. Deadly Gap in Terrain
**User Report**: Gap in level causes instant death, cannot progress past ~100 pixels
- Player falls through gap and dies
- Combined with jumping bug, makes progress impossible
- **Severity**: CRITICAL - Blocks all gameplay

**Files to Investigate**:
- `src/terrain/TerrainBuilder.ts` - Terrain layout generation
- `src/scenes/GameScene.ts` - Level design

### C. Debug Overlay Not Displaying (Test Failure)
- Test: `should show player starting position in debug overlay`
- Expected: Text like "Pos: (x, y)" and "Ground Speed: X"
- Actual: Empty string (only unicode characters "············")
- File: `tests/e2e/01-basic-movement.spec.ts:38`

### D. Player Movement Not Working in Tests
- Test: `should accelerate when holding right arrow`
- Expected: Speed > 0 after holding right arrow for 1 second
- Actual: Speed remains 0
- File: `tests/e2e/01-basic-movement.spec.ts:62`

### E. Deceleration Not Working in Tests
- Test: `should decelerate when releasing arrow keys`
- Expected: Speed decreases after releasing keys
- Actual: Speed stays at 0
- File: `tests/e2e/01-basic-movement.spec.ts:91`

### F. Jump Velocity Not Working in Tests
- Test: `should jump when pressing Z key`
- Expected: Y velocity < 0 (moving upward)
- Actual: Y velocity = 0
- File: `tests/e2e/02-jumping.spec.ts:32`

**Root Cause**: Multiple issues
- Constant jumping suggests input or state machine bug
- Test failures may be Playwright-specific input simulation issues
- Terrain gaps indicate incomplete level design
- Debug overlay may have rendering issues

**Files to Investigate**:
- `src/entities/Player.ts` - Player input, jump logic, and physics
- `src/scenes/GameScene.ts` - Debug overlay rendering, level design
- `src/config/PhysicsConstants.ts` - Physics values
- `src/terrain/TerrainBuilder.ts` - Level layout and gaps

---

## 7. Spritesheet Documentation Issues

**Status**: Needs Improvement

**Problem**:
- Spritesheet coordinates were wildly incorrect
- No documentation of actual sprite layout
- Comments said "approximate and may need adjustment" but gave completely wrong values

**Files Affected**:
- `src/config/SonicAnimations.ts:8` - Warning comment about coordinates

**Next Steps**:
1. Document the actual spritesheet layout
2. Add comments showing the 78x78 box grid structure
3. Consider creating a sprite atlas JSON file for better organization
4. Add visual reference or coordinate map

---

## 8. Asset Download Script Incomplete

**Status**: Functional but Limited

**Problem**:
- `scripts/setup-sprites.js` guides users to download Sonic sprites
- `scripts/download-sprites.js` attempts automated download but requires manual intervention
- Rings and badnik sprites marked as "optional" but needed for authentic experience

**Files**:
- `scripts/setup-sprites.js` - Interactive guide
- `scripts/download-sprites.js` - Automated attempt

**Next Steps**:
1. Complete automated download for all required sprites
2. Add ring and badnik sprites to required downloads
3. Validate downloaded files match expected dimensions
4. Add sprite trimming/processing if needed

---

## 9. Missing Player Stories for Level Completion

**Status**: Not Implemented

**Problem**:
- No user stories defined for completing sections of the level
- No acceptance criteria for level progression milestones
- No tests for navigating through specific level features (loops, springs, etc.)
- Cannot test specific sections of the level in isolation

**Current State**:
- Existing tests focus on basic mechanics (movement, jumping) in isolation
- No tests for actual level progression or section completion
- No way to drop player at specific map location for testing specific sections

**Needed Player Stories** (Examples):

1. **Story: Navigate First Flat Section**
   - As a player, I want to run through the first flat section of Green Hill Zone
   - Acceptance Criteria:
     - Player starts at x:0, y:ground
     - Can run forward for at least 500 pixels
     - No gaps or obstacles block progress
     - Collect at least 3 rings
     - Reach checkpoint or transition point

2. **Story: Complete First Loop-de-Loop**
   - As a player, I want to navigate through the iconic loop-de-loop
   - Acceptance Criteria:
     - Player approaches loop with sufficient speed
     - Physics correctly handles upside-down gravity
     - Player maintains speed through loop
     - Player exits loop successfully
     - No clipping or falling through terrain

3. **Story: Spring Boost to Upper Path**
   - As a player, I want to use a spring to reach the upper path
   - Acceptance Criteria:
     - Spring is positioned correctly
     - Spring launches player with correct force
     - Player reaches upper platform
     - Can continue gameplay on upper path

4. **Story: Defeat Motobug Enemy**
   - As a player, I want to defeat a Motobug enemy
   - Acceptance Criteria:
     - Motobug patrols correctly
     - Jump on Motobug destroys it
     - Motobug damages player on collision from side
     - Score increases on defeat

5. **Story: Reach Act 1 Goal Post**
   - As a player, I want to complete Green Hill Zone Act 1
   - Acceptance Criteria:
     - Navigate through complete level layout
     - Reach goal post at end
     - Goal post triggers completion sequence
     - Score calculated correctly
     - Time bonus applied

**Testing Infrastructure Needed**:

### Player Spawn System
- Add ability to spawn player at specific (x, y) coordinates
- Configuration option for test scenarios
- Example usage:
  ```typescript
  // Spawn player at loop entrance for testing
  const player = new Player(scene, 1200, 400);

  // Or use test helper
  spawnPlayerForTest(scene, 'LOOP_ENTRANCE');
  ```

### Named Checkpoints/Locations
- Define named locations in level for testing
- Map to actual coordinates
- Examples:
  ```typescript
  const LEVEL_CHECKPOINTS = {
    START: { x: 100, y: 625 },
    FIRST_LOOP: { x: 1200, y: 400 },
    UPPER_PATH: { x: 2000, y: 300 },
    SPRING_SECTION: { x: 1500, y: 625 },
    GOAL_POST: { x: 5000, y: 625 }
  };
  ```

### Section-Based Tests
- Break level into testable sections
- Each section has its own test file
- Example test structure:
  ```
  tests/e2e/level-sections/
    01-opening-run.spec.ts
    02-first-loop.spec.ts
    03-spring-platforms.spec.ts
    04-enemy-section.spec.ts
    05-goal-post.spec.ts
  ```

**Files to Create/Modify**:
- `docs/PLAYER_STORIES.md` - Document all player stories with acceptance criteria
- `src/utils/TestHelpers.ts` - Player spawn utilities for testing
- `src/config/LevelCheckpoints.ts` - Named checkpoint locations
- `tests/e2e/level-sections/` - New test directory for section-based tests
- `src/scenes/GameScene.ts` - Add support for spawn location parameter

**Next Steps**:
1. Define complete set of player stories for Green Hill Zone Act 1
2. Map out level sections and checkpoint coordinates
3. Implement player spawn system for testing
4. Create section-based E2E tests
5. Ensure each section is playable and testable independently
6. Document acceptance criteria for each story
7. Use stories to drive level design and feature implementation

---

## Priority Order for Next Session

1. **CRITICAL - Game Breaking Bugs** (Must fix to make game playable):
   - Fix constant/uncontrolled jumping bug
   - Fix deadly gap in terrain (complete level layout)
   - Ensure player can progress at least 500+ pixels through level
   - Verify basic movement works (walk, run, jump)

2. **High Priority - Core Gameplay & Level Design**:
   - Implement proper Green Hill Zone level design (at least first section)
   - Add loop-de-loops with correct physics
   - Ensure terrain is continuous with no death gaps
   - Fix player movement issues observed in tests
   - Define player stories for level progression
   - Implement player spawn system for testing sections

3. **High Priority - Visual Quality**:
   - Verify and fix Sonic sprite rendering
   - Implement Green Hill Zone tileset for terrain (replace brown rectangles)
   - Add checkered grass, brown dirt textures
   - Add background layers (sky, clouds, mountains)

4. **Medium Priority - Testing Infrastructure**:
   - Create player stories document with acceptance criteria
   - Implement named checkpoint/spawn system
   - Create section-based E2E tests
   - Enable testing level sections independently

5. **Medium Priority - Visual Polish**:
   - Replace programmatic rings with sprites
   - Replace programmatic enemies with sprites
   - Add particle effects and visual feedback

6. **Low Priority - Infrastructure**:
   - Fix debug overlay not displaying
   - Improve sprite coordinate documentation
   - Complete asset download automation
   - Add sprite atlas system for better frame management

---

## Testing Notes

**How to Reproduce Issues**:

### Manual Testing (npm run dev):
1. **Constant Jumping Bug**:
   - Run `npm run dev`
   - Load game
   - Observe: Sonic constantly jumps without input
   - Cannot control movement properly

2. **Deadly Gap / Limited Level**:
   - Run `npm run dev`
   - Try to move right
   - After ~100 pixels, encounter gap that causes death
   - Cannot progress further

3. **Tileset Missing**:
   - Look at terrain - should see Green Hill Zone checkered grass
   - Actually see: Brown rectangles and basic shapes

4. **Programmatic Graphics**:
   - Observe rings (yellow circles instead of animated sprites)
   - Observe enemies (simple red/black shapes instead of Motobug/Crabmeat sprites)

### Automated Testing (npm run test:e2e):
5. **Movement Issues**:
   - Run `npm run test:e2e`
   - Multiple tests fail with speed = 0
   - Jump tests fail with velocity = 0

**Test Screenshots Available**:
- Location: `test-results/*/test-failed-1.png`
- Show current state with Sonic sprite (may still be colored rectangle)
- Show programmatic graphics for rings and enemies
- Show brown rectangle terrain
- Show level layout with limited progression

---

## Assets Status Summary

| Asset | Path | Status | Size |
|-------|------|--------|------|
| Sonic Spritesheet | `public/assets/sprites/sonic/sonic-spritesheet.png` | ✓ Exists | 109 KB (690x1558px) |
| GHZ Tileset | `public/assets/tilesets/green-hill-zone.png` | ✓ Exists (unused) | Unknown |
| HUD Overlay | `public/assets/sprites/ui/hud-overlay.png` | ✓ Exists | Unknown |
| Rings | `public/assets/sprites/items/rings.png` | ✗ Missing | - |
| Badniks | `public/assets/sprites/enemies/badniks.png` | ✗ Missing | - |
| Effects | `public/assets/sprites/effects/*` | ✗ Missing | - |

---

## Reference Links

- **Spriters Resource - Sonic 1**: https://www.spriters-resource.com/sega_genesis_32x/sonicth1/
- **Green Hill Zone Tiles**: https://www.spriters-resource.com/sega_genesis_32x/sonicth1/sheet/27190/
- **Current Session Notes**: See git history around 2025-11-09

---

Last Updated: 2025-11-09
Session: Sprite Loading Debug & Analysis
