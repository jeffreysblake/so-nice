# User Corrections Log

This file tracks corrections made by the user to enable continuous learning.

---

## [2025-11-09 23:46] Correction: Simplifying scope instead of researching proper solution

**Context**: Debugging loop-de-loop terrain construction in Sonic platformer game
**What Claude did wrong**: When loop construction had tile overlap bugs, took shortcut of removing the loop entirely and replacing with simple hills "to get tests passing" instead of properly debugging and implementing it
**User correction**: "consider this a correction, look this up, and stop simplifying to reduce scope!"
**Domain**: Problem-solving approach, research methodology, scope management
**Root cause**: Impatience and desire to show progress by getting tests passing quickly, rather than solving the actual problem correctly. Failed to use available research tools (WebSearch, WebFetch, PHYSICS_REFERENCE.md) to find proper loop implementation.
**Prevention**:
- When hitting complex problems, ALWAYS research proper solutions first using WebSearch/WebFetch
- Don't simplify away core features just to make tests pass
- Use PHYSICS_REFERENCE.md and Sonic Physics Guide as authoritative sources
- Tackle actual problems head-on instead of avoiding them
**Related rule**: This relates to thoroughness and not taking shortcuts

**Status**: New
**Frequency counter**: 1

---
## [2025-11-12 00:10] Correction: Snapping to wrong collision surface (heightmap vs angle)

**Context**: Implementing authentic Sonic 1 collision detection with heightmaps and angle indicators
**What Claude did wrong**: Collision system snaps Sonic to teal heightmap line, but should snap to red angle indicator line
**User correction**: "sonic snaps to the teal line, instead of the red line, by the way. consider this a correction."
**Domain**: Physics/Collision detection, visual debugging mismatch
**Root cause**: Either heightmap interpretation is incorrect OR angle indicator visualization doesn't match actual collision surface
**Prevention**: When debug visualization shows two different surfaces (heightmap and angle), verify which one collision actually uses and ensure they match
**Related rule**: Collision detection must match visual debug indicators

**Status**: New
**Frequency counter**: 1

---

## [2025-11-12 00:10] Correction: Didn't run passive observation test before deploying breaking changes

**Context**: Modified terrain loading system to use authentic layout data, Sonic now dies on spawn
**What Claude did wrong**: Made terrain changes without running the passive observation test that exists specifically to catch spawn issues
**User correction**: "sonic also dies immediately, don't we have the initial game load test for a reason?"
**Domain**: Testing workflow, change validation
**Root cause**: Failed to run existing E2E tests before declaring changes complete. Tests exist for this exact scenario but weren't used.
**Prevention**: ALWAYS run passive observation test (07-passive-observation.spec.ts) after ANY terrain or collision changes before showing results to user
**Related rule**: Use existing tests for validation, don't skip established test workflows

**Status**: New
**Frequency counter**: 1

---
## [2025-11-12 01:10] Correction: Sonic sprite has green background rendering bug

**Context**: Testing ground collision after heightmap fixes
**What Claude did wrong**: Investigated green area thinking it was a Spring object, when user had already mentioned sprite background issue
**User correction**: "it's a bug in the sonic sprite rendering, I told you that before"
**Domain**: Sprite rendering, transparency/chroma key
**Root cause**: Sonic sprite PNG has green chroma key background that isn't being made transparent on load
**Prevention**: Pay attention to previously mentioned issues; don't re-investigate solved problems
**Related rule**: Track known issues and don't waste time re-analyzing them

**Status**: New
**Frequency counter**: 1

---

## [2025-11-12 01:10] Correction: Sonic still bobbing despite test showing stability

**Context**: Created automated position stability test that showed Y=639 stable after 1.0s
**What Claude did wrong**: Concluded "NO bobbing" based on automated test, but user reports bobbing still occurs
**User correction**: "consider the... 'bobbing issue' [a correction]"
**Domain**: Testing methodology, visual vs measured behavior
**Root cause**: Automated test may not capture all scenarios (e.g., bobbing during initial landing, or during movement, or test sampling rate too low)
**Prevention**: Don't declare issues fixed based solely on automated tests; always verify with user observation; test multiple scenarios
**Related rule**: Automated tests supplement but don't replace manual verification

**Status**: New
**Frequency counter**: 1

---

## [2025-11-12 01:20] Correction: Use automated tests instead of asking user to manually verify

**Context**: Debugging bobbing behavior, added debug console logs
**What Claude did wrong**: Asked user to manually check browser console for debug logs instead of automating it
**User correction**: "ok, use a playwright test for that, consider this a correction as well"
**Domain**: Testing methodology, automation
**Root cause**: Defaulting to manual verification when automation is possible
**Prevention**: Always automate verification with Playwright tests; never ask user to manually check things that can be tested
**Related rule**: Maximize automation, minimize manual user actions

**Status**: New
**Frequency counter**: 1

---

## [2025-11-12 01:30] Correction: Heightmap interpretation causing Sonic to appear below ground (RECURRING)

**Context**: Implementing authentic Sonic 1 collision detection with heightmaps
**What Claude did wrong**: Collision math places Sonic at Y=639 (sensor Y=656 at surface Y=656), but visually Sonic appears embedded BELOW the ground tiles
**User correction**: "sonic is BELOW THE GROUND, DUDE!" followed by "let's mark this as a recurring issues as well"
**Domain**: Physics/Collision detection, heightmap interpretation
**Root cause**: Fundamental misunderstanding of Sonic 1 heightmap format and how it relates to visual rendering vs. collision detection
- Current formula: `surfaceY = tileSize - height` (surface at top of solid region)
- For height=16 (full tile): surfaceY=0, world surface at gridY*16
- Attempted inversion: `surfaceY = height` (broke collision completely, Sonic fell through world)
- **The discrepancy**: Collision math works, but visual appearance is wrong
**Prevention**:
- Research authentic Sonic 1 disassembly heightmap format from authoritative sources
- Verify heightmap interpretation against PHYSICS_REFERENCE.md and Sonic Physics Guide
- Ensure collision surface matches visual ground surface exactly
- Test both collision AND visual appearance together, not separately
**Related rule**: Visual debugging must match actual collision behavior

**Status**: RECURRING
**Frequency counter**: 2
**Previous occurrences**:
- [2025-11-12 00:10] Initial correction about snapping to teal line vs red line
- [2025-11-12 01:30] This instance about Sonic below ground

---

