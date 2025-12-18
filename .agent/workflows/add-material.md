---
description: How to add a new material to the sand simulation
---

# Adding a New Material

Follow these steps to add a new material to the simulation:

## 1. Create the Material Class

Create or update a file in `src/materials/` (e.g., `Elements.ts`, `Liquids.ts`, etc.):

```typescript
export class MyMaterial extends Material {
    id = <NEXT_AVAILABLE_ID>; // Check existing IDs, use next available
    name = "MyMaterial";
    color = 0xRRGGBB; // Hex color

    update(grid: Grid, x: number, y: number): boolean {
        // Implement physics logic
        return moved;
    }
}
```

## 2. Register Material

Materials should be registered in `src/materials/registerAll.ts`. This ensures they are registered in both the main thread and the physics worker context.

1. Add your material to `registerAllMaterials()`:
```typescript
materialRegistry.register(new MyMaterial());
```

## 3. Add UI Button with Tooltip

In `src/main.ts`, add a button in the appropriate category div:

```html
<button class="mat-btn" data-id="<ID>" data-name="Name" data-tip="Short description of what it does." style="--btn-color: #RRGGBB"></button>
```

## 5. Update Documentation

**CRITICAL: Always update `README.md` to reflect the current state of the project after adding or removing any material, feature, or tool.**

## Material IDs Currently Used

| ID  | Material   |
| --- | ---------- |
| 0   | Empty      |
| 1   | Stone      |
| 2   | Sand       |
| 3   | Water      |
| 5   | Wood       |
| 7   | Steam      |
| 8   | Acid       |
| 9   | Oil        |
| 10  | Fire       |
| 11  | Gunpowder  |
| 12  | Smoke      |
| 13  | Ember      |
| 14  | Lava       |
| 15  | Ice        |
| 17  | Gas        |
| 18  | Black Hole |
| 19  | Hot Smoke  |

Next available ID: **20**

## Glow Materials

Materials that glow in WebGL renderer (add to `WebGLRenderer.ts` `glowMaterials` set):
- Fire (10)
- Ember (13)
- Lava (14)

## Categories for UI

- **Solids**: Sand, Stone, Wood, Ice
- **Liquids**: Water, Acid, Oil, Lava
- **Gases**: Steam, Gas, Smoke, Hot Smoke
- **Fire**: Fire, Powder (gunpowder)
- **Special**: Black Hole
- **Tools**: Erase
