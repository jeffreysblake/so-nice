# Test Coverage Audit

Generated: $(date)

## Current Test Coverage

### ✅ Well-Tested Systems
1. **Physics Engine** (`src/__tests__/physics/`)
   - Ground Movement: Acceleration, deceleration, top speed
   - Air Movement: Jump mechanics, gravity
   - Slope Physics: Rolling uphill/downhill

2. **Terrain System** (`src/terrain/__tests__/`)
   - CollisionManager: Heightmap collision detection
   - TerrainTile: Tile management

3. **Integration Tests** (`src/__tests__/integration/`)
   - Complete gameplay scenarios

## ❌ Missing Critical Tests

### High Priority (Core Gameplay)

#### 1. **DamageSystem** (`src/systems/DamageSystem.ts`)
**Why critical**: Manages player damage, invincibility, ring scatter - core gameplay mechanic

Test cases needed:
- ✗ Apply damage with rings (should scatter rings)
- ✗ Apply damage without rings (should not scatter)
- ✗ Invincibility prevents consecutive damage
- ✗ Invincibility duration (120 frames / 2 seconds)
- ✗ Ring scatter physics (up to 32 rings)
- ✗ Ring scatter pattern (circular distribution)
- ✗ Scattered rings have collision detection
- ✗ Scattered rings despawn after 3 seconds
- ✗ Knockback velocity calculation
- ✗ Knockback direction based on damage source

#### 2. **LifeSystem** (`src/systems/LifeSystem.ts`)
**Why critical**: Manages player lives, death, respawn - prevents game-breaking bugs

Test cases needed:
- ✗ Start with 3 lives
- ✗ triggerDeath() decrements lives
- ✗ Respawn when lives > 0
- ✗ Game over when lives = 0
- ✗ Respawn position maintained
- ✗ setRespawnPosition() updates checkpoint
- ✗ Death callbacks triggered correctly
- ✗ Respawn callbacks triggered correctly
- ✗ Game over callbacks triggered correctly
- ✗ Cannot die twice simultaneously

#### 3. **ScoreSystem** (`src/systems/ScoreSystem.ts`)
**Why critical**: Tracks score and time - affects player experience

Test cases needed:
- ✗ Timer starts at 0
- ✗ Timer increments correctly (60fps)
- ✗ Timer stops when stop() called
- ✗ Timer resumes when start() called
- ✗ Ring collection adds 10 points
- ✗ Enemy defeat adds 100 points
- ✗ Checkpoint adds 500 points
- ✗ Time bonus calculation correct (<30s = 50,000)
- ✗ Ring bonus calculation correct (rings * 100)
- ✗ getFormattedTime() returns M:SS format
- ✗ Score persists through timer stop/start

#### 4. **Enemy Base Class** (`src/objects/Enemy.ts`)
**Why critical**: Base for all enemy AI - bugs affect all enemies

Test cases needed:
- ✗ checkPlayerCollision() detects collision correctly
- ✗ checkPlayerCollision() returns false when destroyed
- ✗ isPlayerAttacking() detects jumping
- ✗ isPlayerAttacking() detects rolling
- ✗ onPlayerInteract() destroys enemy when player attacking
- ✗ onPlayerInteract() damages player when not attacking
- ✗ destroy() sets destroyed flag
- ✗ destroy() plays animation
- ✗ Cannot be destroyed twice
- ✗ Destroyed enemy stops checking collision

#### 5. **Motobug Enemy** (`src/objects/Motobug.ts`)
**Why critical**: First enemy type - tests enemy AI patterns

Test cases needed:
- ✗ Walks in configured direction
- ✗ Changes direction every 3 seconds (180 frames)
- ✗ Turns around at world boundaries
- ✗ Collision radius is 16px
- ✗ UpdateAI moves enemy position
- ✗ Eyes face current direction

#### 6. **Crabmeat Enemy** (`src/objects/Crabmeat.ts`)
**Why critical**: Projectile enemy - tests complex AI

Test cases needed:
- ✗ Walks in configured direction
- ✗ Changes direction every 2.5 seconds
- ✗ Fires projectile every 2 seconds (120 frames)
- ✗ Projectile has correct trajectory
- ✗ Collision radius is 18px
- ✗ Projectile despawns after animation

### Medium Priority (Game Objects)

#### 7. **Ring** (`src/objects/Ring.ts`)
**Why important**: Primary collectible - affects scoring

Test cases needed:
- ✗ checkPlayerCollision() detects collision (8px radius)
- ✗ onPlayerInteract() marks as collected
- ✗ isCollected() returns correct state
- ✗ Collected rings don't re-collide
- ✗ reset() clears collected state
- ✗ Visual sparkle effect plays on collection

#### 8. **Spring** (`src/objects/Spring.ts`)
**Why important**: Launch mechanic - affects movement

Test cases needed:
- ✗ Yellow spring applies correct force (10 or 16)
- ✗ Red spring applies correct force (16 or 10)
- ✗ Spring orientation affects force direction
- ✗ checkPlayerCollision() detects collision
- ✗ onPlayerInteract() launches player
- ✗ Cooldown prevents multiple launches

#### 9. **GoalPost** (`src/objects/GoalPost.ts`)
**Why important**: Level completion trigger

Test cases needed:
- ✗ checkPlayerCollision() detects collision (30px radius)
- ✗ onPlayerInteract() activates only once
- ✗ isActivated() returns correct state
- ✗ Activation animation plays
- ✗ reset() clears activated state

### Low Priority (Integration)

#### 10. **Player Event Callbacks**
Test cases needed:
- ✗ Ring collection triggers score callback
- ✗ Enemy defeat triggers score callback
- ✗ Damage triggers life system callbacks
- ✗ Death triggers game scene callbacks

#### 11. **GameScene Integration**
Test cases needed:
- ✗ All systems initialized correctly
- ✗ Update loop processes all objects
- ✗ HUD updates on events
- ✗ Level completion triggers correctly

## Testing Strategy

### Unit Tests (Highest Priority)
Focus on:
1. **DamageSystem** - 10 tests
2. **LifeSystem** - 10 tests
3. **ScoreSystem** - 11 tests
4. **Enemy** base class - 10 tests
5. **Ring, Spring, GoalPost** - 15 tests total

**Total new unit tests**: ~56 tests

### Integration Tests (Medium Priority)
- Enemy interactions with player
- Damage → Ring scatter → Collection flow
- Death → Respawn → Continue flow
- Score tracking through gameplay loop

**Total new integration tests**: ~10 tests

## Recommended Test Implementation Order

1. **ScoreSystem** (easiest, pure logic, no dependencies)
2. **LifeSystem** (pure logic, minimal dependencies)
3. **DamageSystem** (moderate complexity, uses Ring)
4. **Enemy base class** (foundational for enemy tests)
5. **Motobug & Crabmeat** (concrete enemy implementations)
6. **Ring, Spring, GoalPost** (game objects)
7. **Integration tests** (requires all above systems)

## Current Test Statistics

```bash
npm test -- --coverage
```

Expected improvement after implementing missing tests:
- Current: ~60-70% coverage (physics-heavy)
- Target: ~85-90% coverage (gameplay-critical)
