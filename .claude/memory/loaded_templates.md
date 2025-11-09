# Loaded Templates State

**Last Updated:** 2025-11-09T15:15:00Z

## Detected Stack

- **TypeScript** (tsconfig.json + package.json detected)
- **Vitest** (testing framework)
- **Playwright** (E2E testing)
- **Phaser** (game engine)

## Loaded Templates

### Core Templates
- `.claude/best_practices/typescript/_quality-tools.md` - TypeScript configuration and quality tools
- `.claude/best_practices/typescript/vitest.md` - Vitest testing patterns

### Notes
- No exact conditional match found (project uses Phaser, not React)
- Manually selected TypeScript + Vitest templates as most relevant
- React-specific patterns excluded

## Dependencies Snapshot

**Detected at load time:**

```json
{
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "@types/node": "^20.10.0",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "happy-dom": "^12.10.3",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^1.0.4"
  }
}
```

## Next Steps

Run `/update-practices` if dependencies change significantly.
