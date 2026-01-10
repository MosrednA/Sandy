# Sandy - Performance Optimization Tracker

> **Last Updated**: 2026-01-10  
> **Target**: 60 FPS with 100k+ particles

---

## ✅ Implemented Optimizations

### 1. SharedArrayBuffer + Web Workers
**Status**: ✅ Complete  
**Impact**: High  
**Description**: Physics runs in worker threads with zero-copy shared memory.
- Grid, velocity, temperature stored in SharedArrayBuffer
- Atomic operations for particle counting
- No serialization overhead between threads

### 2. Uint32 Pixel Writes
**Status**: ✅ Complete  
**Impact**: Medium  
**Description**: Write 4 bytes per pixel instead of 1 byte × 4.
- `pixelData32[i] = abgrColor` vs `pixelData[i*4] = r; pixelData[i*4+1] = g; ...`
- 4x fewer memory operations in render loop

### 3. Pre-computed Color LUTs
**Status**: ✅ Complete  
**Impact**: Medium  
**Description**: Material colors converted to ABGR format at registration.
- `materialRegistry.colors[id]` returns ready-to-write Uint32
- Zero runtime color conversion in hot render loop

### 4. Chunk-based Sleeping
**Status**: ✅ Complete (Fixed 2026-01-10)  
**Impact**: High  
**Description**: Only process chunks containing particles.
- Scan-based wake: main thread marks occupied chunks before frame
- Gravity anticipation: wake chunk below every occupied chunk
- Gas support: wake chunk above for rising particles
- ~70% reduction in processing for sparse simulations

### 5. Object Pooling (TypedArray Particles)
**Status**: ✅ Complete (2026-01-10)  
**Impact**: Medium  
**Description**: Off-grid particles stored in Float32Array pool.
- Zero GC pressure (no object allocation per particle)
- O(1) removal via swap-with-last
- Cache-friendly linear memory layout
- Direct buffer transfer to main thread

### 6. Lookup Tables (Density, Conductivity, canSleep)
**Status**: ✅ Complete  
**Impact**: Low-Medium  
**Description**: Pre-computed arrays for material properties.
- `materialRegistry.densities[id]` - no function call
- `materialRegistry.conductivities[id]` - no property access
- `materialRegistry.canSleep[id]` - fast sleep eligibility check

### 7. Static Particle Sleep
**Status**: ✅ Complete (2026-01-10)  
**Impact**: High  
**Description**: Skip particles that haven't moved in 30 frames (0.5s at 60fps).
- Per-cell `sleepTimer` in SharedArrayBuffer (Uint8, 1 byte per cell)
- Eligible materials: Sand, Stone, Glass, Ice, Coal, MagmaRock, Wood, Gunpowder, C4
- Wake on: any grid mutation (move/swap/set), significant temperature change (>5°)
- `wakeNeighbors()` resets 3×3 area around changed cell
- ~80% reduction in work for settled piles

---

## 📋 Planned Optimizations

### 8. Sparse Chunk Tracking
**Status**: 🔲 Planned  
**Impact**: Medium  
**Effort**: Medium  
**Description**: Track occupied chunks incrementally instead of full scan.
- Maintain `occupiedChunks` set, update on particle set/clear
- Avoid O(width×height) scan each frame
- Trade-off: More bookkeeping vs cheaper wake

### 9. OffscreenCanvas Rendering
**Status**: 🔲 Planned  
**Impact**: Medium  
**Effort**: High  
**Description**: Move rendering to a dedicated worker.
- Main thread only handles input/UI
- Render worker reads grid from SharedArrayBuffer
- Requires OffscreenCanvas API support

---

## ❌ Rejected/Deferred

### Jitter Offset
**Status**: ❌ Removed  
**Reason**: Caused particles to freeze at screen edges.
- Cell shuffle provides sufficient randomization
- Edge clamping created gaps in processing

### WASM Physics
**Status**: 🔲 Deferred  
**Reason**: Complexity vs marginal gains.
- JS is already fast with TypedArrays
- Would require rewriting material logic
- May revisit if hitting CPU limits

---

## 📊 Benchmarks

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Empty grid | 60 FPS | 60 FPS | - |
| 10k sand | 58 FPS | 60 FPS | +3% |
| 50k water | 45 FPS | 55 FPS | +22% |
| 100k mixed | 30 FPS | 48 FPS | +60% |

*Benchmarks on Intel i7-12700K, Chrome 120*

---

## 🔧 Profiling Tips

```bash
# Chrome DevTools
1. Open DevTools → Performance tab
2. Record 5 seconds of simulation
3. Look for:
   - Long "Scripting" blocks (physics)
   - "Minor GC" spikes (object allocation)
   - "Rendering" blocks (WebGL)

# Key metrics
- Frame time < 16.67ms for 60 FPS
- Worker utilization (should be ~100% during physics)
- GC pauses (should be rare with pooling)
```

---

*See [performance.mmd](performance.mmd) for visual flowchart.*
