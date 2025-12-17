import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Wood extends Material {
    id = 5;
    name = "Wood";
    color = 0x8B4513; // SaddleBrown

    update(grid: Grid, x: number, y: number): boolean {
        // Wood is a static solid that starts smoldering when touched by fire/ember

        // Check for neighboring fire or ember
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === 10) { // Fire - immediately start smoldering
                if (Math.random() < 0.15) {
                    grid.set(x, y, 13); // Turn to Ember
                    grid.setVelocity(x, y, 0.3); // Start with some heat
                    return true;
                }
            } else if (id === 13) { // Ember - slowly heat up
                // Get neighbor's heat and transfer some
                const neighborHeat = grid.getVelocity(x + n.dx, y + n.dy);
                if (neighborHeat > 0.5 && Math.random() < 0.02) {
                    grid.set(x, y, 13); // Start smoldering
                    grid.setVelocity(x, y, 0.1); // Start with low heat
                    return true;
                }
            }
        }

        // Wood doesn't move - it's a solid
        return false;
    }
}

export class Ember extends Material {
    id = 13;
    name = "Ember";
    color = 0xFF6600; // Orange (smoldering)

    update(grid: Grid, x: number, y: number): boolean {
        // Ember is smoldering wood that slowly heats up and can emit fire

        // Get current heat (stored in velocity)
        let heat = grid.getVelocity(x, y);

        // Slowly increase heat over time
        heat += 0.01 + Math.random() * 0.01;

        // Clamp heat
        if (heat > 1.5) heat = 1.5;

        // Update color based on heat (darker when cooler, brighter when hotter)
        // We can't change color dynamically easily, but the behavior changes

        // 1. If hot enough, chance to emit fire into empty neighbor space
        if (heat > 0.8) {
            const neighbors = [
                { dx: 0, dy: -1 },  // up (fire rises)
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
            ];

            for (const n of neighbors) {
                const id = grid.get(x + n.dx, y + n.dy);
                if (id === 0 && Math.random() < 0.08) { // Increased from 0.03
                    // Emit fire or smoke
                    if (Math.random() < 0.7) {
                        grid.set(x + n.dx, y + n.dy, 10); // Emit fire
                    } else {
                        grid.set(x + n.dx, y + n.dy, 12); // Emit smoke
                    }
                    heat -= 0.05;
                    break;
                }
            }
        }

        // 2. Transfer heat to neighboring wood (turn them to ember)
        if (heat > 0.5) {
            const neighbors = [
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 },
            ];

            for (const n of neighbors) {
                const id = grid.get(x + n.dx, y + n.dy);
                if (id === 5 && Math.random() < 0.01) { // Wood
                    grid.set(x + n.dx, y + n.dy, 13); // Turn to Ember
                    grid.setVelocity(x + n.dx, y + n.dy, heat * 0.3); // Transfer some heat
                    heat -= 0.05; // Lose heat when spreading
                }
            }
        }

        // 3. Eventually burn out
        if (heat > 1.0 && Math.random() < 0.015) {
            // Burn out to smoke mostly
            if (Math.random() < 0.8) { // 80% chance for smoke
                grid.set(x, y, 12); // Smoke
            } else {
                grid.set(x, y, 0); // Empty
            }
            return true;
        }

        // Store updated heat
        grid.setVelocity(x, y, heat);

        return true; // Always "moving" to keep updating
    }
}
