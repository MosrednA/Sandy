---
description: Analyze Sandy project state, track AI-IMPROVEMENTS.md progress, suggest new improvements
---

# Sandy Project Health Check Workflow

Use this workflow to maintain the Sandy falling-sand simulation and track improvement progress.

## 0. Ensure AI-IMPROVEMENTS.md Exists

**Purpose**: `feedback/AI-IMPROVEMENTS.md` tracks improvements for maintainability, testability, and AI-friendliness.

**If the file does not exist**, create it at `feedback/AI-IMPROVEMENTS.md` with project-specific items:
- High Priority: Testing, Linting, Performance profiling
- Medium Priority: Documentation, Material system cleanup, Worker optimizations
- Quick Wins: Type exports, Error handling, Code comments

Use checkbox format: `[ ]` uncompleted, `[/]` in progress, `[x]` completed.

---

## 1. Review Current AI-IMPROVEMENTS.md Status

Read `feedback/AI-IMPROVEMENTS.md` and categorize items:
- `[x]` Done
- `[/]` In progress
- `[ ]` Uncompleted

---

## 2. Verify Completed Items

For each claimed-complete item, verify it actually exists:

### Testing Infrastructure
// turbo
```bash
# Check for vitest in package.json
grep -i "vitest" package.json
```
// turbo
```bash
# Look for test files
npx fd -e test.ts -e spec.ts src/
```

### TypeScript Strictness
// turbo
```bash
# Check tsconfig.json for strict mode
grep -E "\"strict\":|\"noImplicitAny\":|\"strictNullChecks\":" tsconfig.json
```
// turbo
```bash
# Verify no type errors
npm run build
```

### ESLint/Prettier
// turbo
```bash
# Check for linting config files
npx fd -g "*.eslintrc*" -g "eslint.config.*" -g ".prettierrc*" .
```
// turbo
```bash
# Check for lint script in package.json
grep -i "\"lint\"" package.json
```

### Workflows
// turbo
```bash
# List all workflows
ls -la .agent/workflows/
```

### Documentation
- Check `README.md` for up-to-date project structure
- Check if `docs/` folder exists with API or architecture docs
- Verify the `/add-material` workflow is accurate

---

## 3. Sandy-Specific Checks

### Material System Integrity
// turbo
```bash
# List all material files
ls src/materials/
```
// turbo
```bash
# Check MaterialRegistry exports all materials
grep -c "register" src/materials/registerAll.ts
```

### Core System Health
// turbo
```bash
# Check core module sizes (identify potential bloat)
wc -l src/core/*.ts
```

### Worker System
// turbo
```bash
# Verify worker files exist
ls src/workers/
```
// turbo
```bash
# Check SharedMemory is properly typed
grep -c "SharedArrayBuffer" src/core/SharedMemory.ts
```

### Rendering System
// turbo
```bash
# Check rendering modules
ls src/rendering/
```

### Server Health (Save/Load)
// turbo
```bash
# Check server entry point exists
ls server/index.js
```
// turbo
```bash
# Check saved worlds directory
ls server/worlds/ 2>/dev/null || echo "No saved worlds yet"
```

---

## 4. Update AI-IMPROVEMENTS.md

Based on findings:
- Mark verified completed items as `[x]`
- Add any newly discovered improvement opportunities
- Update priorities based on project needs
- Add date stamp: `Last reviewed: YYYY-MM-DD`

---

## 5. Suggest Next Actions

Recommend 2-3 highest priority items based on:

| Priority Factor      | Sandy-Specific Examples                           |
| -------------------- | ------------------------------------------------- |
| Performance impact   | Worker optimizations, Grid algorithm improvements |
| Code quality         | Material base class cleanup, Type exports         |
| Developer experience | Testing, Linting, Better error messages           |
| Feature stability    | Save/Load reliability, Material interactions      |

---

## 6. Commit Changes (Optional)

If AI-IMPROVEMENTS.md was updated:
```bash
git add feedback/AI-IMPROVEMENTS.md
git commit -m "chore: update AI-IMPROVEMENTS.md - project health check"
```

---

## Quick Reference: Project Structure

```
Sandy/
├── src/
│   ├── core/           # World, Grid, SharedMemory, Constants, Serializer
│   ├── materials/      # Sand, Water, Fire, BlackHole, MaterialRegistry
│   ├── rendering/      # WebGLRenderer, BlackHoleFilter
│   ├── input/          # InputHandler (line-interpolated drawing)
│   ├── workers/        # Physics worker (multi-threaded)
│   ├── ui/             # UI components
│   └── main.ts         # Entry point
├── server/             # Express server for save/load
│   ├── index.js
│   └── worlds/         # Saved world files
├── feedback/           # AI-IMPROVEMENTS.md, IMPROVEMENTS.md
└── .agent/workflows/   # AI agent workflows
```

---

## Key Files to Monitor

| File                                | Purpose              | Health Metric             |
| ----------------------------------- | -------------------- | ------------------------- |
| `src/main.ts`                       | Entry point          | Should stay < 300 lines   |
| `src/core/Grid.ts`                  | Physics grid         | Core performance impact   |
| `src/materials/MaterialRegistry.ts` | Material lookup      | Must export all materials |
| `src/core/WorkerManager.ts`         | Worker orchestration | Thread safety             |
| `src/core/SharedMemory.ts`          | Atomic operations    | Memory safety             |
| `server/index.js`                   | Save/Load API        | Error handling            |