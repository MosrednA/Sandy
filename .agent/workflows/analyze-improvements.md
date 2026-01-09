---
description: Analyze Sandy codebase and update IMPROVEMENTS.md as a living document
---

# Improvements Analysis Workflow

Use this workflow to analyze the project, verify what's been completed, and keep `feedback/IMPROVEMENTS.md` as a current, actionable document.

---

## Philosophy

`IMPROVEMENTS.md` should be a **living document**:
- ✅ **Completed items**: Move to "Recently Completed" for 1-2 weeks, then remove entirely
- ⚠️ **Reverted items**: Keep only if still relevant; remove if resolved
- ⬜ **Pending items**: Verify still applicable, update priorities
- 🗑️ **Stale items**: Remove if no longer relevant or superseded

The goal is a **concise, actionable list** — not a historical archive.

---

## 1. Check Recently Completed Items

For each item in "✅ Completed", verify it's actually done:

// turbo
```bash
# Check for known completed features
grep -r "Mercury\|Glass\|Dust\|Plasma" src/materials/ | head -5
```

**If completed more than 2 weeks ago**: Remove from the document entirely.

---

## 2. Verify Reverted Items

For items in "⚠️ Reverted", check if they've been re-implemented:

// turbo
```bash
# Check chunk sleeping status
grep -n "activeChunks\|chunks\[" src/core/Grid.ts | head -5
```

**If fixed**: Move to Recently Completed and note the fix approach.
**If abandoned**: Remove and note why in a comment.

---

## 3. Audit Pending Improvements

### Performance Section
// turbo
```bash
# Check for object pooling patterns
grep -r "pool\|Pool" src/ | head -5
```

// turbo
```bash
# Check file sizes for architecture issues
wc -l src/main.ts src/workers/physics.worker.ts
```

### Architecture Section

Check if issues are still valid:

| Item                      | Check Command                               |
| ------------------------- | ------------------------------------------- |
| "Extract UI from main.ts" | `wc -l src/main.ts` (if < 200, may be done) |
| "TypeScript Strict Mode"  | `grep "strict" tsconfig.json`               |
| "FallingSolid Base Class" | `grep -r "extends.*Solid" src/materials/`   |

---

## 4. Check Documentation Items

// turbo
```bash
# Check if JSDoc was added to core files
grep -c "@param\|@returns" src/core/Grid.ts src/core/World.ts
```

// turbo
```bash
# Check for architecture docs
ls docs/ 2>/dev/null || echo "No docs folder"
```

---

## 5. Update the Document

### Remove Stale Items
- Items completed > 2 weeks ago
- Features that were abandoned
- Duplicate or superseded improvements

### Update Priorities
Based on current project state:
- **High**: Blocking issues or major quality improvements
- **Medium**: Nice-to-have improvements
- **Low**: Future ideas, exploratory

### Add New Items
During analysis, add any newly discovered:
- Performance bottlenecks
- Code quality issues
- Feature ideas from testing

---

## 6. Document Structure

Keep this format for consistency:

```markdown
# Sandy - Project Improvement Report

> **Last Updated**: [DATE]

---

## ✅ Recently Completed (Remove after 2 weeks)

| Task | Completed  |
| ---- | ---------- |
| ...  | YYYY-MM-DD |

---

## ⬜ Pending Improvements

### Performance
#### 1. [Title]
**Impact**: High/Medium/Low
[Description]

### Architecture
...

### Features
...

---

## 💡 New Material Ideas

| Material | Category | Behavior |
| -------- | -------- | -------- |
| ...      | ...      | ...      |

---

## 📚 Documentation

- [ ] ...
```

---

## 7. Commit Changes

// turbo
```bash
git add feedback/IMPROVEMENTS.md
git commit -m "chore: update IMPROVEMENTS.md - project analysis"
```

---

## Quick Analysis Checklist

- [ ] Remove items completed > 2 weeks ago
- [ ] Verify "Reverted" items still apply
- [ ] Check each pending item is still relevant
- [ ] Update priorities based on current needs
- [ ] Add date to "Last Updated"
- [ ] Add any new issues discovered

---

## Example: Cleaning Up Stale Items

**Before**:
```markdown
## ✅ Completed
| Fix Gas → MaterialId bug | ✅ Done |
| Temperature reset on clear | ✅ Done |
| New materials (Mercury, Glass, Dust, Plasma) | ✅ Done |
```

**After** (if all > 2 weeks old):
```markdown
## ✅ Recently Completed
(None - all items archived)
```

The completed work is preserved in git history, not the document.

---

## Frequency

Run this workflow:
- **Before releases**: Ensure document is current
- **Weekly**: During active development
- **Monthly**: During maintenance periods
