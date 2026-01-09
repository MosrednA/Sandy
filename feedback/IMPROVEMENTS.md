# Sandy - Project Improvement Report

> **Last Updated**: 2026-01-09  
> **Analysis Scope**: Full codebase review

---

## ⬜ Pending Improvements

### Performance

#### 1. Object Pooling for Off-Grid Particles
**Impact**: Medium  
Reduce GC pressure by reusing particle objects instead of `push({...})` in `Grid.addOffGridParticle()`.

#### 2. Spatial Hashing for Collision Detection
**Impact**: Low  
Use spatial partitioning for faster off-grid particle collision checks (only relevant with many projectiles).

---

### Architecture

#### 1. Extract UI from `main.ts`
**Impact**: Medium  
Move ~90 lines of HTML template to `src/ui/MaterialPanel.ts`. Current size: 214 lines.

#### 2. Abstract `FallingSolid` Base Class
**Impact**: Medium  
Create shared base class for Sand, Coal, MagmaRock, Gunpowder to reduce code duplication.

---

### Features

#### 1. Mobile/Touch Support
**Impact**: Medium  
Add touch event handlers to `InputHandler.ts` for mobile devices.

#### 2. Wind System
**Impact**: Low  
Add global wind vector affecting gas movement with UI slider.

#### 3. Undo/Redo System
**Impact**: Low  
Track state changes for undo functionality. Complex due to grid size.

#### 4. Material Spawners
**Impact**: Low  
Continuous-output blocks (water fountain, fire source, etc.)

#### 5. Brush Shapes
**Impact**: Low  
Add circle, square, line brush options to InputHandler.

#### 6. Pressure System
**Impact**: Low  
Simulate liquid pressure pushing upward in confined spaces.

---

## 💡 New Material Ideas

| Material        | Category | Behavior                             |
| --------------- | -------- | ------------------------------------ |
| **Rubber**      | Solid    | Bouncy, absorbs explosions           |
| **Mud**         | Liquid   | Thick, slows movement, dries to dirt |
| **Lightning**   | Special  | Chain-arcs between conductors        |
| **Electricity** | Special  | Flows through metals, zaps water     |
| **Vine**        | Solid    | Grows slowly, burns easily           |
| **Snow**        | Solid    | Piles up, melts to water             |

---

## 📚 Documentation

- [ ] Create `docs/ARCHITECTURE.md` explaining chunk/worker system
- [ ] Document material interaction matrix
- [x] Add JSDoc to `Grid.ts` (partial - 3 annotations added)
- [ ] Add JSDoc to `World.ts`, `WorkerManager.ts`

---

## ✅ Recently Verified (Archive after 2 weeks)

These items have been verified as complete and will be removed in future cleanups:

| Task                                         | Verified   |
| -------------------------------------------- | ---------- |
| TypeScript strict mode enabled               | 2026-01-09 |
| Chunk sleeping implemented in Grid.ts        | 2026-01-09 |
| New materials (Mercury, Glass, Dust, Plasma) | 2026-01-09 |
| Conductivity LUT pre-computed                | 2026-01-09 |

---

*Previous completed items (Gas bug, temperature reset, canvas sizing, commented code cleanup, batch messaging) have been archived to git history.*
