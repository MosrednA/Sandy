import { Grid } from '../core/Grid';
import { Material } from './Material';

import { Liquid } from './Liquid';

export class Lava extends Liquid {
    id = 14;
    name = "Lava";
    color = 0xFF4411; // Hot Red-Orange
    density = 20; // Heavier than Acid(15) and Water(10)
    dispersion = 3;
    flowRate = 0.15; // Very viscous

    update(grid: Grid, x: number, y: number): boolean {
        // Lava flows like slow water, ignites things, hardens with water

        // 1. Check for water contact - turn both to Stone
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            if (id === 3) { // Water
                // Create stone and steam
                grid.set(x, y, 1); // This lava becomes Stone
                grid.set(nx, ny, 7); // Water becomes Steam
                return true;
            }
            // Ignite flammables
            if (id === 9 && Math.random() < 0.5) { // Oil
                grid.set(nx, ny, 10); // Fire
            } else if (id === 5 && Math.random() < 0.2) { // Wood
                grid.set(nx, ny, 13); // Ember
                grid.setVelocity(nx, ny, 0.5);
            } else if (id === 11) { // Gunpowder - explode!
                grid.set(nx, ny, 10); // Will trigger explosion
            }
        }

        // 2. Emit fire/smoke occasionally
        if (Math.random() < 0.01) {
            const above = grid.get(x, y - 1);
            if (above === 0) {
                grid.set(x, y - 1, Math.random() < 0.5 ? 10 : 12); // Fire or Smoke
            }
        }

        // 3. Use Liquid movement
        return super.update(grid, x, y);
    }
}

export class Ice extends Material {
    id = 15;
    name = "Ice";
    color = 0x88CCEE; // Cyan Ice

    update(grid: Grid, x: number, y: number): boolean {
        // Ice freezes nearby water and melts near fire

        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);

            // Melt near fire/lava/ember
            if (id === 10 || id === 14 || id === 13) { // Fire, Lava, Ember
                grid.set(x, y, 3); // Turn to Water
                return true;
            }

            // Freeze nearby water
            if (id === 3 && Math.random() < 0.02) { // Water
                grid.set(x + n.dx, y + n.dy, 15); // Turn to Ice
            }
        }

        // Ice is solid - doesn't move
        return false;
    }
}


export class Gas extends Material {
    id = 17;
    name = "Gas";
    color = 0xFFEE66; // Rich Gas

    update(grid: Grid, x: number, y: number): boolean {
        // Gas rises and explodes when ignited

        // Check for fire - explode!
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === 10 || id === 14 || id === 13) { // Fire, Lava, Ember
                // Only ignite 30% of the time - slower propagation
                if (Math.random() < 0.3) {
                    this.ignite(grid, x, y);
                    return true;
                }
            }
        }

        // Decay slowly
        if (Math.random() < 0.002) {
            grid.set(x, y, 0);
            return true;
        }

        // Rise and spread - slower than before
        // Only move 40% of frames
        if (Math.random() > 0.4) {
            return false;
        }

        const dirX = Math.floor(Math.random() * 3) - 1;
        const targetX = x + dirX;
        const targetY = y - 1;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const content = grid.get(targetX, targetY);
            if (content === 0) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // Spread sideways
        const side = Math.random() < 0.5 ? -1 : 1;
        if (grid.get(x + side, y) === 0) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }

    private ignite(grid: Grid, cx: number, cy: number) {
        // Small fiery explosion
        const radius = 3;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === 255 || id === undefined) continue;

                    if (id === 17) { // Other gas - chain reaction
                        grid.set(nx, ny, 10); // Turn to fire
                    } else if (id === 0 && Math.random() < 0.5) {
                        grid.set(nx, ny, 10); // Fire
                    }
                }
            }
        }
        grid.set(cx, cy, 10); // This gas becomes fire
    }
}
