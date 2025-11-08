# Critical Bugs Identified

**Date:** 2025-11-08
**Status:** Needs immediate attention
**Severity:** Game-breaking bugs preventing normal gameplay

---

## ✅ Bug #1: Enemy Speed 16x Too Fast (FIXED)

**Status:** FIXED ✅
**Severity:** Critical
**Impact:** Enemies impossible to avoid, gameplay broken

### Root Cause
Enemies were multiplying `speed * delta`, but `delta` is in milliseconds (16-17ms) rather than normalized frames.

**Locations Fixed:**
- `src/objects/Motobug.ts:58` - ✅ Normalized delta
- `src/objects/Crabmeat.ts:84` - ✅ Normalized delta

### Fix Applied
```typescript
// Normalize delta from milliseconds to frames (60 FPS standard)
const deltaNormalized = delta / (1000 / 60);

this.walkTimer += deltaNormalized;
this.x += this.direction * this.speed * deltaNormalized;
```

### Expected Behavior (Now Correct)
- Motobug speed: 1.0 px/frame = 60px/second ✅
- Crabmeat speed: 0.8 px/frame = 48px/second ✅

### Testing
Requires visual verification - Playwright visual tests cannot run in this headless environment (see LEARNINGS.md #0)

---

## 🔴 Bug #2: Continuous Jumping (Suspected)

**Severity:** Critical
**Impact:** Player cannot control jumping, unplayable

### Reported Behavior
- Player continuously jumps without key press
- Cannot stop jumping
- Makes crossing gaps impossible

### Suspected Causes

**Theory 1: JustDown Polling Issue**
```typescript
// src/entities/Player.ts:500
if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && ...)
```

`Phaser.Input.Keyboard.JustDown()` might be triggering every frame if:
- Key is not properly released
- Input state not being cleared
- Called outside of update loop context

**Theory 2: isGrounded State Bug**
If `isGrounded` is constantly true even in air, jump would trigger repeatedly.

**Theory 3: Death/Respawn Loop**
Player might be dying and respawning continuously:
```typescript
// src/entities/Player.ts:631
if (this.y > 700) {
  this.die();
}
```

If spawn point is at y > 700, instant death loop.

### Fix Required
1. Add logging to `checkJump()` to verify call frequency
2. Verify `isGrounded` state during jump
3. Check spawn position (should be < 700)
4. Consider using `wasJustPressed` flag instead of `JustDown`

### Testing
Run Playwright test `25-continuous-jump-bug-*.png` to verify player Y position changes without input.

---

## 🟡 Bug #3: Sprite Not Loading (USER ACTION REQUIRED)

**Status:** Identified - User must run setup script ⚠️
**Severity:** Medium
**Impact:** Visual only, game playable but looks wrong

### Reported Behavior
- Sonic sprite shows as a box (blue circle placeholder)
- User sees box instead of Sonic character

### Root Cause CONFIRMED ✅
**Assets directory does not exist** - `assets/sprites/sonic/` not found

The PreloadScene creates a placeholder when sprites fail to load (PreloadScene.ts:91-98):
```typescript
private createPlaceholderSonic() {
  const graphics = this.add.graphics();
  graphics.fillStyle(0x0066ff, 1);
  graphics.fillCircle(16, 16, 16);
  graphics.generateTexture('sonic-placeholder', 32, 32);
  graphics.destroy();
}
```

### User Action Required ⚠️
Run the sprite setup script:
```bash
npm run setup-sprites
```

This will download or prompt to download the Sonic sprites from Spriters Resource.

### Verification After Setup
Check console for:
```
Sprite loading status:
  Sonic: ✓
  Tileset: ✓
  HUD: ✓
```

### Technical Notes
- Sprites are loaded from `assets/sprites/sonic/sonic-spritesheet.png` (PreloadScene.ts:53)
- Fallback placeholder ensures game is playable even without sprites
- Assets not checked into git (too large, copyright concerns)

---

## 🟡 Bug #4: Level Size Claims vs Reality

**Severity:** Medium (Documentation issue)
**Impact:** False advertising, user expectations not met

### Claimed
- "Full Green Hill Zone level (3840x672 world)"
- "Multiple loops and curves"

### Need to Verify
1. Actual playable level width
2. Number of loops implemented
3. Terrain variety

### Testing
Run Playwright tests:
- `12-level-exploration-*.png` (10 screenshots over 20 seconds)
- `27-level-right-boundary.png`
- `28-level-left-boundary.png`

Measure actual pixels traveled vs claimed 3840px.

---

## 🟡 Bug #5: Tileset Visual Quality

**Severity:** Low
**Impact:** Doesn't look like Green Hill Zone

### Reported
- "tiling doesn't seem to match the green hill zone AT ALL"

### Need to Verify
1. Are actual GHZ sprites being used?
2. Or programmer art/placeholder tiles?
3. Tile arrangement and patterns

### Testing
Review screenshots:
- `14-terrain-tileset.png`
- `15-terrain-mid-level.png`

Compare to reference: [Green Hill Zone on Sonic Retro](https://info.sonicretro.org/Green_Hill_Zone)

---

## 🟢 Bug #6: Jump Functionality Broken

**Severity:** Critical (if true)
**Impact:** Cannot cross gaps, level uncompletable

### Reported
- "no way to cross" gaps
- "jump functionality is broken"

### Needs Investigation
- Is this caused by continuous jumping?
- Or is jump height insufficient?
- Or are gaps too wide for intended jump arc?

### Testing
Run Playwright test `06-before-jump.png` through `08-after-jump.png`
Verify:
1. Player Y position changes on Z key press
2. Jump arc looks reasonable
3. Jump height matches expected physics

---

## Priority Action Items

### Immediate (Game-Breaking)
1. ✅ Create Playwright visual tests (DONE)
2. ⏳ Fix enemy speed (16x too fast) - **NEXT**
3. ⏳ Investigate continuous jumping bug
4. ⏳ Fix jump if broken

### High Priority (Major Issues)
5. ⏳ Verify sprite loading works in user's environment
6. ⏳ Document actual level size (not claims)
7. ⏳ Test level completion end-to-end

### Medium Priority (Polish)
8. ⏳ Assess tileset visual quality
9. ⏳ Update documentation to match reality
10. ⏳ Add gap traversal tutorial/hints

---

## How to Run Visual Tests

```bash
# Start dev server
npm run dev

# In another terminal, run visual tests
npm run test:e2e -- tests/e2e/05-visual-verification.spec.ts

# Check screenshots
ls -la test-results/screenshots/
```

Screenshots will document actual vs claimed state.

---

## Next Steps

1. Run Playwright visual tests to capture current state
2. Analyze screenshots to confirm/deny reported bugs
3. Fix critical bugs (enemy speed, continuous jump)
4. Re-test with visual verification
5. Update documentation to match actual state
6. Be more careful about verifying claims before documenting

**Lesson Learned:** Always run the game locally and take screenshots before making claims about implementation state!
