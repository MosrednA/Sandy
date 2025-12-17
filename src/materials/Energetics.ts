import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Fire extends Material {
    id = 10;
    name = "Fire";
    color = 0xFF4400; // Orange-Red

    update(grid: Grid, x: number, y: number): boolean {
        // Fire rises and spreads to flammables, then dies out

        // 1. Decay (Fire is short-lived but creates nice flames)
        if (Math.random() < 0.03) { // 3% chance per frame to die (was 8%)
            // Turn into smoke - increased smoke production
            if (Math.random() < 0.7) { // 70% chance for smoke (was 30%)
                grid.set(x, y, 12); // Smoke
            } else {
                grid.set(x, y, 0); // Empty
            }
            return true;
        }

        // 2. Spread to flammables (Oil, Gunpowder, Wood if exists)
        const neighbors = [
            { dx: 0, dy: -1 },  // up
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 },   // right
            { dx: -1, dy: -1 }, // diagonals
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 },
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            // Flammables: Oil (9), Gunpowder (11), Wood (5)
            if (id === 9) { // Oil
                if (Math.random() < 0.3) {
                    grid.set(nx, ny, 10); // Ignite Oil -> Fire
                }
            } else if (id === 5) { // Wood
                if (Math.random() < 0.08) {
                    grid.set(nx, ny, 13); // Ignite Wood -> Ember (smoldering)
                    grid.setVelocity(nx, ny, 0.4); // Start with some heat
                }
            } else if (id === 11) { // Gunpowder
                // Gunpowder explodes!
                this.explode(grid, nx, ny);
            }
        }

        // 3. Movement (rises like gas, but more chaotic)
        const dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const targetY = y - 1;
        const targetX = x + dirX;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const above = grid.get(targetX, targetY);
            if (above === 0) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // 4. Random flicker sideways if blocked
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === 0) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        const radius = 5 + Math.floor(Math.random() * 3);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    // Don't destroy boundary
                    if (id === 255 || id === undefined) continue;

                    // Chance to destroy based on distance
                    const chance = 1 - (dist / radius) * 0.5;
                    if (Math.random() < chance) {
                        if (id === 11) {
                            // Chain reaction! (but defer to next frame naturally)
                            grid.set(nx, ny, 10); // Turn to fire
                        } else if (id !== 1) { // Don't destroy Stone easily
                            // Outer ring turns to smoke only (no spreading fire)
                            if (dist > radius * 0.7) {
                                grid.set(nx, ny, 12); // Smoke
                            } else {
                                grid.set(nx, ny, 0);
                            }
                        }
                    }
                }
            }
        }
    }
}

export class Gunpowder extends Material {
    id = 11;
    name = "Gunpowder";
    color = 0x444444; // Dark Gray

    update(grid: Grid, x: number, y: number): boolean {
        // Gunpowder behaves like Sand but explodes when touched by Fire

        // Check for Fire neighbors
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === 10) { // Fire
                this.explode(grid, x, y);
                return true;
            }
        }

        // Standard Sand physics
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5;
        if (velocity > 8) velocity = 8;

        const steps = Math.floor(velocity);
        let moved = false;
        let currentX = x;
        let currentY = y;

        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === 0) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else {
                // Diagonal
                const dir = Math.random() < 0.5 ? 1 : -1;
                const diagonal1 = grid.get(currentX + dir, nextY);
                const diagonal2 = grid.get(currentX - dir, nextY);

                if (diagonal1 === 0) {
                    grid.move(currentX, currentY, currentX + dir, nextY);
                    moved = true;
                    currentX += dir;
                    currentY = nextY;
                } else if (diagonal2 === 0) {
                    grid.move(currentX, currentY, currentX - dir, nextY);
                    moved = true;
                    currentX -= dir;
                    currentY = nextY;
                } else {
                    velocity = 0;
                    grid.setVelocity(currentX, currentY, 0);
                    return moved;
                }
            }
        }

        grid.setVelocity(currentX, currentY, velocity);
        return moved;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        const radius = 5 + Math.floor(Math.random() * 3);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === 255 || id === undefined) continue;

                    const chance = 1 - (dist / radius) * 0.5;
                    if (Math.random() < chance) {
                        if (id === 11) {
                            grid.set(nx, ny, 10); // Chain reaction
                        } else if (id !== 1) {
                            if (dist > radius * 0.7) {
                                grid.set(nx, ny, 12); // Smoke
                            } else {
                                grid.set(nx, ny, 0);
                            }
                        }
                    }
                }
            }
        }
    }
}
