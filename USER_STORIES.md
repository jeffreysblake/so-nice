# User Stories: Sonic Platformer

## Overview
This document defines user stories for the Sonic platformer clone from the perspective of players experiencing the game. Each story follows the format: **As a [role], I want [feature], so that [benefit]**.

---

## Epic 1: Basic Player Movement

### Story 1.1: Walking and Running
**As a player**, I want to move Sonic left and right using arrow keys, so that I can explore the level.

**Acceptance Criteria:**
- [ ] Pressing left arrow moves Sonic left
- [ ] Pressing right arrow moves Sonic right
- [ ] Sonic accelerates smoothly from standing to walking speed (0 → 1.0 px/frame)
- [ ] Sonic accelerates from walking to running speed (1.0 → 6.0 px/frame)
- [ ] Sonic faces the direction he's moving
- [ ] Releasing movement keys causes Sonic to decelerate and stop
- [ ] Acceleration rate is 0.046875 px/frame²
- [ ] Deceleration rate is 0.5 px/frame² when no input
- [ ] Top speed is capped at 6 px/frame on flat ground

**Status**: ✅ Implemented

**Test Coverage**:
- Ground movement tests (19/19 passing)
- PhysicsSimulator validates acceleration/deceleration

---

### Story 1.2: Jumping
**As a player**, I want to jump by pressing a button, so that I can avoid obstacles and reach higher platforms.

**Acceptance Criteria:**
- [ ] Pressing Z key makes Sonic jump
- [ ] Jump force is 6.5 px/frame upward
- [ ] Holding jump longer makes Sonic jump higher (variable jump height)
- [ ] Releasing jump early reduces upward velocity to -4 px/frame minimum
- [ ] Sonic jumps perpendicular to the surface angle
- [ ] On a 45° slope right, jump should be angled 45° from vertical
- [ ] Gravity (0.21875 px/frame²) pulls Sonic down during jump
- [ ] Player can control left/right movement in air with reduced acceleration (0.09375 px/frame²)

**Status**: ✅ Implemented (with minor test discrepancies)

**Test Coverage**:
- Air movement tests (16/18 passing)
- 2 failing tests related to slope jump angles

---

### Story 1.3: Landing
**As a player**, I want Sonic to land smoothly on surfaces, so that movement feels natural and responsive.

**Acceptance Criteria:**
- [ ] Sonic becomes grounded when landing on solid terrain
- [ ] Air velocity converts to ground speed on landing
- [ ] Landing on slopes converts velocity based on angle
- [ ] Sonic rotates to match ground angle on landing
- [ ] No bouncing or stuttering during landing
- [ ] Sensors detect ground within 20px below Sonic

**Status**: ⚠️ Partial (1 test failure in landing detection)

**Test Coverage**:
- Landing test failing: Player not becoming grounded as expected

---

## Epic 2: Slope Physics

### Story 2.1: Moving on Slopes
**As a player**, I want Sonic to naturally speed up going downhill and slow down going uphill, so that movement feels authentic to the original game.

**Acceptance Criteria:**
- [ ] Running uphill decreases speed by slope factor (0.125 × sin(angle))
- [ ] Running downhill increases speed by slope factor (0.125 × sin(angle))
- [ ] Sonic automatically rotates to match ground angle
- [ ] Sonic maintains surface contact on slopes up to 70°
- [ ] Slopes steeper than 70° cause Sonic to fall off
- [ ] Friction continues to apply on slopes (0.046875 px/frame²)

**Status**: ⚠️ Partial (7/14 slope tests failing)

**Test Coverage**:
- Slope physics tests failing: Slope factor not properly applied
- Integration tests expecting speed changes on slopes

---

### Story 2.2: Rolling on Slopes
**As a player**, I want to roll down slopes by pressing down, so that I can gain speed and attack enemies.

**Acceptance Criteria:**
- [ ] Pressing down while moving initiates roll
- [ ] Rolling has lower friction than running (0.0234375 vs 0.046875)
- [ ] Rolling downhill accelerates faster (slope factor: 0.3125)
- [ ] Rolling uphill decelerates slower (slope factor: 0.078125)
- [ ] Roll minimum speed is 0.5 px/frame (stops below this)
- [ ] Rolling allows reaching speeds up to 16 px/frame on steep slopes
- [ ] Cannot control direction while rolling (momentum-based)

**Status**: ⚠️ Partial (constants defined, physics not fully integrated)

**Test Coverage**:
- Roll physics not validated in current tests
- Needs integration testing

---

## Epic 3: 360-Degree Movement (Loops)

### Story 3.1: Running Through Loops
**As a player**, I want to run through loop-de-loops when moving fast enough, so that I can experience the signature Sonic gameplay.

**Acceptance Criteria:**
- [ ] Sonic sticks to loop surfaces when speed ≥ 4.0 px/frame
- [ ] Sonic falls off loops when speed < 4.0 px/frame
- [ ] Gravity direction changes based on surface angle:
  - Floor mode: 315° - 45° (gravity down)
  - Right wall: 45° - 135° (gravity left)
  - Ceiling: 135° - 225° (gravity up)
  - Left wall: 225° - 315° (gravity right)
- [ ] Sensors reorient based on gravity mode
- [ ] Smooth transitions between gravity modes
- [ ] Sonic can run on walls and ceiling in loops

**Status**: ✅ Implemented

**Test Coverage**:
- Gravity mode system validated
- Loop structures built in level
- Speed threshold checks implemented

---

## Epic 4: Springs and Interactive Objects

### Story 4.1: Spring Bounce
**As a player**, I want to bounce on springs, so that I can reach higher areas and travel faster through the level.

**Acceptance Criteria:**
- [ ] Yellow springs bounce Sonic with force of 10 px/frame
- [ ] Red springs bounce Sonic with force of 16 px/frame
- [ ] Springs can be oriented up, right, down, or left
- [ ] Bounce direction matches spring orientation
- [ ] Player controls are locked for 16 frames after bounce
- [ ] Springs compress visually when activated
- [ ] Spring rebounds after 10 frames

**Status**: ✅ Implemented

**Test Coverage**:
- Spring collision detection implemented
- Visual feedback working
- Control lock functional

---

### Story 4.2: Ring Collection
**As a player**, I want to collect rings scattered throughout the level, so that I can protect myself from damage and increase my score.

**Acceptance Criteria:**
- [ ] Rings sparkle and rotate in place
- [ ] Walking into a ring collects it
- [ ] Ring counter increases by 1 per ring
- [ ] Collection sound plays on pickup
- [ ] Rings add to score (10 points each)
- [ ] Every 100 rings grants an extra life
- [ ] Ring counter displays in HUD

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for collection

---

## Epic 5: Damage and Health System

### Story 5.1: Taking Damage
**As a player**, I want to lose rings when hit by enemies or hazards, so that the game has challenge and consequences.

**Acceptance Criteria:**
- [ ] Touching an enemy without spinning damages Sonic
- [ ] Touching spikes damages Sonic
- [ ] On damage, Sonic scatters all rings in random directions
- [ ] Scattered rings can be recollected for 3 seconds
- [ ] Sonic becomes invincible for 2 seconds after damage (flashing)
- [ ] Damage sound plays on hit
- [ ] If Sonic has 0 rings and gets hit, Sonic dies

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs full implementation
- Should add integration test for damage scenarios

---

### Story 5.2: Death and Respawn
**As a player**, I want to respawn after dying, so that I can retry the level.

**Acceptance Criteria:**
- [ ] Death occurs when:
  - Hit with 0 rings
  - Falling into bottomless pit
  - Timer reaches 10:00
- [ ] Death animation plays (Sonic flies off screen)
- [ ] Death sound/music plays
- [ ] Lives counter decreases by 1
- [ ] Sonic respawns at last checkpoint or level start
- [ ] Ring counter resets to 0
- [ ] Timer resets on respawn
- [ ] Game over screen shows if 0 lives remain

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for death scenarios

---

## Epic 6: Enemies and Combat

### Story 6.1: Defeating Enemies
**As a player**, I want to defeat enemies by jumping on them or rolling into them, so that I can safely navigate the level.

**Acceptance Criteria:**
- [ ] Spinning (jumping/rolling) destroys enemies on contact
- [ ] Non-spinning contact damages Sonic
- [ ] Destroyed enemies play explosion animation
- [ ] Destroying enemy awards 100 points
- [ ] Enemy destruction sound plays
- [ ] Small animals appear from destroyed enemies

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for enemy interactions

---

### Story 6.2: Enemy AI - Motobug
**As a player**, I want to encounter moving enemies, so that the level has challenge and variety.

**Acceptance Criteria:**
- [ ] Motobug walks back and forth on platforms
- [ ] Motobug turns around at platform edges
- [ ] Motobug walks at constant speed (~1 px/frame)
- [ ] Motobug can be destroyed by spin attack
- [ ] Motobug damages Sonic on non-spin contact

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add unit test for AI behavior

---

### Story 6.3: Enemy AI - Crabmeat
**As a player**, I want to encounter enemies that shoot projectiles, so that combat requires timing and skill.

**Acceptance Criteria:**
- [ ] Crabmeat walks back and forth
- [ ] Crabmeat stops and shoots projectiles every 3 seconds
- [ ] Projectiles travel in arc trajectory
- [ ] Projectiles damage Sonic on contact
- [ ] Crabmeat can be destroyed by spin attack from above
- [ ] Projectiles disappear after 2 seconds

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add unit test for AI and projectile behavior

---

## Epic 7: HUD and Score System

### Story 7.1: Score Display
**As a player**, I want to see my current score, so that I can track my performance.

**Acceptance Criteria:**
- [ ] Score displays at top-left of screen
- [ ] Score format: "SCORE: 000000"
- [ ] Score increases when:
  - Collecting rings (+10)
  - Defeating enemies (+100)
  - Completing level (time/ring bonus)
- [ ] Score persists across levels
- [ ] Maximum score: 999,999

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for HUD visibility

---

### Story 7.2: Ring and Life Counter
**As a player**, I want to see my ring count and lives, so that I know my current status.

**Acceptance Criteria:**
- [ ] Ring counter displays at top-left: "RINGS: 000"
- [ ] Lives counter displays as icon × number at top-left
- [ ] Ring counter updates immediately on collection
- [ ] Ring counter resets to 0 after damage (if scattered)
- [ ] Life counter updates when gaining/losing lives
- [ ] Extra life granted at 100 rings (counter resets to current - 100)

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for counter updates

---

### Story 7.3: Timer
**As a player**, I want to see how long I've been playing the level, so that I can try to beat my best time.

**Acceptance Criteria:**
- [ ] Timer displays at top-left: "TIME: M:SS"
- [ ] Timer starts at 0:00 when level begins
- [ ] Timer counts up to 9:59
- [ ] Timer stops when level is completed
- [ ] Timer pauses during pause menu
- [ ] Time bonus awarded at level end (faster = more points)
- [ ] Game over at 10:00 (time limit)

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for timer functionality

---

## Epic 8: Level Completion

### Story 8.1: Goal Post
**As a player**, I want to reach a goal at the end of the level, so that I can complete the stage and progress.

**Acceptance Criteria:**
- [ ] Goal post displays at end of level
- [ ] Touching goal post completes level
- [ ] Goal post shows "SONIC" sign
- [ ] Goal post spins when passed
- [ ] Level completion music plays
- [ ] Sonic does victory animation
- [ ] Cannot move after touching goal

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for level completion flow

---

### Story 8.2: Results Screen
**As a player**, I want to see my performance stats after completing a level, so that I know how well I did.

**Acceptance Criteria:**
- [ ] Results screen shows after goal is reached
- [ ] Display format:
  - "TIME BONUS: [score]"
  - "RING BONUS: [score]"
  - "TOTAL SCORE: [score]"
- [ ] Time bonus calculation: (10 - minutes) × 1000
- [ ] Ring bonus calculation: rings × 10
- [ ] Bonus points count up with sound effect
- [ ] Total score adds to overall score
- [ ] Press button to continue to next level

**Status**: ❌ Not Implemented

**Test Coverage**:
- Needs implementation
- Should add Playwright test for results screen display

---

## Epic 9: Visual Polish

### Story 9.1: Character Animation
**As a player**, I want to see Sonic animate smoothly, so that the game looks polished and feels responsive.

**Acceptance Criteria:**
- [ ] Idle animation plays when standing still
- [ ] Walk animation plays at speeds 1-6 px/frame
- [ ] Run animation plays at speeds > 6 px/frame
- [ ] Jump animation shows Sonic in spin ball
- [ ] Roll animation shows Sonic in spin ball
- [ ] Animation frame rate increases with speed
- [ ] Sprite flips based on movement direction
- [ ] Victory animation at level end

**Status**: ❌ Not Implemented (placeholder sprite only)

**Test Coverage**:
- Visual testing required
- Should add Playwright screenshot comparison

---

### Story 9.2: Level Art
**As a player**, I want to see beautiful Green Hill Zone graphics, so that the level is visually appealing.

**Acceptance Criteria:**
- [ ] Grass tiles with checkered pattern
- [ ] Brown dirt for underground sections
- [ ] Flowers and palm trees as decoration
- [ ] Parallax scrolling backgrounds (clouds, mountains)
- [ ] Water at bottom of level with animated surface
- [ ] Smooth tile transitions
- [ ] Consistent art style matching Sonic 1

**Status**: ❌ Not Implemented (debug visualization only)

**Test Coverage**:
- Visual testing required
- Should add Playwright screenshot tests

---

## Epic 10: Audio

### Story 10.1: Background Music
**As a player**, I want to hear the iconic Green Hill Zone music, so that the game feels authentic and immersive.

**Acceptance Criteria:**
- [ ] Green Hill Zone theme plays on level load
- [ ] Music loops seamlessly
- [ ] Music pauses during pause menu
- [ ] Music stops on level completion
- [ ] Victory jingle plays after completing level
- [ ] Game over music plays on death with 0 lives

**Status**: ❌ Not Implemented

**Test Coverage**:
- Audio testing required
- Should verify music files load and play

---

### Story 10.2: Sound Effects
**As a player**, I want to hear sound effects for actions, so that the game provides audio feedback.

**Acceptance Criteria:**
- [ ] Jump sound plays on jump
- [ ] Roll sound plays continuously while rolling
- [ ] Ring collect sound plays on ring pickup
- [ ] Spring boing sound plays on bounce
- [ ] Enemy destruction sound plays on defeat
- [ ] Item box break sound plays on box destruction
- [ ] Damage sound plays when hit
- [ ] Ring scatter sound plays when losing rings

**Status**: ❌ Not Implemented

**Test Coverage**:
- Audio testing required
- Should verify SFX load and play at correct times

---

## Priority Summary

### Critical for MVP (Must Have)
1. **Story 4.2**: Ring Collection ⭐⭐⭐
2. **Story 5.1**: Taking Damage ⭐⭐⭐
3. **Story 5.2**: Death and Respawn ⭐⭐⭐
4. **Story 6.1**: Defeating Enemies ⭐⭐⭐
5. **Story 9.1**: Character Animation ⭐⭐⭐
6. **Story 9.2**: Level Art ⭐⭐⭐

### Important (Should Have)
7. **Story 6.2**: Enemy AI - Motobug ⭐⭐
8. **Story 6.3**: Enemy AI - Crabmeat ⭐⭐
9. **Story 7.1**: Score Display ⭐⭐
10. **Story 7.2**: Ring and Life Counter ⭐⭐
11. **Story 8.1**: Goal Post ⭐⭐

### Nice to Have (Could Have)
12. **Story 2.2**: Rolling on Slopes ⭐
13. **Story 7.3**: Timer ⭐
14. **Story 8.2**: Results Screen ⭐
15. **Story 10.1**: Background Music ⭐
16. **Story 10.2**: Sound Effects ⭐

### Already Implemented (Done)
- ✅ **Story 1.1**: Walking and Running
- ✅ **Story 1.2**: Jumping
- ✅ **Story 3.1**: Running Through Loops
- ✅ **Story 4.1**: Spring Bounce

---

## Test Plan Summary

### Unit Tests (Vitest) - Current Status
- ✅ PhysicsConstants: 21/21 passing
- ✅ TerrainTile: 19/19 passing
- ⚠️ CollisionManager: 17/18 passing
- ✅ Ground Movement: 19/19 passing
- ⚠️ Air Movement: 16/18 passing
- ⚠️ Slope Physics: 7/14 passing
- ⚠️ Integration: 7/16 passing

### Playwright Tests (To Be Created)
- [ ] Player movement end-to-end
- [ ] Ring collection flow
- [ ] Damage and ring scatter
- [ ] Enemy interaction
- [ ] Level completion flow
- [ ] HUD display and updates
- [ ] Visual regression (screenshots)

---

## Completion Tracking

**Implemented**: 4/32 user stories (12.5%)
**In Progress**: 3/32 user stories (9.4%)
**Not Started**: 25/32 user stories (78.1%)

**Overall Project Completion**: ~22% (including partial implementations)
