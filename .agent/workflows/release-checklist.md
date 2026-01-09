---
description: Pre-release checklist for Sandy builds and deployments
---

# Release Checklist

Complete this checklist before releasing a new version of Sandy.

---

## 1. Code Quality Checks

### Linting
// turbo
```bash
npm run lint
```
- [ ] 0 errors (warnings acceptable)

### TypeScript Compilation
// turbo
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No unexpected bundle size increases

### Format Check (Optional)
// turbo
```bash
npm run format
```
- [ ] Code is consistently formatted

---

## 2. Functionality Tests

### Core Features
- [ ] **Drawing**: All materials can be placed
- [ ] **Erasing**: Right-click erases particles
- [ ] **Brush Size**: Slider changes brush size
- [ ] **Clear**: Clear button empties the canvas
- [ ] **Override**: Toggle works correctly

### Material Categories
Test at least one material from each category:

| Category   | Test Material | Expected Behavior      |
| ---------- | ------------- | ---------------------- |
| Solids     | Sand          | Falls and piles        |
| Liquids    | Water         | Flows and spreads      |
| Gases      | Steam         | Rises slowly           |
| Energetics | Fire          | Spreads, creates smoke |
| Special    | Black Hole    | Attracts particles     |

### Key Interactions
- [ ] Fire ignites Wood → creates Coal/Smoke
- [ ] Water + Lava → Steam + Stone
- [ ] Acid dissolves Stone
- [ ] Ice melts near heat sources
- [ ] Cryo freezes Water

### Temperature System
- [ ] Enable Heatmap mode
- [ ] Verify hot materials glow correctly
- [ ] Check heat spreads to neighbors
- [ ] Confirm phase changes work (Ice → Water → Steam)

---

## 3. Save/Load System

### Server Save
- [ ] Save world with name
- [ ] World appears in list
- [ ] Load saved world correctly

### File Operations
- [ ] Download world as .sand file
- [ ] Load .sand file from disk
- [ ] Delete world from server

### Error Handling
- [ ] Invalid file shows clear error message
- [ ] Server offline shows helpful message

---

## 4. Performance Check

Run stress test:
1. Fill 50% of screen with Sand
2. Add Water pool
3. Check FPS counter

- [ ] FPS stays above 30 with heavy load
- [ ] No memory leaks (check Chrome DevTools)
- [ ] Chunk sleeping reduces CPU when idle

---

## 5. Visual Check

- [ ] UI panel is readable and styled
- [ ] Material buttons show correct colors
- [ ] Glow effects work (Fire, Lava, Plasma)
- [ ] Debug overlay toggles correctly
- [ ] Heatmap overlay toggles correctly
- [ ] No visual glitches or artifacts

---

## 6. Cross-Browser Testing (Optional)

- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (if applicable)

**Known Requirements**:
- SharedArrayBuffer requires COOP/COEP headers
- WebGL 2 support required

---

## 7. Update Version

Bump version in `package.json`:
```json
{
  "version": "X.Y.Z"
}
```

Version scheme:
- **Major (X)**: Breaking changes, new save format
- **Minor (Y)**: New materials, features
- **Patch (Z)**: Bug fixes, performance improvements

---

## 8. Update Documentation

### README.md
- [ ] New materials documented
- [ ] New interactions listed
- [ ] Any control changes noted

### AI-IMPROVEMENTS.md
- [ ] Mark completed improvements as `[x]`
- [ ] Update "Last reviewed" date

---

## 9. Build Production Bundle

// turbo
```bash
npm run build
```

Check output:
// turbo
```bash
ls -la dist/
```

- [ ] `index.html` exists
- [ ] `assets/` folder contains JS/CSS
- [ ] No unexpected large files

---

## 10. Deployment

### Option A: Static Hosting
Upload `dist/` folder to:
- GitHub Pages
- Netlify
- Vercel
- Any static host

**Important**: Ensure server sends required headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Option B: With Save Server
1. Deploy `server/` to Node.js host
2. Deploy `dist/` to static host
3. Update API URL in code if needed

---

## 11. Post-Release

- [ ] Test deployed version
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push tags: `git push --tags`
- [ ] Announce release (if applicable)

---

## Quick Release Commands

```bash
# Full release flow
npm run lint && npm run build && npm run preview

# If all checks pass
git add -A
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```
