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

## 2. Register in Main Thread

In `src/main.ts`, add:
- Import: `import { MyMaterial } from './materials/MyFile';`
- Register: `materialRegistry.register(new MyMaterial());`

## 3. Register in Physics Worker

In `src/workers/physics.worker.ts`, add the same:
- Import: `import { MyMaterial } from '../materials/MyFile';`
- Register: `materialRegistry.register(new MyMaterial());`

## 4. Add UI Button with Tooltip

In `src/main.ts`, add a button in the appropriate category div:

```html
<button class="mat-btn" data-id="<ID>" data-name="Name" data-tip="Short description of what it does." style="--btn-color: #RRGGBB"></button>
```

**IMPORTANT: Always include `data-tip` with a helpful description!**

## Material IDs Currently Used

| ID  | Material  |
| --- | --------- |
| 0   | Empty     |
| 1   | Stone     |
| 2   | Sand      |
| 3   | Water     |
| 5   | Wood      |
| 7   | Steam     |
| 8   | Acid      |
| 9   | Oil       |
| 10  | Fire      |
| 11  | Gunpowder |
| 12  | Smoke     |
| 13  | Ember     |
| 14  | Lava      |
| 15  | Ice       |
| 16  | Plant     |
| 17  | Gas       |

Next available ID: **18**

## Glow Materials

Materials that glow in WebGL renderer (add to `WebGLRenderer.ts` `glowMaterials` set):
- Fire (10)
- Ember (13)
- Lava (14)

## Categories for UI

- **Solids**: Sand, Stone, Wood, Ice
- **Liquids**: Water, Acid, Oil, Lava
- **Gases**: Steam, Gas
- **Fire**: Fire, Powder (gunpowder)
- **Nature**: Plant
- **Tools**: Erase
