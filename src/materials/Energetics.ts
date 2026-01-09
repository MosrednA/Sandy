import { Grid } from '../core/Grid';
import { Material } from './Material';
import { MaterialId, Neighbors } from './MaterialIds';
import { GRAVITY } from '../core/Constants';

export class Fire extends Material {
    id = MaterialId.FIRE;
    name = "Fire";
    color = 0xFF6622; // Warm Orange
    conductivity = 0.8; // Radiates heat quickly

    update(grid: Grid, x: number, y: number): boolean {
        // Fire rises and spreads to flammables, then dies out

        // HEAT: Fire emits +500° temperature
        grid.setTemp(x, y, 500);

        // 1. Decay (Fire is short-lived but creates nice flames)
        if (Math.random() < 0.10) { // 10% chance per frame to die (was 3%) - Limits spark range
            // Turn into smoke - increased smoke production
            if (Math.random() < 0.7) { // 70% chance for smoke (was 30%)
                grid.set(x, y, MaterialId.HOT_SMOKE);
            } else {
                grid.set(x, y, MaterialId.EMPTY);
            }
            return true;
        }

        // 2. Spread to flammables and melt ice
        for (const n of Neighbors.ALL) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            if (id === MaterialId.OIL && Math.random() < 0.3) {
                grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.WOOD && Math.random() < 0.1) {
                grid.set(nx, ny, MaterialId.EMBER);
                grid.setVelocity(nx, ny, 0.4);
            } else if (id === MaterialId.POISON && Math.random() < 0.15) {
                // Slime is flammable
                grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.ICE && Math.random() < 0.2) {
                // Fire melts Ice directly to Water
                grid.set(nx, ny, MaterialId.WATER);
                grid.setTemp(nx, ny, 50); // Warm water
            }
        }

        // 3. Movement (rises like gas, but more chaotic)
        const dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const targetY = y - 1;
        const targetX = x + dirX;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const above = grid.get(targetX, targetY);
            if (above === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // 4. Random flicker sideways if blocked
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }
}

export class Gunpowder extends Material {
    id = MaterialId.GUNPOWDER;
    name = "Gunpowder";
    color = 0x2A2A2A; // Dark Gunpowder
    conductivity = 0.15; // Poor conductor

    update(grid: Grid, x: number, y: number): boolean {
        // Gunpowder behaves like Sand but explodes when hot

        // Temperature-based explosion (>150°)
        const temp = grid.getTemp(x, y);
        if (temp > 150) {
            this.explode(grid, x, y);
            return true;
        }

        // Check neighbors for special interactions
        const neighbors = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            // Water neutralizes gunpowder (gets wet, useless)
            if (id === MaterialId.WATER) {
                if (Math.random() < 0.1) {
                    grid.set(x, y, MaterialId.SAND); // Becomes useless
                    return true;
                }
            }
            // Acid causes combustion!
            else if (id === MaterialId.ACID) {
                this.explode(grid, x, y);
                return true;
            }
        }

        // Standard Sand physics
        let velocity = grid.getVelocity(x, y);
        velocity += GRAVITY;
        if (velocity > 8) velocity = 8;

        const steps = Math.floor(velocity);
        let moved = false;
        let currentX = x;
        let currentY = y;

        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === MaterialId.EMPTY) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else {
                // Diagonal
                const dir = Math.random() < 0.5 ? 1 : -1;
                const diagonal1 = grid.get(currentX + dir, nextY);
                const diagonal2 = grid.get(currentX - dir, nextY);

                if (diagonal1 === MaterialId.EMPTY) {
                    grid.move(currentX, currentY, currentX + dir, nextY);
                    moved = true;
                    currentX += dir;
                    currentY = nextY;
                } else if (diagonal2 === MaterialId.EMPTY) {
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
        const radius = 4 + Math.floor(Math.random() * 2); // Reduced from 5-8 to 4-6
        EnergeticsUtils.explode(grid, cx, cy, radius, MaterialId.GUNPOWDER);
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

                    if (id === MaterialId.WALL || id === undefined) continue;

                    if (id === MaterialId.EMPTY) {
                        if (Math.random() < 0.2) grid.set(nx, ny, Math.random() < 0.5 ? MaterialId.FIRE : MaterialId.HOT_SMOKE);
                        continue;
                    }

                    // Explosives ALWAYS chain-react (no chance to survive)
                    if (id === selfID || id === MaterialId.GUNPOWDER || id === MaterialId.C4) {
                        grid.set(nx, ny, MaterialId.FIRE);
                        continue;
                    }

                    // Other materials have a chance-based destruction
                    const chance = 1 - (Math.sqrt(dist2) / radius) * 0.8;
                    if (Math.random() < chance) {
                        if (id !== MaterialId.STONE && id !== MaterialId.STEAM) {
                            grid.set(nx, ny, MaterialId.HOT_SMOKE);
                        } else {
                            if (radius > 10 && Math.random() < 0.3) grid.set(nx, ny, MaterialId.EMPTY);
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

                        // Don't push walls/stone/steam
                        if (id !== MaterialId.EMPTY && id !== MaterialId.WALL && id !== MaterialId.STONE && id !== MaterialId.STEAM) {
                            // Push Vector
                            const dist = Math.sqrt(dist2);
                            const force = (shockRadius - dist) / (shockRadius - radius); // 1.0 at inner, 0.0 at outer

                            if (force > 0.1) {
                                // Launch into Off-Grid Particle System
                                const dirX = dx / dist;
                                const dirY = dy / dist;

                                // Randomize velocity slightly (reduced from 5-25 to 2-10)
                                const speed = 2 + force * 6 + Math.random() * 2;
                                const vx = dirX * speed;
                                const vy = dirY * speed - 1; // Slight upward bias



                                grid.set(nx, ny, MaterialId.EMPTY); // Remove from grid
                                grid.addOffGridParticle(nx, ny, vx, vy, id, 0); // Color 0 for now, lookup later?

                            }
                        }
                    }
                }
            }
        }
    }
}

export class C4 extends Material {
    id = MaterialId.C4;
    name = "C4";
    color = 0xDDDDDD; // Off-white plastic explosive
    conductivity = 0.1; // Insulator

    update(grid: Grid, x: number, y: number): boolean {
        // Temperature-based detonation (>100° - very sensitive!)
        const temp = grid.getTemp(x, y);
        if (temp > 100) {
            this.explode(grid, x, y);
            return true;
        }
        return false;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        // C4 has massive radius - BOOM!
        const radius = 18;
        EnergeticsUtils.explode(grid, cx, cy, radius, MaterialId.C4);
    }
}

