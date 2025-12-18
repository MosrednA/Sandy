import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Fire extends Material {
    id = 10;
    name = "Fire";
    color = 0xFF6622; // Warm Orange

    update(grid: Grid, x: number, y: number): boolean {
        // Fire rises and spreads to flammables, then dies out

        // 1. Decay (Fire is short-lived but creates nice flames)
        if (Math.random() < 0.10) { // 10% chance per frame to die (was 3%) - Limits spark range
            // Turn into smoke - increased smoke production
            if (Math.random() < 0.7) { // 70% chance for smoke (was 30%)
                grid.set(x, y, 19); // HotSmoke (was 12)
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
        EnergeticsUtils.explode(grid, cx, cy, radius, 10); // Self ID meaningless for fire but whatever
    }
}

export class Gunpowder extends Material {
    id = 11;
    name = "Gunpowder";
    color = 0x2A2A2A; // Dark Gunpowder

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
        EnergeticsUtils.explode(grid, cx, cy, radius, 11);
    }
}

class EnergeticsUtils {
    static explode(grid: Grid, cx: number, cy: number, radius: number, selfID: number) {
        // 1. Destruction Zone (Inner)
        const destructionR2 = radius * radius;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist2 = dx * dx + dy * dy;
                if (dist2 <= destructionR2) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === 255 || id === undefined) continue;

                    if (id === 0) {
                        if (Math.random() < 0.2) grid.set(nx, ny, Math.random() < 0.5 ? 10 : 19);
                        continue;
                    }

                    const chance = 1 - (Math.sqrt(dist2) / radius) * 0.8;
                    if (Math.random() < chance) {
                        if (id === selfID || id === 11 || id === 21) {
                            grid.set(nx, ny, 10);
                        } else if (id !== 1 && id !== 7) {
                            grid.set(nx, ny, 19);
                        } else {
                            if (radius > 10 && Math.random() < 0.3) grid.set(nx, ny, 0);
                        }
                    }
                }
            }
        }

        // 2. Shockwave Zone (Outer Ring) - Push particles away
        // We iterate OUTWARD-IN (from far away to center) to prevent overwriting?
        // No, if we push OUT, we want to move the OUTER ones first so there is space.
        // So we iterate rings from MaxRadius down to DestructionRadius.
        const shockRadius = radius * 1.5;
        const shockR2 = shockRadius * shockRadius;

        for (let r = Math.floor(shockRadius); r > radius; r--) {
            // Check circumference (roughly)
            // Or just scan the box area excluding inner circle? 
            // Scan box is easier.
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const dist2 = dx * dx + dy * dy;
                    // processing ring "r" roughly
                    if (dist2 > destructionR2 && dist2 <= shockR2) {
                        // Only process if roughly at current radius r to ensure order?
                        // Actually, sorting by distance is expensive.
                        // Let's just do a chaotic displacement.
                        // Ideally we process from Outer -> Inner. 
                        // But scanning X/Y doesn't do that.
                        // Let's just scan the whole outer box and move if we can.
                        // It might compress particles, but that's fine.

                        // To avoid processing same particle twice (if moved into future scan), 
                        // this implementation is tricky in a single frame without double buffering.
                        // But we can just try to throw them.

                        const nx = cx + dx;
                        const ny = cy + dy;
                        const id = grid.get(nx, ny);

                        if (id !== 0 && id !== 255 && id !== 1 && id !== 7) { // Don't push walls/stone
                            // Push Vector
                            const dist = Math.sqrt(dist2);
                            const force = (shockRadius - dist) / (shockRadius - radius); // 1.0 at inner, 0.0 at outer

                            if (force > 0.1) {
                                // Push Distance
                                const pushDist = Math.max(1, Math.floor(force * radius * 0.5));

                                const dirX = dx / dist;
                                const dirY = dy / dist;

                                const tx = Math.round(nx + dirX * pushDist);
                                const ty = Math.round(ny + dirY * pushDist);

                                if (grid.get(tx, ty) === 0) {
                                    // Move particle physically
                                    grid.move(nx, ny, tx, ty);
                                    // Add upward velocity if kicking up
                                    if (dirY < 0) {
                                        grid.setVelocity(tx, ty, -5 * force);
                                    }
                                } else {
                                    // Try to swap? No, makes a mess. Just fail.
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

export class C4 extends Material {
    id = 21;
    name = "C4";
    color = 0xDDDDDD; // Off-white plastic explosive

    update(grid: Grid, x: number, y: number): boolean {
        // C4 is static solid (doesn't fall)
        // Checks for Fire/Electric trigger

        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === 10 || id === 13 || id === 14) { // Fire, Ember, Lava
                this.explode(grid, x, y);
                return true;
            }
        }
        return false;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        // C4 has HUGE radius
        const radius = 15;
        EnergeticsUtils.explode(grid, cx, cy, radius, 21);
    }
}
