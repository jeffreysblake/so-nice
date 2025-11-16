# Memory System

This directory contains Claude Code's memory and state tracking files.

## Files

### `.claude-memory`
**Purpose**: Universal rules and principles loaded in every session
**Type**: Static, version-controlled
**Contains**: Anti-bloat principles, TDD workflow, file size limits

### `loaded_templates.md`
**Purpose**: Tracks which best practice templates are currently loaded
**Type**: Generated, gitignored
**Created by**: `/setup-stack` command
**Updated by**: `/update-practices` command

### `loaded_templates.md.template`
**Purpose**: Template structure for generating `loaded_templates.md`
**Type**: Static, version-controlled
**Used by**: `/setup-stack` slash command during template extraction/injection

## State Tracking with `loaded_templates.md`

The `loaded_templates.md` file serves two critical purposes:

### 1. Canary File (Double Validation)

Along with `CLAUDE.md` in the project root, this file acts as a canary to indicate that the project has been properly initialized:

```bash
# Both must exist for best practices to load
./CLAUDE.md                          # Created by /init
./.claude/memory/loaded_templates.md # Created by /setup-stack
```

**Why double canary?**
- Prevents false triggers in the template repo itself
- Ensures both project initialization (/init) AND stack setup (/setup-stack) have run
- Use `--skip-init-check` flag to bypass when testing

### 2. State Tracking

The file tracks:

**Frontmatter (YAML)**:
- `detected_stack`: Which tech stack was detected (e.g., "python-fastapi")
- `loaded_at`: ISO timestamp of when templates were loaded
- `conditional`: Which conditional file matched
- `core_templates`: List of always-loaded template files
- `conditional_templates`: Map of dependency → template file
- `dependencies_snapshot`: Detected files and dependencies at load time

**Content (Markdown)**:
- Human-readable summary of what's loaded
- Instructions for updating
- Debugging guidance

## Extraction/Injection Model

When `/setup-stack` runs:

1. **Scan Project**
   - Look for fingerprint files (package.json, requirements.txt, etc.)
   - Parse dependencies

2. **Match Conditional**
   - Check `.claude/conditionals/tech-stacks/*.md`
   - Find matching conditional based on files + dependencies

3. **Read Template Metadata**
   - Parse frontmatter from best practice files
   - Build list: core + conditional templates

4. **Extract Content**
   - Read each best practice file
   - **Strip frontmatter** (not needed in CODE.md)
   - Extract only the content

5. **Inject into CODE.md**
   - Clear existing content between canary markers
   - Inject extracted content (clean, no frontmatter)
   - Keep CODE.md lean

6. **Generate loaded_templates.md**
   - Use `loaded_templates.md.template` as base
   - Replace placeholders with actual values
   - Write to `.claude/memory/loaded_templates.md`
   - This file is gitignored

## Why Frontmatter is Stripped

**Frontmatter is for tooling, not context.**

- Best practice files have frontmatter for `/setup-stack` to parse
- Normal sessions don't need this metadata
- Stripping keeps CODE.md lean and focused
- Only content (actual best practices) gets injected

## Updating Templates

When dependencies change:

```bash
/update-practices
```

This will:
1. Check both canary files exist
2. Re-scan project dependencies
3. Compare with `dependencies_snapshot` in `loaded_templates.md`
4. Re-extract and re-inject if changes detected
5. Update `loaded_templates.md` with new timestamp and snapshot

## Temporary Contexts

Some templates can be loaded temporarily:

```bash
/context:testing
```

This loads context-specific templates (e.g., testing patterns) without modifying `loaded_templates.md`. Use `/context:clear` to unload.
