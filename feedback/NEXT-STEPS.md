# Sandy - Next Steps

> **Created**: 2026-01-10  
> **Target**: Move from Early Beta (63/100) to Late Beta (80/100)

---

## 🎯 Immediate Actions (This Week)

### 1. Add Core Unit Tests
**Priority**: 🔴 Critical  
**Effort**: 4-6 hours  
**Impact**: Enables safe refactoring, catches regressions

```bash
# Create test files
src/core/Grid.test.ts
src/core/Serializer.test.ts
src/materials/MaterialRegistry.test.ts
```

**Test cases for Grid.ts:**
- `get()` returns correct material ID
- `get()` returns 255 for out-of-bounds
- `set()` updates cell and wakes chunk
- `swap()` exchanges two cells correctly
- Temperature and velocity accessors work
- Chunk sleeping/waking logic

**Test cases for Serializer.ts:**
- Round-trip: serialize → deserialize equals original
- Handles empty grid
- Handles maximum temperature values
- Error on corrupted data

---

### 2. Set Up CI Pipeline
**Priority**: 🔴 Critical  
**Effort**: 1-2 hours  
**Impact**: Enforces quality on every push

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build
```

---

### 3. Split Large Files
**Priority**: 🟡 Medium  
**Effort**: 2-3 hours  
**Impact**: Better maintainability, easier navigation

**physics.worker.ts (339 lines) → Split into:**
- `physics.worker.ts` - Message handling, coordination
- `HeatConduction.ts` - `processHeatConduction()` function
- `OffGridPhysics.ts` - `processOffGridParticles()` function

**Elements.ts (~400 lines) → Split into:**
- `elements/Ice.ts`
- `elements/Lava.ts`
- `elements/Gas.ts`
- `elements/index.ts` (re-exports)

---

## 📅 Short Term (Next 2 Weeks)

### 4. Extract UI from main.ts
**Priority**: 🟡 Medium  
**Effort**: 2 hours  

Move the ~90 lines of HTML template to `src/ui/MaterialPanel.ts`:
```typescript
export function createMaterialPanel(): string {
  return `<div class="ui-panel">...</div>`;
}
```

---

### 5. Add Integration Tests for Material Interactions
**Priority**: 🟡 Medium  
**Effort**: 4-6 hours  

```typescript
// src/materials/__tests__/interactions.test.ts
describe('Material Interactions', () => {
  test('water + fire = steam', () => { ... });
  test('acid + stone = dissolve', () => { ... });
  test('ice freezes adjacent water', () => { ... });
  test('lava cools to magma rock', () => { ... });
});
```

---

### 6. Create Architecture Documentation
**Priority**: 🟡 Medium  
**Effort**: 3-4 hours  

Create `docs/ARCHITECTURE.md`:
- System overview diagram
- Data flow (main thread ↔ workers)
- Chunk sleeping algorithm
- Phase-based update pattern
- Memory layout (SharedArrayBuffer)

---

### 7. Add Object Pooling
**Priority**: 🟢 Low  
**Effort**: 2 hours  
**Impact**: Reduced GC pressure for off-grid particles

```typescript
// src/utils/ObjectPool.ts
class ParticlePool {
  private pool: OffGridParticle[] = [];
  
  acquire(): OffGridParticle { ... }
  release(p: OffGridParticle): void { ... }
}
```

---

## 🗓️ Medium Term (Next Month)

### 8. Mobile/Touch Support
- Add touch event handlers in InputHandler.ts
- Multi-touch for pinch zoom
- Touch-friendly UI sizing

### 9. Keyboard Shortcuts
- `1-9`: Select materials
- `[/]`: Decrease/increase brush size
- `C`: Clear canvas
- `Z`: Undo (if implemented)

### 10. Performance Monitoring
- Add FPS histogram
- Track particle count over time
- Identify slow chunks
- Memory usage display

### 11. Error Boundaries
- Graceful worker crash recovery
- User-friendly error messages
- Automatic state recovery

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test coverage | 0% | >70% |
| Maturity score | 63/100 | 80/100 |
| Largest file | 400 lines | <250 lines |
| CI passing | N/A | ✅ |
| Documentation | Partial | Complete |

---

## 🚀 Quick Wins (< 30 min each)

- [ ] Add `CONTRIBUTING.md` with dev setup instructions
- [ ] Add `.nvmrc` with Node version
- [ ] Add `engines` field to package.json
- [ ] Create GitHub issue templates
- [ ] Add VSCode workspace settings (`.vscode/settings.json`)

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-10 | Prioritize tests over features | No safety net for refactoring |
| 2026-01-10 | Use Vitest over Jest | Already installed, Vite-native |
| 2026-01-10 | Split physics.worker first | Highest complexity file |

---

*Review this document weekly. Move completed items to IMPROVEMENTS.md archive.*
