# Sandy - Project Improvement Report

> **Generated**: January 1, 2026  
> **Last Updated**: January 2, 2026  
> **Analysis Scope**: Full codebase deep-dive

---

## ✅ Completed

| Task                                         | Status |
| -------------------------------------------- | ------ |
| Fix Gas → MaterialId bug                     | ✅ Done |
| Temperature reset on clear                   | ✅ Done |
| Remove duplicate canvas sizing               | ✅ Done |
| Clean up commented code                      | ✅ Done |
| Pre-compute conductivity LUT                 | ✅ Done |
| Batch message passing (Transferable)         | ✅ Done |
| New materials (Mercury, Glass, Dust, Plasma) | ✅ Done |

---

## ⚠️ Reverted

### Chunk Sleeping Optimization
**File**: `src/workers/physics.worker.ts`

Implementation caused particles to freeze mid-air. The wake propagation logic needs redesign — when a particle falls, chunks above it must also be woken so waiting particles can fill the space.

**Future approach**: Need to wake a vertical column of chunks, not just immediate neighbors.

---

## ⬜ Pending Improvements

### Performance

#### 1. Object Pooling for Off-Grid Particles
**Impact**: Medium  
Reduce GC pressure by reusing particle objects instead of `push({...})`.

#### 2. Spatial Hashing for Collision Detection
**Impact**: Low-Medium  
Use spatial partitioning for faster off-grid particle collision checks.

#### 3. SIMD Temperature Updates
**Impact**: Low  
Explore WASM SIMD for bulk temperature array operations.

---

### Architecture

#### 1. Extract UI from `main.ts`
**Impact**: High (maintainability)  
Move 90+ lines of HTML to `src/ui/MaterialPanel.ts`.

#### 2. Abstract `FallingSolid` Base Class
**Impact**: Medium  
Reduce duplication across Sand, Coal, MagmaRock, Gunpowder.

#### 3. TypeScript Strict Mode
**Impact**: Medium  
Enable `strict: true` in `tsconfig.json` to catch null issues.

---

### Features

#### 1. Mobile/Touch Support
Add touch event handlers to `InputHandler.ts` for mobile devices.

#### 2. Wind System
Add global wind vector affecting gas movement with UI slider.

#### 3. Debug Overlay
Toggle-able view showing:
- Active chunk boundaries
- Temperature heatmap
- Velocity vectors

#### 4. Undo/Redo System
Track state changes for undo functionality.

#### 5. Material Spawners
Continuous-output blocks (water fountain, fire source, etc.)

#### 6. Brush Shapes
Add circle, square, line brush options.

#### 7. Pressure System
Simulate liquid pressure pushing upward in confined spaces.

#### 8. Sound Effects
Add ambient sounds for fire crackling, water flowing, explosions.

---

### New Material Ideas

| Material        | Category  | Behavior                             |
| --------------- | --------- | ------------------------------------ |
| **Rubber**      | Solid     | Bouncy, absorbs explosions           |
| **Mud**         | Liquid    | Thick, slows movement, dries to dirt |
| **Lightning**   | Special   | Chain-arcs between conductors        |
| **Electricity** | Special   | Flows through metals, zaps water     |
| **Vine**        | Solid     | Grows slowly, burns easily           |
| **Snow**        | Solid     | Piles up, melts to water             |
| **Smoke Bomb**  | Energetic | Creates large smoke cloud            |

---

## Documentation

- [ ] Add JSDoc to `Grid.ts`, `World.ts`, `WorkerManager.ts`
- [ ] Create `ARCHITECTURE.md` explaining chunk/worker system
- [ ] Document material interaction matrix
