# Claude AI Development Guidelines

This document outlines best practices and coding standards for AI-assisted development on this project.

## File Management

### File Size Limits
- **Maximum file size: 600 lines of code**
- If a file exceeds 600 lines, refactor into smaller modules
- Use clear separation of concerns to maintain modularity

### Prioritize Editing Over Creating
- **Always prefer editing existing files over creating new ones**
- Look for consolidation opportunities in existing code patterns
- Only create new files when absolutely necessary for separation of concerns
- When creating new files, check for similar patterns that could be consolidated

## Testing Standards

### Test Priority
1. **Inline tests** - Prefer co-located tests when possible
2. **Edit existing tests** - Update tests rather than creating new ones
3. **New test files** - Only when necessary for new functionality

### Test Coverage Requirements
- **All new code must have test coverage**
- **All edited code must update corresponding tests**
- Tests must stay in sync with code changes
- Run tests before committing to ensure they pass

### Test Synchronization
- When editing code, immediately update related tests
- Never allow tests to fall out of sync with implementation
- If tests fail after code changes, fix them in the same commit

## Code Quality

### Linting
- **Lint on every commit**
- Fix all linting errors before committing
- Use `npm run lint` to check for issues
- Use `npm run lint:fix` to auto-fix when possible

### Code Coverage
- Maintain or improve test coverage with every change
- New features require corresponding tests
- Bug fixes should include regression tests

## Git Workflow

### Commit Standards
1. Run `npm run lint` before committing
2. Run `npm run test` to ensure all tests pass
3. Verify test coverage hasn't decreased
4. Write clear, descriptive commit messages

### Pre-Commit Checklist
- [ ] Code linted and passes all checks
- [ ] Tests updated to reflect code changes
- [ ] All tests passing
- [ ] Test coverage maintained or improved
- [ ] No console errors or warnings

## Testing Workflow

### Running E2E Tests
Use the port-check script to avoid hanging:
```bash
./scripts/test-with-port-check.sh [test-file]
```

This script:
- Checks if port 3000 is available
- Kills any existing processes
- Runs tests with a 180s timeout
- Cleans up on failure

### Manual Port Management
If tests hang, manually free the port:
```bash
lsof -ti:3000 | xargs kill -9
```

## Project Patterns

### Code Organization
- Keep related code co-located
- Use consistent naming conventions
- Follow existing patterns in the codebase
- Consolidate duplicate code

### Documentation
- Update README.md when features change
- Document breaking changes
- Keep LEARNINGS.md updated with common issues
- Add inline comments for complex logic

## Common Pitfalls

See `LEARNINGS.md` for:
- Common patterns and issues
- Frequently needed user corrections
- Non-obvious problems discovered during development
- Solutions to recurring problems
