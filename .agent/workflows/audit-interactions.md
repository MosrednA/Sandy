---
description: Audit and update material-interactions.md and public/info.html with current code state
---

# Material Interactions Audit Workflow

Use this workflow to keep `feedback/material-interactions.md` synchronized with the actual codebase.

---

## 0. When to Run

- After adding a new material
- After adding/modifying interactions
- Before releases
- When planning new features

---

## 1. Verify Material Count

// turbo
```bash
# Count registered materials
grep -c "materialRegistry.register" src/materials/registerAll.ts
```

// turbo
```bash
# List all MaterialIds
grep -E "^\s+[A-Z_]+:" src/materials/MaterialIds.ts | head -30
```

Compare with the count in `material-interactions.md`.

---

## 2. Scan for Interactions

### Check each material file for interaction logic:

// turbo
```bash
# Find all neighbor checks (interaction patterns)
grep -n "MaterialId\." src/materials/Liquids.ts | head -20
```

// turbo
```bash
grep -n "MaterialId\." src/materials/Gases.ts | head -20
```

// turbo
```bash
grep -n "MaterialId\." src/materials/Energetics.ts | head -20
```

// turbo
```bash
grep -n "MaterialId\." src/materials/Elements.ts | head -20
```

// turbo
```bash
grep -n "MaterialId\." src/materials/Special.ts | head -20
```

---

## 3. Identify Interaction Patterns

Look for these code patterns that indicate interactions:

### Pattern A: Direct ID Check
```typescript
if (id === MaterialId.WATER) {
    grid.set(nx, ny, MaterialId.STEAM);
}
```

### Pattern B: Temperature-Based
```typescript
if (temp > 100) {
    grid.set(x, y, MaterialId.STEAM);
}
```

### Pattern C: Probability-Based
```typescript
if (id === MaterialId.STONE && Math.random() < 0.1) {
    grid.set(nx, ny, MaterialId.EMPTY);
}
```

### Pattern D: Chain Reaction
```typescript
if (id === MaterialId.GAS) {
    grid.set(nx, ny, MaterialId.FIRE); // Chain
}
```

---

## 4. Update the Matrix

### Add New Interactions
For each new interaction found:
1. Add to "✅ Implemented Interactions" section
2. Note the source file
3. Remove from "⬜ Missing Interactions" if it was there

### Remove Stale Entries
If an interaction was removed from code:
1. Remove from "Implemented" section
2. Optionally add to "Removed" section with reason

### Update Counts
- Update material count in header
- Update "Last Updated" date

---

## 5. Check Missing Interactions

Review the "⬜ Missing Interactions" section:

For each suggested interaction, ask:
1. Is it still relevant?
2. Has it been implemented? (move to Implemented)
3. Was it rejected? (remove or note why)

---

## 6. Temperature Audit

Verify temperature values match code:

// turbo
```bash
# Find temperature emissions
grep -n "setTemp.*[0-9]" src/materials/*.ts | head -20
```

// turbo
```bash
# Find temperature checks
grep -n "getTemp\|temp >" src/materials/*.ts | head -20
```

Update the "Temperature Reference" section if values changed.

---

## 7. Density Audit

// turbo
```bash
# Find density declarations
grep -n "density =" src/materials/*.ts
```

Update the "Density Reference" section if values changed.

---

## 8. Commit Changes

```bash
git add feedback/material-interactions.md
git commit -m "docs: update material interactions matrix"
```

---

## Quick Checklist

- [ ] Material count matches `registerAll.ts`
- [ ] All new interactions are documented
- [ ] Removed interactions are removed from doc
- [ ] Temperature values are accurate
- [ ] Density values are accurate
- [ ] "Last Updated" date is current
- [ ] Missing interactions list is reviewed

---

## Interaction Discovery Template

When adding a new interaction, document it like this:

```markdown
### Material Name
| Target         | Result                     | File          |
| -------------- | -------------------------- | ------------- |
| TargetMaterial | → ResultMaterial (chance%) | `FileName.ts` |
```

---

## Cross-Reference Commands

### Find all interactions for a specific material:
```bash
grep -n "MaterialId.WATER" src/materials/*.ts
```

### Find all explosions:
```bash
grep -n "explode\|Explode" src/materials/*.ts
```

### Find all temperature emissions:
```bash
grep -n "setTemp" src/materials/*.ts
```

### Find all phase changes:
```bash
grep -n "grid.set.*MaterialId" src/materials/*.ts | head -30
```

---

## 9. Update User-Facing Info Page

The info page at `public/info.html` should be updated when:
- New materials are added
- Interactions change
- Temperature/density values change

### Areas to update in info.html:

1. **Materials Grid** - Add new material cards with correct colors
2. **Key Interactions Tables** - Update interaction tables
3. **Gas Transformations** - Update if Gas behavior changes
4. **Natural Generation** - Update sources
5. **Reference Cards** - Temperature, density, phase changes
6. **Footer** - Update material count and date

### Material Colors Reference
Get hex colors from MaterialIds:
```bash
grep -n "color = 0x" src/materials/*.ts
```

### Quick Validation
After updating, verify the page:
// turbo
```bash
# Open info page in browser (dev server must be running)
echo "Visit http://localhost:5173/info.html to verify"
```

---

## 10. Commit All Documentation

```bash
git add feedback/material-interactions.md public/info.html
git commit -m "docs: update material documentation"
```

---

## Complete Checklist

### Technical Documentation (material-interactions.md)
- [ ] Material count matches `registerAll.ts`
- [ ] All new interactions documented
- [ ] Temperature values accurate
- [ ] Density values accurate
- [ ] "Last Updated" date current

### User Documentation (public/info.html)
- [ ] All materials have cards with correct colors
- [ ] Key interactions tables are current
- [ ] Gas transformation section updated
- [ ] Reference cards match code
- [ ] Footer material count and date updated

