import { Grid } from '../core/Grid';
import { Liquid } from './Liquid';

export class Acid extends Liquid {
    id = 8;
    name = "Acid";
    color = 0x33FF66; // Toxic Green
    density = 15; // Heavier than water (10)
    dispersion = 5;

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

    // update is inherited!
}
