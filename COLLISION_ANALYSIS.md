# Collision System Analysis - Comparison with Reference Implementations

## Executive Summary

After analyzing three reference Sonic implementations (RSDKv4, Sonic 3 AIR, OpenSurge), I've identified critical gaps in our collision system that explain the X=890 terrain bug and suggest improvements.

## Reference Implementation Key Findings

### 1. RSDKv4 (Official Sonic 1 Decompilation)
**Architecture:**
- **6-7 collision sensors** per entity (not just 2!)
- Positioned dynamically based on player state and rotation
- **Search depth: 3 tiles (48 pixels)** downward from each sensor
- **Collision tolerance: 8-15 pixels** to prevent jitter on slopes

**Data Structure:**
- 16 height values per tile (one per pixel X) - ✅ We have this
- 4-bit precision per height - ✅ We have this
- **Two collision planes** (Path A and B) - ❌ We don't have this
- Fixed-point math for determinism - ❌ We use floating point

**Critical Algorithm Details:**
```cpp
// FindFloorPosition() - Core search algorithm
1. Position sensors based on collision mode (floor, wall, roof, rwall)
2. Search up to 3 tiles downward (48 pixels) from each sensor
3. Look up tile data: chunk → tile index → collision mask
4. Extract height value (16 per tile, one per pixel X)
5. Return both height and surface angle for slope handling
6. Validate against tolerance to prevent jitter
```

### 2. Sonic 3 AIR
**Architecture:**
- **Two-sensor approach** positioned at character hitbox edges - ✅ Similar to ours
- Angle lookup + indent tables for pixel-perfect heights - ✅ We have this
- 256-value rotation system (0x00-0xff = 360°) - ❌ We use degrees
- Smooth angle snapping within 0x20 degrees for gradual slopes

**Key Insight:** Two sensors CAN work, but must be:
- Positioned at the EDGES of the hitbox (not just left/right of center)
- Continuously adjusted based on player rotation
- Checked EVERY frame with proper tolerance

### 3. OpenSurge (Modern Open-Source)
**Architecture:**
- **Pre-computed ground maps** for O(1) detection - ❌ We don't have this
- Multiple sensors (A, B, C, D, M, N) around player - ❌ We have 2
- **Spatial partitioning** (64-pixel buckets) - ❌ We search all tiles
- Layer-based collision for loops - ❌ We have single layer

**Performance Optimizations:**
```c
// O(1) ground detection using pre-computed heightmap
height = gmap[pitch*y + x];  // Single array lookup!
```

Instead of scanning tiles each frame, ground maps are computed once at level load.

## Our Implementation Gaps

### Critical Issue #1: Sensor Search Algorithm Bug ⚠️

**File:** `src/terrain/CollisionManager.ts:62-117`

**Current Code:**
```typescript
for (let i = 0; i < tilesToCheck; i++) {
  const result = this.checkTileCollision(...);

  // BUG: Returns FIRST surface within maxDistance
  if (Math.abs(result.distance) < maxDistance) {
    return result;
  }
}
```

**Problem:** We return the **first** tile with a surface within `maxDistance`, not the **closest** surface! This causes:
- False positives when scanning past gaps
- Missing collision on slopes when tiles are spread vertically
- Incorrect ground snapping on transitions

**What RSDKv4 does:**
- Searches ALL tiles within range
- Tracks the CLOSEST surface
- Returns null only if NO surfaces found within tolerance
- Applies collision ONLY if distance < 14 pixels

### Critical Issue #2: Incomplete Half-Pipe Geometry 🏗️

**File:** `src/terrain/TerrainManager.ts:380-406`

**Problem:** The half-pipe exit curves don't connect to the flat exit section!

```typescript
// Exit curves - tiles 54-56
for (let i = 0; i < 3; i++) {
  const x = startX + 7 + i;  // x = 54, 55, 56
  const y = baseY + 3 - i;   // y = 44, 43, 42  ← Stops at 42!
}

// Flat exit (tiles 57-59)
this.buildFlatSection(startX + 10, 3, baseY);  // y = 41  ← Gap!
```

**Tile 56 is at Y=42, Tile 57 is at Y=41** → 1-tile vertical gap at X=896!

Sonic reaches X=890 (tile 55), but because the collision detection bug returns early, he doesn't properly detect the slope and falls through the gap.

### Issue #3: Only 2 Sensors vs 6-7 in Reference Implementations

**Our Code:** `CollisionManager.checkGroundSensors()` uses only 2 sensors

**RSDKv4 uses:**
- 3 sensors along bottom edge (left, center, right)
- 1 lead sensor ahead in movement direction
- 2 additional sensors for wall detection
- Dynamic positioning based on rotation

**Why this matters:**
- With 2 sensors, small gaps between tiles can be missed
- Corners and edges require more coverage
- Slopes need lead sensor to prevent sudden drops

### Issue #4: No Collision Tolerance System

**RSDKv4:** Only applies collision if distance is **-14 to +14 pixels**

**Our Code:** No tolerance - any collision immediately snaps player

**Result:**
- Jittery movement on slopes
- Unwanted snapping to distant surfaces
- Poor handling of tile transitions

## Root Cause of X=890 Bug

**Combined failure of Issues #1 and #2:**

1. **Geometry gap** at X=896 between tiles 56 and 57
2. **Sensor bug** returns first surface within 32px range, not closest
3. At X=890, sensor finds tile 55 at Y=43 (world Y=688-704)
4. Sonic is at Y=636, distance = 636-688 = -52px (above surface)
5. Because |−52| > 32px maxDistance, sensor returns "no collision"
6. Sonic falls through the gap

**Why tile 55 detection fails:**
- Sonic Y=636 is in tile row 39 (624-640)
- Tile 55 is at grid position (55, 43) = world Y 688-704
- Distance from Sonic to tile surface: 52-68 pixels
- This exceeds maxDistance=32, so sensor returns no collision
- Sonic continues falling

## Recommended Fixes

### Fix 1: Correct Sensor Search Algorithm (HIGH PRIORITY)
```typescript
castSensor(...): SensorResult {
  let closestResult: SensorResult = {
    distance: maxDistance,
    angle: 0,
    collided: false
  };

  for (let i = 0; i < tilesToCheck; i++) {
    const result = this.checkTileCollision(...);

    // Track CLOSEST surface, not first
    if (Math.abs(result.distance) < Math.abs(closestResult.distance)) {
      closestResult = result;
    }
  }

  // Apply collision only within tolerance (per Sonic Physics Guide)
  closestResult.collided = Math.abs(closestResult.distance) <= 14;
  return closestResult;
}
```

### Fix 2: Bridge Half-Pipe Gap (HIGH PRIORITY)
```typescript
// Exit curves - need 4 tiles, not 3!
for (let i = 0; i < 4; i++) {  // Changed from 3 to 4
  const x = startX + 7 + i;  // x = 54, 55, 56, 57
  const y = baseY + 3 - i;   // y = 44, 43, 42, 41  ← Now connects!
  this.collisionManager.setTile(x, y, TerrainTiles.createTile(TerrainTiles.SLOPE_45_UP));
}

// Flat exit (tiles 58-60) - shifted by 1
this.buildFlatSection(startX + 11, 3, baseY);
```

### Fix 3: Increase Sensor Search Depth (MEDIUM PRIORITY)
```typescript
// Current: maxDistance = 32 (2 tiles)
// RSDKv4: maxDistance = 48 (3 tiles)

castSensor(..., maxDistance: number = 48) {  // Increased from 32
```

This ensures sensors can detect terrain up to 3 tiles away, matching Sonic 1 behavior.

### Fix 4: Add Collision Tolerance (MEDIUM PRIORITY)
```typescript
const COLLISION_TOLERANCE = 14; // pixels, per Sonic Physics Guide

checkGroundSensors(...): SensorResult {
  const result = /* sensor logic */;

  // Only apply collision if within tolerance
  result.collided = Math.abs(result.distance) <= COLLISION_TOLERANCE;
  return result;
}
```

## Testing Plan

1. **Fix sensor algorithm** → Rerun spring tests (currently failing at X=890)
2. **Fix half-pipe geometry** → Verify no gaps in debug rendering
3. **Test at different speeds** → Ensure high-speed Sonic doesn't clip through
4. **Slope transitions** → Verify smooth movement on gentle/steep slopes

## Reference Documentation Generated

I've created detailed analysis docs in `/tmp/` from the reference repos:
- RSDKv4: EXPLORATION_SUMMARY.md, collision_analysis.md, code_snippets.md
- Sonic 3 AIR: Collision System Analysis, Key Files & Structure
- OpenSurge: OPENSURGE_FINDINGS_SUMMARY.md, architecture diagrams

These contain specific C++ code examples and algorithm details.

## Performance Insights from OpenSurge

For future optimization (not urgent):
- Pre-compute ground maps at level load for O(1) detection
- Use spatial partitioning to avoid checking distant tiles
- Cache sensor results for repeated queries in same frame

Current implementation is adequate for our level size, but these optimizations would enable larger, more complex levels.
