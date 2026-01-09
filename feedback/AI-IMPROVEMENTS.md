# AI Improvements

This file tracks improvements to make the Sandy codebase more maintainable, testable, and AI-friendly.

---

## High Priority

- [ ] **Testing Infrastructure**: Add tests for core systems
  - Vitest is installed ✅
  - No test files written yet
  - Priority: Grid physics, Material interactions, Serialization

---

## Medium Priority

- [x] **TypeScript Strictness**: `strict: true` enabled in `tsconfig.json`
  - Also has `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
  
- [x] **Linting & Formatting**: ESLint + Prettier configured
  - `eslint.config.js` with TypeScript support
  - `.prettierrc` for consistent formatting
  - Scripts: `npm run lint`, `npm run format`
  
- [x] **Workflows**: Project has defined workflows in `.agent/workflows/`
  - `add-material.md` - How to add new materials
  - `ai-agent-compatibility.md` - Project health check (this workflow)
  - `maintain-workflows.md` - Workflow maintenance
  
- [x] **Material Registration**: Centralized in `registerAll.ts`
  - 24 materials registered
  - Called in both `main.ts` and worker context
  
- [x] **SharedMemory**: Uses `SharedArrayBuffer` with proper cross-origin checks
  - Atomic operations for particle count sync
  - Grid, velocity, temperature buffers all shared
  
- [ ] **Documentation**: Create `docs/` folder
  - No `docs/` folder exists
  - Consider: Architecture overview, Material system docs, Performance guide

---

## Quick Wins

- [x] **Test Script**: Added `"test": "vitest"` and `"test:run": "vitest run"` to `package.json`
- [x] **Lint Script**: Added `"lint": "eslint src"` and `"lint:fix": "eslint src --fix"` to `package.json`
- [x] **Format Script**: Added `"format": "prettier --write src"` to `package.json`
- [x] **Code Comments**: Added JSDoc to `MaterialRegistry.ts`, `Grid.ts`, `Serializer.ts`
- [x] **Error Handling**: Improved error messages in `Serializer.ts` with context and actionable info

---

## File Health Metrics

| File                            | Lines | Status                            |
| ------------------------------- | ----- | --------------------------------- |
| `src/main.ts`                   | 247   | ✅ Under 300 limit                 |
| `src/core/Grid.ts`              | ~280  | ✅ Reasonable                      |
| `src/core/WorkerManager.ts`     | ~180  | ✅ Good                            |
| `src/workers/physics.worker.ts` | ~350  | ⚠️ Consider splitting              |
| `src/materials/Elements.ts`     | ~400  | ⚠️ Could extract to separate files |

---

## Sandy-Specific Verified

| Component       | Status | Notes                                       |
| --------------- | ------ | ------------------------------------------- |
| Material System | ✅      | 24 materials, centralized registration      |
| Worker System   | ✅      | SharedArrayBuffer with Atomics              |
| Save/Load       | ✅      | Server at `server/index.js`, 5 saved worlds |
| Rendering       | ✅      | WebGL + PixiJS, BlackHoleFilter shader      |
| Input           | ✅      | Line-interpolated drawing                   |

---

Last reviewed: 2026-01-09
