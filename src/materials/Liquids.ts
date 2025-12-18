import { Grid } from '../core/Grid';
import { Liquid } from './Liquid';

export class Acid extends Liquid {
    id = 8;
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

            // Corrode Stone (1), Sand (2), Wood (5 - if exists)
            // Does not corrode Boundary (255) OR Empty (0) OR Self (8)
            if (id === 1 || id === 2 || id === 5) {
                if (Math.random() < 0.1) {
                    grid.set(nx, ny, 0); // Destroy neighbor
                    grid.set(x, y, 0);   // Destroy self
                    return true;
                }
            }
        }

        // 2. Use Liquid physics from base class
        return super.update(grid, x, y);
    }
}

export class Oil extends Liquid {
    id = 9;
    name = "Oil";
    color = 0x1A0A00; // Dark Viscous Oil
    density = 5; // Lighter than Water (10)
    dispersion = 6;
    flowRate = 0.4; // Viscous (moves horizontally 40% of frames)

    // update is inherited!
}

export class Slime extends Liquid {
    id = 20;
    name = "Slime";
    color = 0x00EE22; // Neon Radioactive Green
    density = 12; // Heavier than Water(10), lighter than Acid(15)
    dispersion = 2; // Low dispersion
    flowRate = 0.1; // Extemely viscous/thick

    update(grid: Grid, x: number, y: number): boolean {
        // Radioactive properties:
        // 1. Turn Water (3) into Acid (8)
        // 2. Ignite Wood (5) -> Fire (10)
        // 3. Mutate Stone (1) -> Sand (2) (slow erosion)

        // Unrolled loop to avoid object allocation {dx, dy}
        const nx1 = x + 0; const ny1 = y - 1;
        const nx2 = x + 0; const ny2 = y + 1;
        const nx3 = x - 1; const ny3 = y + 0;
        const nx4 = x + 1; const ny4 = y + 0;

        // Helper inline check
        const check = (nx: number, ny: number) => {
            const id = grid.get(nx, ny);
            if (id === 3) { // Water
                if (Math.random() < 0.05) grid.set(nx, ny, 8);
            } else if (id === 5) { // Wood
                if (Math.random() < 0.02) grid.set(nx, ny, 10);
            } else if (id === 1) { // Stone
                if (Math.random() < 0.005) {
                    grid.set(nx, ny, 2); // Erode to Sand
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
