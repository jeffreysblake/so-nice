# Sonic Physics Reference

This document compiles physics formulas, constants, and mechanics from the [Sonic Physics Guide](http://info.sonicretro.org/Sonic_Physics_Guide) for quick reference during development.

## Table of Contents
- [Main Game Loop](#main-game-loop)
- [Running Physics](#running-physics)
- [Slope Physics](#slope-physics)
- [Slope Collision](#slope-collision)
- [Game Objects](#game-objects)
- [Hitboxes](#hitboxes)
- [Loop Construction](#loop-construction)
- [Implementation Notes](#implementation-notes)

---

## Main Game Loop

### Frame Execution Sequence

Each frame executes in strict order:

1. **Characters/Players** execute first, depending on their state
2. **Special objects** (title cards, etc.)
3. **General objects** (enemies, bosses, gimmicks)

### Player State Operations

#### Normal State (Grounded, Not Rolling)

**Execution Order:**
1. Check for special animations that prevent control (balancing, etc.)
2. Check for starting a spindash while crouched
3. **Adjust Ground Speed based on current Ground Angle (Slope Factor)**
4. Check for jump input
5. Update speed based on directional input (acceleration/deceleration)
6. Apply friction if no input
7. Execute sensor collision detection (push sensors)
8. Update position based on Ground Speed and Ground Angle
9. Execute ground sensor collision (align to surface)
10. Check for slip/fall conditions

#### Rolling State

Similar to normal state but with:
- Rolling-specific slope factors
- Roll friction applied instead of normal friction
- No acceleration from directional input

#### Airborne State

**Execution Order:**
1. Check for jump button release (variable jump height)
2. Handle super form transitions
3. Apply directional input (air control)
4. Apply air drag
5. **Update position based on velocity**
6. **Apply gravity (AFTER position update!)** ⚠️ CRITICAL TIMING
7. Execute collision checks

**Important:** "Gravity timing is significant: This happens after the Player's position was updated. This is an important detail for ensuring the Player's jump height is correct."

### Sensor System

- **Push sensors** execute BEFORE position updates (account for upcoming movement)
- **Ground sensors** execute AFTER movement (align player or transition to airborne)

---

## Running Physics

### Constants

| Parameter | Hex Value | Decimal Value | Subpixels | Description |
|-----------|-----------|---------------|-----------|-------------|
| `acceleration_speed` | 0x0C | 0.046875 | 12 | Acceleration per frame |
| `deceleration_speed` | 0x80 | 0.5 | 128 | Deceleration when reversing |
| `friction_speed` | 0x0C | 0.046875 | 12 | Friction per frame (no input) |
| `top_speed` | 0x600 | 6.0 | - | Maximum running speed |

**Note:** All values are pixels/frame at 60 FPS.

### Movement Formulas

#### Acceleration
```
IF holding Right:
    Ground Speed += acceleration_speed
    IF Ground Speed > top_speed:
        Ground Speed = top_speed
```

#### Deceleration (Reversing Direction)
```
IF (holding Left AND Ground Speed > 0) OR (holding Right AND Ground Speed < 0):
    Ground Speed -= deceleration_speed

    IF sign changed:
        Ground Speed = ±0.5  // Snap to half-pixel in new direction
```

#### Friction (No Input)
```
IF NOT (holding Left OR holding Right):
    IF Ground Speed > 0:
        Ground Speed -= MIN(Ground Speed, friction_speed)
    ELSE IF Ground Speed < 0:
        Ground Speed += MIN(ABS(Ground Speed), friction_speed)
```

### Control Lock Mechanic

A timer prevents directional input during specific events:
- Slope slips
- Spring bounces
- Other forced movement

**Note:** "If you press Left or Right during a control lock, no friction will be applied despite being unable to move."

---

## Slope Physics

### Core Movement Formula

When on slopes, velocity components derive from Ground Speed and Ground Angle:

```
X Speed = Ground Speed × cos(Ground Angle)
Y Speed = Ground Speed × -sin(Ground Angle)
```

**Why negative sin?** Screen coordinates have Y+ pointing down. Negative sine converts math coordinates (Y+ up) to screen coordinates.

### Slope Factors (Slope Deceleration)

Each frame, subtract from Ground Speed:
```
Ground Speed -= Slope Factor × sin(Ground Angle)
```

| State | Value (Decimal) | Value (Hex) | Subpixels | Notes |
|-------|----------------|-------------|-----------|-------|
| **Running** | 0.125 | 0x20 | 32 | Standard slope deceleration |
| **Rolling Uphill** | 0.078125 | 0x14 | 20 | Weaker (slower deceleration) |
| **Rolling Downhill** | 0.3125 | 0x50 | 80 | Stronger (faster acceleration) |

**Effect:** "Slowing when climbing, accelerating when descending."

**Direction Detection:**
- **Uphill:** `sin(Ground Angle) > 0` (positive sine)
- **Downhill:** `sin(Ground Angle) < 0` (negative sine)

For rolling:
```
IF isRolling:
    IF sin(Ground Angle) < 0:  // Downhill
        Slope Factor = SLOPE_FACTOR_ROLLDOWN
    ELSE:                       // Uphill
        Slope Factor = SLOPE_FACTOR_ROLLUP
ELSE:
    Slope Factor = SLOPE_FACTOR_NORMAL
```

### Slip and Fall Mechanics

#### Sonic 1, 2, and CD
```
IF Ground Speed < 2.5 AND ABS(Ground Angle) > 45°:
    // Player slips
    Ground Speed = 0
    Control Lock = 30 frames
```

#### Sonic 3 & Knuckles
```
// Slip range: 35°-326°
IF 35° < Ground Angle < 326°:
    Ground Speed *= 0.5  // Half speed instead of zero

// Fall range: 69°-293°
IF 69° < Ground Angle < 293°:
    // Transition to airborne
```

### Landing on Slopes (Air → Ground Transition)

When landing, convert air velocity to Ground Speed based on angle:

```
// Flat surfaces (0°-23°)
IF ABS(Ground Angle) <= 23°:
    Ground Speed = X Speed

// Moderate slopes (23°-45°)
ELSE IF 23° < ABS(Ground Angle) <= 45°:
    Ground Speed = Y Speed × 0.5 × -sign(sin(Ground Angle))

// Steep slopes (45°-90°)
ELSE:
    Ground Speed = Y Speed × -sign(sin(Ground Angle))
```

**Our Implementation:** We use a dot product for all angles:
```typescript
const surfaceX = cos(angle);
const surfaceY = sin(angle);
Ground Speed = X Velocity × surfaceX - Y Velocity × surfaceY;
```

This projects the velocity vector onto the surface direction, handling all angles uniformly.

---

## Slope Collision

### Sensor Positioning

Six sensors arranged symmetrically:

| Sensor | Position | Purpose |
|--------|----------|---------|
| **A** (Ground Left) | `(X - Width Radius, Y + Height Radius)` | Detect floor (left) |
| **B** (Ground Right) | `(X + Width Radius, Y + Height Radius)` | Detect floor (right) |
| **C** (Ceiling Left) | `(X - Width Radius, Y - Height Radius)` | Detect ceiling (left) |
| **D** (Ceiling Right) | `(X + Width Radius, Y - Height Radius)` | Detect ceiling (right) |
| **E** (Push Left) | `(X - 10, Y)` | Detect walls (left) |
| **F** (Push Right) | `(X + 10, Y)` | Detect walls (right) |

**Constants:**
- `Width Radius` = 9 pixels (sensor spacing)
- `Height Radius` = 20 pixels (vertical offset)
- `Push Radius` = 10 pixels (always constant)

### Four-Mode Collision System

The engine rotates collision detection based on ground angle:

| Mode | Angle Range | Primary Sensors | Alignment |
|------|-------------|-----------------|-----------|
| **Floor** | 0°-45°, 315°-360° | A, B (down) | Vertical (standard platformer) |
| **Right Wall** | 46°-134° | E (left) | Horizontal (right surface) |
| **Ceiling** | 135°-225° | C, D (up) | Inverted vertical |
| **Left Wall** | 226°-314° | F (right) | Horizontal (left surface) |

"When Ground Angle gets too steep, the Player switches mode"—essentially rotating the entire collision system.

### Grounded Collision Resolution

**Sensor Competition (CRITICAL):**
1. Both ground sensors A & B cast downward from their positions
2. Each sensor returns a distance value to the nearest surface
3. **The sensor finding the "smaller" distance wins**
   - **Negative distances beat positive distances** (sensor inside terrain beats sensor above terrain)
   - If both same sign, smallest absolute value wins
   - Sensor A breaks ties (left sensor has priority)

**Distance Sign Interpretation:**
- **Negative distance:** Sensor is INSIDE solid terrain (player too low, needs to move up)
- **Zero distance:** Sensor is exactly touching surface
- **Positive distance:** Sensor is ABOVE terrain (player too high, needs to move down to stay attached)

**Reposition Conditions (Sonic 1):**

⚠️ **CRITICAL:** The ±14 pixel threshold is NOT just a repositioning limit—it determines **whether collision occurs at all**:

```
1. Cast both sensors A & B
2. Determine winning sensor (smaller distance)
3. IF -14 <= winning distance <= 14:
     collided = true
     Reposition player by adding distance to Y Position
     Ground Angle = winning sensor angle
     isGrounded = true
   ELSE:
     collided = false
     Player becomes airborne (detach from surface)
```

**Key Insight:** If the winning distance is outside ±14 pixels, **collision is rejected entirely**. The player doesn't just skip repositioning—they **detach from the ground** and become airborne. This prevents "snap to ground" from distances too far away.

**Sonic 2+ (Dynamic Threshold):**
```
positive_threshold = MIN(ABS(X Speed) + 4, 14)
negative_threshold = -14  // Always constant

IF -14 <= distance <= positive_threshold:
    Reposition player (speed-dependent catch-up)
ELSE:
    Player becomes airborne
```

**Resolution Formula:**
```
// If collision accepted (within threshold):
Player Y Position += winning distance
Ground Angle = winning sensor angle
isGrounded = true
```

**Common Implementation Mistakes:**
1. ❌ Checking `collided` flag first, then applying threshold → Wrong order!
2. ❌ Adding a "jitter threshold" (e.g., ignore distances <0.5px) → Non-authentic, causes bobbing!
3. ❌ Only using one sensor instead of competing two → Causes slope transition glitches
4. ✅ Apply threshold in CollisionManager BEFORE returning `collided` flag → Correct!

### Airborne Collision Detection

Sensors activate based on velocity direction:

```
velocity_angle = atan2(Y Velocity, X Velocity)

IF -90° <= velocity_angle <= 90°:  // Moving mostly down
    Active Sensors = A, B (ground sensors)

ELSE IF 90° < velocity_angle OR velocity_angle < -90°:  // Moving mostly up
    Active Sensors = C, D (ceiling sensors)
```

**Push sensors** (E, F) activate when moving sideways.

**Landing Condition:**
```
IF winning distance >= 0:
    // Sensor isn't overlapping terrain yet
    No collision
ELSE:
    // Sensor is inside terrain
    Player Y Position += winning distance
    isGrounded = true
    Calculate Ground Speed from air velocity (see Landing formula)
```

### Angle Snapping

**Flagged Tiles** (normal blocks):
- Snap angle to nearest 90° multiple (0°, 90°, 180°, 270°)

**Sonic 2+ Steep Transitions:**
```
IF ABS(new angle - old angle) > 45°:
    Snap to nearest 90° multiple
```

This prevents jarring angle changes on steep transitions.

### Known Quirks

**Two-Sensor Artifacts:**
"Sensor B starts climbing down the ramp on the right, but the Player still defaults to the level of the previous ramp found by Sensor A"

This causes:
- Visible dips when transitioning between opposing slopes
- Incorrect jump angles at slope transitions
- Player "floating" slightly above or below the actual surface

---

## Implementation Notes

### Our Implementation Specifics

#### Physics Constants (`src/config/PhysicsConstants.ts`)

```typescript
// Ground Movement
ACCELERATION = 0.046875       // 12 subpixels
DECELERATION = 0.5            // 128 subpixels
FRICTION = 0.046875           // 12 subpixels
TOP_SPEED = 6                 // pixels per frame

// Rolling
ROLL_FRICTION = 0.0234375     // 6 subpixels (half of normal friction)
ROLL_MIN_SPEED = 0.5          // Minimum to maintain roll

// Slope Physics
SLOPE_FACTOR_NORMAL = 0.125   // 32 subpixels (running)
SLOPE_FACTOR_ROLLUP = 0.078125    // 20 subpixels (rolling uphill)
SLOPE_FACTOR_ROLLDOWN = 0.3125    // 80 subpixels (rolling downhill)

// Collision
SENSOR_WIDTH = 9              // Width radius (A/B sensor spacing)
SENSOR_HEIGHT = 20            // Height radius
PUSH_RADIUS = 10              // Wall sensor distance

// Gravity & Air
GRAVITY = 0.21875             // 56 subpixels
JUMP_FORCE = 6.5              // Initial jump velocity
AIR_ACCELERATION = 0.09375    // 24 subpixels (half of ground)
```

#### Update Sequence (`src/__tests__/helpers/PhysicsSimulator.ts`)

**Grounded:**
```typescript
1. updateGroundMovement(input, delta)    // Acceleration/deceleration/friction
2. applySlopePhysics(delta)             // Slope factor ⚠️ Modifies groundSpeed before jump!
3. checkJump(input)                      // Convert to air if jumping
4. movePlayer(delta)                     // Update position
5. checkGroundCollision()                // Realign to surface
```

**Airborne:**
```typescript
1. updateAirMovement(input, delta)       // Air control + gravity
2. movePlayer(delta)                     // Update position
3. checkGroundCollision()                // Check for landing
```

#### Critical Implementation Details

**1. Slope Physics Before Jump**
```typescript
// applySlopePhysics runs BEFORE checkJump!
// This means groundSpeed is modified by slope factor before jumping
// Tests must account for this:
const slopeAdjustedSpeed = groundSpeed - (SLOPE_FACTOR * sin(angle) * delta);
const jumpX = slopeAdjustedSpeed - JUMP_FORCE * sin(angle);
```

**2. Roll Friction**
```typescript
// Must use conditional friction based on roll state
const frictionValue = isRolling ? ROLL_FRICTION : FRICTION;
```

**3. Landing Velocity Conversion**
```typescript
// Use dot product to project velocity onto surface
const surfaceX = cos(angleRad);
const surfaceY = sin(angleRad);
// NOTE: Negate Y because movePlayer uses -sin() for screen coords
const speedAlongSurface = xVelocity * surfaceX - yVelocity * surfaceY;
groundSpeed = speedAlongSurface;
```

**4. Coordinate System**
```typescript
// Standard trig: sin(45°) = +0.707 (up), sin(315°) = -0.707 (down)
// Screen coords: Y+ is down, so negate to get correct screen direction
yVelocity = groundSpeed * -sin(angleRad);
```

### Common Gotchas

1. **Slope physics applies BEFORE jump** - affects jump velocity calculations in tests
2. **Roll friction is half of normal friction** - must use conditional friction
3. **Landing conversion uses dot product** - must account for screen coordinate negation
4. **Gravity applies AFTER position update** - affects jump height calculations
5. **Two-sensor system causes artifacts** - visible dips at slope transitions

---

## Game Objects

### Springs

Springs are interactive objects that launch the player in a specific direction. There are two types and four orientations.

**Spring Types:**
- **Yellow Spring:** Standard bounce force (10 pixels/frame)
- **Red Spring:** High bounce force (16 pixels/frame)

**Spring Orientations:**
- **UP (0°):** Launches player upward
- **RIGHT (90°):** Launches player rightward
- **DOWN (180°):** Launches player downward
- **LEFT (270°):** Launches player leftward

**Physics Behavior:**

**Vertical Springs (UP/DOWN):**
- Set Y velocity to bounce force (negative for up, positive for down)
- **PRESERVE horizontal momentum** - X velocity unchanged!
- Player enters airborne state
- Pull player 8 pixels into spring for alignment
- Lock controls for 16 frames

**Horizontal Springs (RIGHT/LEFT):**
- **Only activate when player is grounded** (Sonic 1/2 behavior)
- Set ground speed to bounce force (sign determines direction)
- Y velocity unchanged
- Pull player 8 pixels into spring
- Lock controls for 16 frames

**Hitbox Dimensions (SPG-authentic):**
- Vertical springs (UP/DOWN): 33×17 pixels
- Horizontal springs (RIGHT/LEFT): 17×31 pixels
- Use rectangular AABB collision detection

**Implementation Status:**
- ✅ Bounce forces correct
- ✅ Horizontal momentum preservation
- ✅ Grounded-state check for horizontal springs
- ✅ Rectangular hitboxes
- ✅ 8-pixel pull alignment
- ✅ Control lock

**Source:** [SPG:Game_Objects](https://info.sonicretro.org/SPG:Game_Objects)

---

## Hitboxes

### Player Hitbox

The player's hitbox changes based on state:

**Standing/Running:**
- Width: 17 pixels (radius: 8.5 pixels)
- Height: 33 pixels (radius: 16.5 pixels)
- Center point: Player position

**Rolling/Spin Dash:**
- Width: 15 pixels (radius: 7.5 pixels)
- Height: 30 pixels (radius: 15 pixels)

**Critical Notes:**
- Width is NARROWER than height
- Hit detection uses separate width/height radii, not circular
- Different states have different hitboxes
- Sensors extend beyond hitbox for collision detection

**Source:** [SPG:Hitboxes](https://info.sonicretro.org/SPG:Hitboxes#The_Player.27s_Hitbox)

---

## Loop Construction

### Full Vertical Loops

Vertical loop-de-loops (360° paths) are one of Sonic's most iconic features, but they require specialized collision architecture.

**Requirements for Full Vertical Loops:**

**1. Dual-Layer Collision System (A/B Layers)**
- Terrain exists on two separate layers: Layer A and Layer B
- Player can only collide with ONE layer at a time
- Each layer has complete collision geometry

**2. Layer Switchers**
- Special markers placed at loop entry and exit points
- When player crosses a switcher, active layer changes
- Entry: Switch from Layer A to Layer B (or vice versa)
- Exit: Switch back to original layer

**3. Ceiling Sensors**
- Player needs ceiling sensors for upside-down collision
- When gravity mode is CEILING (180°), ceiling sensors detect floor
- Without ceiling sensors, player falls through loop ceiling

**Loop Structure Example:**
```
         [Ceiling Layer B]
        /                \
    [Entry]            [Exit]
   Switcher →        ← Switcher
    /                      \
[Floor Layer A]         [Floor Layer A]
```

**Why This Is Required:**
- At loop entry, player is on floor (Layer A)
- Player transitions to ceiling (Layer B) via switcher
- Player runs upside-down on Loop ceiling (Layer B)
- Player transitions back to floor (Layer A) at exit switcher
- Without layer system, loop floor and ceiling geometry would conflict

**Current Implementation Status:**
- ❌ Dual-layer collision system NOT IMPLEMENTED
- ❌ Layer switchers NOT IMPLEMENTED
- ❌ Ceiling sensors NOT IMPLEMENTED
- ✅ Loop geometry properly structured (ready for layers)
- ✅ Gravity mode switching (FLOOR → CEILING) works
- 🔄 Using half-pipe workaround (no ceiling running required)

**Workaround:**
Current implementation uses a "half-pipe" style curved valley instead of full vertical loops. This provides similar visual/gameplay feel without requiring ceiling collision.

**Implementation Notes:**
- See `TerrainManager.buildFullLoop()` for properly researched loop geometry
- See `TerrainManager.buildHalfPipe()` for current workaround
- Full loops will require architectural changes to collision system
- Recommend implementing layer system before attempting full loops

**Sources:**
- [SPG:Solid_Terrain#Loops](https://info.sonicretro.org/SPG:Solid_Terrain#Loops)
- [SPG:Slope_Physics#360_Degree_Movement](https://info.sonicretro.org/SPG:Slope_Physics#360_Degree_Movement)

---

## Additional Resources

- **Sonic Physics Guide:** http://info.sonicretro.org/Sonic_Physics_Guide
- **Main Game Loop:** http://info.sonicretro.org/SPG:Main_Game_Loop
- **Running:** http://info.sonicretro.org/SPG:Running
- **Slope Physics:** http://info.sonicretro.org/SPG:Slope_Physics
- **Slope Collision:** http://info.sonicretro.org/SPG:Slope_Collision
- **Rolling:** http://info.sonicretro.org/SPG:Rolling

---

## Revision History

- **2025-11-10:** Added Game Objects, Hitboxes, and Loop Construction
  - Comprehensive spring physics documentation (vertical/horizontal behavior)
  - Player hitbox dimensions for all states
  - Full explanation of loop requirements (dual-layer system, ceiling sensors)
  - Documented half-pipe workaround for loops
  - Implementation status checklists for springs and loops
  - Additional SPG sources referenced

- **2025-11-09:** Initial compilation from Sonic Physics Guide
  - Main Game Loop, Running, Slope Physics, Slope Collision
  - Added implementation notes from our codebase
  - Documented common gotchas and critical timing details
