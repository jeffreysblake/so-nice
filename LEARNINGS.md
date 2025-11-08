# Project Learnings

This document captures common patterns, issues, and user corrections that occur during development. Use this to avoid repeating mistakes and understand non-obvious problems.

## Critical Issues Discovered

### 0. Playwright Screenshot Crashes with Phaser Canvas in Headless Environment
**Problem:** All Playwright tests fail with "Page crashed" or "Target crashed" when trying to take screenshots of Phaser games

**Root Cause:** Headless Chromium cannot properly render/capture Phaser Canvas games without GPU support

**Evidence:**
- Page loads successfully (`✓ Page loaded`)
- Game runs without JavaScript errors (0 console errors)
- Crashes occur specifically when calling `page.screenshot()`
- CDP screenshot method also fails with "Internal error"

**Error Messages:**
```
Error: page.screenshot: Target crashed
Call log:
- taking page screenshot
- waiting for fonts to load...
- fonts loaded
[crash]
```

**Attempted Solutions (all failed):**
1. Standard Playwright screenshots → Target crashed
2. CDP (Chrome DevTools Protocol) screenshots → Internal error
3. Chromium flags (`--disable-gpu`, `--no-sandbox`, etc.) → Still crashes
4. Sequential test execution (`--workers=1`) → Still crashes

**Workaround Options:**
1. **Run tests locally** with headed browser (`--headed` flag)
2. **Use Xvfb** (X virtual framebuffer) to provide virtual display
3. **Use Docker** with GPU support
4. **Manual testing** with local browser
5. **Alternative:** Switch to WebGL renderer instead of Canvas (may have other issues)

**Current Status:**
- ✅ Game loads and runs successfully
- ✅ No JavaScript errors in console
- ❌ Cannot capture screenshots in headless environment
- ❌ Visual testing blocked until environment issue resolved

**Recommendation:** User should test locally or provide environment with GPU/display support for visual testing.

---

### 1. Delta Time Normalization Bug
**Problem:** Enemies moving 16x too fast in production

**Root Cause:**
```typescript
// WRONG - delta is in milliseconds (~16-17ms per frame)
this.x += this.direction * this.speed * delta;
```

**Solution:**
```typescript
// CORRECT - normalize delta to frames (60 FPS standard)
const deltaNormalized = delta / (1000 / 60);
this.x += this.direction * this.speed * deltaNormalized;
```

**Locations:**
- `src/objects/Motobug.ts:35`
- `src/objects/Crabmeat.ts:77`
- Any other movement code using delta

**Lesson:** Always normalize delta time when using it for movement calculations.

---

### 2. Port Configuration Mismatch
**Problem:** Playwright tests timing out because dev server on wrong port

**Root Cause:** Vite configured for port 3000, but Playwright expected 5173

**Files to Check:**
- `vite.config.ts` - server.port setting
- `playwright.config.ts` - baseURL and webServer.url
- Test files - hardcoded `localhost:5173` references

**Lesson:** Keep port configuration consistent across all config files and test files.

---

### 2b. Test Timeouts and Hanging
**Problem:** Playwright tests hanging indefinitely or timing out

**Root Causes:**
1. Long test waits (30s loops) exceed default timeout (120s)
2. Processes not cleaned up properly (chromium, vite, playwright)
3. Port 3000 still in use from previous failed test run

**Solutions:**
```bash
# Always use the port-check script
./scripts/test-with-port-check.sh [test-file]

# Script now includes:
# - 300s (5min) timeout for long visual tests
# - Automatic process cleanup (playwright, chromium, vite)
# - Trap to ensure cleanup runs even on interrupt
# - Creates debug directory automatically
```

**Playwright Config Updates:**
```typescript
timeout: 300000,        // 5 min per test
globalTimeout: 600000,  // 10 min total
```

**Test Design Guidelines:**
- Keep individual test waits under 15 seconds
- Break long tests into multiple shorter tests
- Use `waitForTimeout` sparingly
- Prefer event-based waits over fixed timeouts when possible

**Lesson:** Visual/integration tests need much longer timeouts than unit tests. Always include cleanup traps.

---

### 3. Mock Objects Must Avoid Phaser Dependencies
**Problem:** Tests failing with "canvas.getContext is not a function"

**Root Cause:** Ring class requires Phaser canvas context, which doesn't exist in unit tests

**Solution:** Mock the Ring class in tests:
```typescript
vi.mock('../../objects/Ring', () => ({
  Ring: vi.fn().mockImplementation(() => {
    let _collected = false;
    return {
      x: 0, y: 0,
      setPosition: vi.fn(),
      destroy: vi.fn(),
      onPlayerInteract: vi.fn(() => { _collected = true; }),
      isCollected: vi.fn(() => _collected),
    };
  }),
}));
```

**Lesson:** Always mock Phaser objects in unit tests to avoid canvas/WebGL dependencies.

---

### 4. Test Callbacks Must Not Execute Immediately
**Problem:** LifeSystem tests failing because `isDead` flag cleared before assertion

**Root Cause:** Mock `time.delayedCall` was immediately executing callbacks:
```typescript
// WRONG - executes callback immediately
delayedCall: vi.fn((delay: number, callback: () => void) => {
  callback(); // This clears isDead flag!
})
```

**Solution:** Create separate mock scenes for tests that need delayed execution:
```typescript
// For tests that need callback control
const noCallbackScene = {
  time: { delayedCall: vi.fn() } // Don't execute
} as any;
```

**Lesson:** Mock timer functions should not auto-execute unless specifically testing callback behavior.

---

### 5. README Claims vs Reality
**Problem:** README showed features as "under construction" (🚧) when they were actually implemented (✅)

**Root Cause:** Documentation not updated after implementing features

**Solution:**
- Created FEATURE_MATRIX.md to compare claims vs reality
- Updated README with accurate status indicators
- Added test coverage metrics

**Lesson:** Always test locally before claiming features work. Update docs immediately when features are completed.

---

## Common Patterns

### Vitest Mock Pattern for Phaser Objects
```typescript
vi.mock('../../path/to/PhaserClass', () => ({
  ClassName: vi.fn().mockImplementation(() => ({
    // Use closure for state, not 'this'
    // Return methods as vi.fn()
    // Avoid canvas/WebGL dependencies
  })),
}));
```

### Delta Time Normalization Pattern
```typescript
// Standard 60 FPS normalization
const deltaNormalized = delta / (1000 / 60);
// Apply to movement
this.x += velocity * deltaNormalized;
```

### Testing Scene Events
```typescript
// Create mock scene with event system
const mockScene = {
  events: {
    emit: vi.fn(),
    on: vi.fn(),
  },
} as any;
```

---

## User Corrections

### "Test it before claiming it works"
**Context:** README claimed game was "85% complete" and "playable MVP", but actual gameplay had critical bugs

**Correction:** Always run the game locally and verify features work before documenting them as complete

**Action Items:**
- Create visual/integration tests (Playwright)
- Test locally before updating docs
- Provide screenshot evidence of features working

---

### "Don't create new files unnecessarily"
**Context:** Tendency to create new test files instead of editing existing ones

**Correction:** Prioritize editing existing files over creating new ones

**Guidelines:**
- Edit existing test files to add coverage
- Only create new files when necessary for separation of concerns
- Consolidate similar patterns found in codebase
- Keep files under 600 lines

---

### "You can ingest images - use them for debugging"
**Context:** User had to manually test game because I wasn't analyzing screenshots

**Correction:** Create Playwright tests that generate screenshots at optimal intervals for visual debugging

**Action Items:**
- Take frame-by-frame screenshots for animation bugs
- Compare before/after screenshots for state changes
- Measure pixel distances to verify movement speeds
- Use screenshots as objective evidence

---

## Development Workflow

### Before Every Commit
1. Run `npm run lint` - Fix all linting errors
2. Run `npm run test` - Ensure all tests pass
3. Run `npm run test:coverage` - Verify coverage maintained
4. Test locally in browser - Verify features actually work
5. Update tests if code changed

### When Implementing Features
1. Read existing code to understand patterns
2. Edit existing files when possible
3. Add tests inline or update existing test files
4. Verify feature works locally before documenting
5. Take screenshots as proof of functionality

### When Debugging
1. Create Playwright tests with targeted screenshots
2. Run tests with `./scripts/test-with-port-check.sh`
3. Analyze generated screenshots
4. Document findings in CRITICAL_BUGS.md if needed
5. Fix bugs and re-test with screenshots

---

## Testing Insights

### Port Management for E2E Tests
- Always use the port-check script: `./scripts/test-with-port-check.sh`
- Prevents hanging on port conflicts
- Automatic cleanup on failure
- 180s timeout to catch infinite loops

### Screenshot Strategy
- Take screenshots at consistent intervals (50ms, 200ms, 1s depending on purpose)
- Frame-by-frame: 50ms intervals for animations
- State changes: 200ms intervals for UI updates
- Movement measurement: 1s intervals for distance calculation
- Always include debug overlay in screenshots

---

## TypeScript Patterns

### Avoid 'this' in Mock Functions
```typescript
// WRONG
onPlayerInteract: vi.fn(function() { this._collected = true; })

// CORRECT
let _collected = false;
return {
  onPlayerInteract: vi.fn(() => { _collected = true; }),
  isCollected: vi.fn(() => _collected),
};
```

**Reason:** TypeScript infers 'this' as 'any' in arrow functions used as mocks

---

## Git Workflow

### Branch Naming
- Use format: `claude/feature-name-<session-id>`
- Session ID ensures unique branches for concurrent work
- Prevents push conflicts

### Commit Messages
- Be specific about what changed and why
- Include test updates in same commit as code changes
- Reference bug numbers or issues when applicable

---

## Questions to Ask Before Creating Files

1. Can this be added to an existing file?
2. Does a similar pattern exist elsewhere in the codebase?
3. Is this file necessary for separation of concerns?
4. Will this file be under 600 lines?
5. Can existing files be consolidated instead?

If yes to 1-2 or no to 3-4, edit existing files instead.
