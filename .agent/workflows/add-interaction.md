---
description: Add a new interaction between two materials (e.g., fire + water → steam)
---

# Adding Material Interactions

Use this workflow when you want to create new interactions between existing materials.

---

## 0. Understand the Interaction Model

Material interactions happen in the `update()` method of each material class.
The pattern is:
1. Check neighboring cells for target materials
2. Apply the interaction (transform, destroy, spawn new particles)
3. Wake affected chunks

**Common interaction types**:
- **Transformation**: A + B → C (water + lava → steam + stone)
- **Destruction**: A dissolves B (acid + stone → acid spreads)
- **Chain Reaction**: A triggers B (fire + gunpowder → explosion)
- **Temperature-based**: Heat transfer causes phase change

---

## 1. Identify Materials Involved

Determine which material initiates the interaction:
- If **Fire burns Wood**, modify `Fire.ts` (fire is the active agent)
- If **Water extinguishes Fire**, modify `Water.ts` (water is the active agent)
- For mutual interactions, choose the more "active" material

// turbo
```bash
# List all material files
ls src/materials/
```

---

## 2. Locate the Update Method

Open the initiating material's file and find the `update()` method:

```typescript
// Example structure in a material file
update(grid: Grid, x: number, y: number): void {
    // 1. Get neighbors
    const below = grid.get(x, y + 1);
    const left = grid.get(x - 1, y);
    const right = grid.get(x + 1, y);
    
    // 2. Check for interaction targets
    if (below === MaterialIds.WOOD) {
        // Apply interaction
    }
    
    // 3. Call parent update for movement physics
    super.update(grid, x, y);
}
```

---

## 3. Add the Interaction Logic

### Pattern A: Simple Transformation
```typescript
// Fire ignites Oil → more Fire
if (below === MaterialIds.OIL) {
    grid.set(x, y + 1, MaterialIds.FIRE);
    return; // Fire consumed the oil
}
```

### Pattern B: With Probability
```typescript
// Acid has 10% chance to dissolve Stone
if (below === MaterialIds.STONE && Math.random() < 0.1) {
    grid.set(x, y + 1, MaterialIds.EMPTY);
    // Optionally consume the acid too
    // grid.set(x, y, MaterialIds.EMPTY);
}
```

### Pattern C: Temperature-Based
```typescript
// Check temperature for phase change
const temp = grid.getTemp(x, y);
if (temp > 100 && this.id === MaterialIds.WATER) {
    grid.set(x, y, MaterialIds.STEAM);
    grid.setTemp(x, y, temp); // Preserve temperature
    return;
}
```

### Pattern D: Spawn Multiple Particles
```typescript
// Explosion spawns fire in radius
for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
        if (grid.get(x + dx, y + dy) === MaterialIds.EMPTY) {
            grid.set(x + dx, y + dy, MaterialIds.FIRE);
        }
    }
}
```

---

## 4. Check Material IDs

Ensure you're using the correct material IDs:

// turbo
```bash
# View MaterialIds constants
cat src/materials/MaterialIds.ts
```

---

## 5. Test the Interaction

1. Run the dev server:
// turbo
```bash
npm run dev
```

2. Manual testing steps:
   - Place both materials adjacent to each other
   - Enable Debug mode to see chunk activity
   - Enable Heatmap for temperature interactions
   - Verify the expected outcome occurs

---

## 6. Edge Cases to Consider

- [ ] What if the target cell is at the grid boundary?
- [ ] Should the interaction consume the source material?
- [ ] Is there a chain reaction risk (infinite loops)?
- [ ] Does the interaction respect density (liquids vs solids)?
- [ ] Should temperature be preserved/transferred?

---

## 7. Update Documentation

If the interaction is significant, add it to:

1. **README.md** - In the Interactions section:
```markdown
- 🔥 Fire spreads to wood, ignites oil
- 💧 Water extinguishes fire, creates steam near lava
```

2. **Material tooltip** in `main.ts`:
```typescript
data-tip="Burns everything. Ignites oil instantly."
```

---

## Example: Adding "Cryo Freezes Slime"

```typescript
// In Cryo.ts or Gases.ts (Cryo class)
update(grid: Grid, x: number, y: number): void {
    // Check all 4 neighbors
    const neighbors = [
        [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
    ];
    
    for (const [nx, ny] of neighbors) {
        if (grid.get(nx, ny) === MaterialIds.SLIME) {
            // Freeze slime into ice
            grid.set(nx, ny, MaterialIds.ICE);
            grid.setTemp(nx, ny, -10); // Set cold temperature
        }
    }
    
    super.update(grid, x, y);
}
```

---

## Quick Reference: Common Material IDs

| Material | ID  | Type   |
| -------- | --- | ------ |
| EMPTY    | 0   | -      |
| STONE    | 1   | Solid  |
| SAND     | 2   | Powder |
| WATER    | 3   | Liquid |
| FIRE     | 10  | Energy |
| STEAM    | 7   | Gas    |
| ICE      | 15  | Solid  |
| LAVA     | 14  | Liquid |

See `src/materials/MaterialIds.ts` for the complete list.
