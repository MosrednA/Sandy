import { Grid } from '../core/Grid';
import { Liquid } from './Liquid';
import { MaterialId } from './MaterialIds';

export class Acid extends Liquid {
    id = MaterialId.ACID;
    name = "Acid";
    color = 0xCCFF33; // Acidic Yellow-Green
    density = 15; // Heavier than water (10)
    dispersion = 5;
    flowRate = 1.0; // Water-like viscosity

    update(grid: Grid, x: number, y: number): boolean {
        // 1. Check for corrosion first
        // Check neighbors (down, left, right)
        const neighbors = [
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            // Corrode Stone, Sand, Wood
            if (id === MaterialId.STONE || id === MaterialId.SAND || id === MaterialId.WOOD) {
                if (Math.random() < 0.1) {
                    grid.set(nx, ny, MaterialId.EMPTY);
                    grid.set(x, y, MaterialId.EMPTY);
                    return true;
                }
            }
            // Acid melts Ice very fast
            else if (id === MaterialId.ICE) {
                if (Math.random() < 0.3) { // 30% - faster than fire
                    grid.set(nx, ny, MaterialId.WATER);
                    // Acid neutralized slightly
                    if (Math.random() < 0.2) grid.set(x, y, MaterialId.EMPTY);
                }
            }
            // Acid + Lava = toxic smoke reaction
            else if (id === MaterialId.LAVA) {
                if (Math.random() < 0.2) {
                    grid.set(nx, ny, MaterialId.HOT_SMOKE); // Toxic fumes
                    grid.set(x, y, MaterialId.SMOKE);
                    return true;
                }
            }
        }

        // 2. Use Liquid physics from base class
        return super.update(grid, x, y);
    }
}

export class Oil extends Liquid {
    id = MaterialId.OIL;
    name = "Oil";
    color = 0x1A0A00; // Dark Viscous Oil
    density = 5; // Lighter than Water (10)
    dispersion = 6;
    flowRate = 0.4; // Viscous (moves horizontally 40% of frames)

    // update is inherited!
}

export class Slime extends Liquid {
    id = MaterialId.POISON;
    name = "Slime";
    color = 0x00EE22; // Neon Radioactive Green
    density = 12; // Heavier than Water(10), lighter than Acid(15)
    dispersion = 2; // Low dispersion
    flowRate = 0.1; // Extemely viscous/thick

    update(grid: Grid, x: number, y: number): boolean {
        // Radioactive properties:
        // 1. Turn Water into Acid
        // 2. Ignite Wood -> Fire
        // 3. Mutate Stone -> Sand (slow erosion)

        // Unrolled loop to avoid object allocation {dx, dy}
        const nx1 = x + 0; const ny1 = y - 1;
        const nx2 = x + 0; const ny2 = y + 1;
        const nx3 = x - 1; const ny3 = y + 0;
        const nx4 = x + 1; const ny4 = y + 0;

        // Helper inline check
        const check = (nx: number, ny: number) => {
            const id = grid.get(nx, ny);
            if (id === MaterialId.WATER) {
                if (Math.random() < 0.05) grid.set(nx, ny, MaterialId.ACID);
            } else if (id === MaterialId.WOOD) {
                if (Math.random() < 0.02) grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.STONE) {
                if (Math.random() < 0.005) {
                    grid.set(nx, ny, MaterialId.SAND); // Erode to Sand
                    // Also maybe Slime gets consumed?
                }
            }
        };

        if (ny1 >= 0) check(nx1, ny1);
        if (ny2 < grid.height) check(nx2, ny2);
        if (nx3 >= 0) check(nx3, ny3);
        if (nx4 < grid.width) check(nx4, ny4);

        // Glow effect (randomly emit light/spark?)
        // Let's just keep it simple for now.

        return super.update(grid, x, y);
    }
}

