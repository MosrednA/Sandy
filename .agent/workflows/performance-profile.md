---
description: Profile and optimize Sandy performance (FPS, particle count, physics)
---

# Performance Profiling Workflow

Use this workflow to identify and fix performance bottlenecks in the simulation.

---

## 0. Establish Baseline

Before optimizing, measure current performance:

// turbo
```bash
npm run dev
```

**Record these metrics**:
- [ ] FPS with 0 particles
- [ ] FPS with 10,000 particles
- [ ] FPS with 50,000 particles
- [ ] FPS at "stress test" (fill screen with sand)

---

## 1. Quick Performance Checks

### Check Build Size
// turbo
```bash
npm run build
```

Large bundles indicate potential code splitting opportunities.

### Check for TypeScript Errors
// turbo
```bash
npx tsc --noEmit
```

Type errors can cause runtime overhead.

---

## 2. Chrome DevTools Profiling

### CPU Profile
1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click Record (●)
4. Interact with simulation for 5-10 seconds
5. Stop recording
6. Look for:
   - Long frames (> 16ms)
   - Hot functions (high "Self Time")
   - Frequent garbage collection

### Key Files to Watch
| File                | What to Look For                    |
| ------------------- | ----------------------------------- |
| `physics.worker.ts` | Main physics loop, material updates |
| `Grid.ts`           | Cell access patterns, chunk waking  |
| `WebGLRenderer.ts`  | Draw calls, texture updates         |
| `WorkerManager.ts`  | Worker communication overhead       |

---

## 3. Common Bottlenecks

### A. Physics Worker (~70% of CPU)

**Hot Path**: The double loop in `physics.worker.ts`
```typescript
for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
        // This runs 256x256 = 65,536 times per frame!
    }
}
```

**Optimizations**:
- ✅ Chunk sleeping (already implemented)
- ✅ Early exit for empty cells
- ⚠️ Avoid function calls in hot loop
- ⚠️ Use direct array access, not methods

### B. Rendering (~20% of CPU)

**Hot Path**: Pixel color writes in `WebGLRenderer.ts`
```typescript
// Current: O(1) lookup via pre-computed colors
pixels[idx] = materialRegistry.colors[cellValue];
```

**Check**:
- Are we using `Uint32Array` for single-write pixels? ✅
- Are colors pre-computed in ABGR format? ✅

### C. Worker Communication (~5% of CPU)

**Check**: Message passing between main thread and worker
- SharedArrayBuffer avoids copying ✅
- Minimize `postMessage` calls ✅

---

## 4. Chunk Sleeping Efficiency

The chunk system skips inactive regions. Verify it's working:

1. Enable Debug mode in the UI
2. Look for green chunks (active) vs dark chunks (sleeping)
3. Place particles and watch chunks wake/sleep

**If chunks never sleep**:
- Check `Grid.wake()` is not over-triggering
- Verify `swapChunks()` is called each frame

---

## 5. Memory Profiling

### Check Memory Usage
1. Chrome DevTools → **Memory** tab
2. Take heap snapshot
3. Look for:
   - Large arrays (expected: grid buffers)
   - Unexpected object retention
   - Growing memory over time (leak)

**Expected Large Objects**:
| Object                | Size (256x256 grid) |
| --------------------- | ------------------- |
| Grid cells (Uint8)    | 64 KB               |
| Velocity (Float32)    | 256 KB              |
| Temperature (Float32) | 256 KB              |
| Pixel buffer (Uint32) | 256 KB              |

---

## 6. Stress Tests

### Test 1: Sand Avalanche
1. Fill top half with Sand
2. Delete a stone wall
3. Measure FPS as sand falls

### Test 2: Liquid Pool
1. Create large water pool
2. Add oil (floats) and acid (reacts)
3. Check for FPS drops during reactions

### Test 3: Fire Spread
1. Create wood structure
2. Ignite one corner
3. Measure FPS as fire spreads

### Test 4: Black Hole
1. Place Black Hole in center
2. Spawn particles around it
3. Check for gravity calculation overhead

---

## 7. Optimization Checklist

### Before Optimizing
- [ ] Profile first, don't guess
- [ ] Establish measurable baseline
- [ ] Focus on hot paths (> 5% CPU time)

### Low-Hanging Fruit
- [ ] Replace `Math.floor()` with `| 0` in hot loops
- [ ] Cache array lengths in loops
- [ ] Use `const` for unchanging values
- [ ] Avoid object creation in hot paths

### Advanced
- [ ] Consider WASM for physics (major refactor)
- [ ] WebGL compute shaders for parallel physics
- [ ] Multiple Web Workers for grid regions

---

## 8. Performance Regression Testing

After changes, verify no regression:

// turbo
```bash
npm run build
```

**Quick benchmark**:
1. Load a saved world with many particles
2. Record FPS for 10 seconds
3. Compare with baseline

---

## File Reference

| File                             | Performance Impact             |
| -------------------------------- | ------------------------------ |
| `src/workers/physics.worker.ts`  | 🔴 Critical - main physics loop |
| `src/core/Grid.ts`               | 🔴 Critical - cell access       |
| `src/rendering/WebGLRenderer.ts` | 🟡 High - rendering loop        |
| `src/core/WorkerManager.ts`      | 🟡 High - worker sync           |
| `src/materials/*.ts`             | 🟢 Medium - per-material logic  |
| `src/main.ts`                    | 🟢 Low - initialization only    |
