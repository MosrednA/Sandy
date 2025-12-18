import { Grid } from '../core/Grid';
import { Material } from './Material';
import { MaterialId } from './MaterialIds';
import { Liquid } from './Liquid';

export class Lava extends Liquid {
    id = MaterialId.LAVA;
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

            if (id === MaterialId.WATER) {
                // Create magma rock and steam
                grid.set(x, y, MaterialId.MAGMA_ROCK);
                grid.set(nx, ny, MaterialId.STEAM);
                return true;
            }
            // Ignite flammables
            if (id === MaterialId.OIL && Math.random() < 0.5) {
                grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.WOOD && Math.random() < 0.2) {
                grid.set(nx, ny, MaterialId.EMBER);
                grid.setVelocity(nx, ny, 0.5);
            } else if (id === MaterialId.GUNPOWDER || id === MaterialId.C4) {
                // Gunpowder/C4 - detonate!
                grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.COAL && Math.random() < 0.08) {
                // Lava ignites Coal quickly
                grid.set(nx, ny, MaterialId.EMBER);
                grid.setVelocity(nx, ny, 1.2); // Long burn
            } else if (id === MaterialId.POISON && Math.random() < 0.15) {
                // Slime is flammable
                grid.set(nx, ny, MaterialId.FIRE);
            } else if (id === MaterialId.ICE) {
                // Lava melts ice instantly
                grid.set(nx, ny, MaterialId.STEAM);
            }
        }

        // 2. Emit fire/smoke occasionally
        if (Math.random() < 0.01) {
            const above = grid.get(x, y - 1);
            if (above === MaterialId.EMPTY) {
                grid.set(x, y - 1, Math.random() < 0.5 ? MaterialId.FIRE : MaterialId.SMOKE);
            }
        }

        // 3. Use Liquid movement
        return super.update(grid, x, y);
    }
}

export class Ice extends Material {
    id = MaterialId.ICE;
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
            if (id === MaterialId.FIRE || id === MaterialId.LAVA || id === MaterialId.EMBER) {
                grid.set(x, y, MaterialId.WATER); // Turn to Water
                return true;
            }

            // Freeze nearby water
            if (id === MaterialId.WATER && Math.random() < 0.02) {
                grid.set(x + n.dx, y + n.dy, MaterialId.ICE); // Turn to Ice
            }
        }

        // Ice is solid - doesn't move
        return false;
    }
}


export class Gas extends Material {
    id = MaterialId.SALT;
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
            if (id === MaterialId.FIRE || id === MaterialId.LAVA || id === MaterialId.EMBER) {
                // Only ignite 30% of the time - slower propagation
                if (Math.random() < 0.3) {
                    this.ignite(grid, x, y);
                    return true;
                }
            }
        }

        // Decay slowly
        if (Math.random() < 0.002) {
            grid.set(x, y, MaterialId.EMPTY);
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
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // Spread sideways
        const side = Math.random() < 0.5 ? -1 : 1;
        if (grid.get(x + side, y) === MaterialId.EMPTY) {
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

                    if (id === MaterialId.WALL || id === undefined) continue;

                    if (id === MaterialId.SALT) { // Other gas - chain reaction
                        grid.set(nx, ny, MaterialId.FIRE); // Turn to fire
                    } else if (id === MaterialId.EMPTY && Math.random() < 0.5) {
                        grid.set(nx, ny, MaterialId.FIRE); // Fire
                    }
                }
            }
        }
        grid.set(cx, cy, MaterialId.FIRE); // This gas becomes fire
    }
}

// Magma Rock - Cooled lava that remelts when heated
export class MagmaRock extends Material {
    id = MaterialId.MAGMA_ROCK;
    name = "MagmaRock";
    color = 0x442222; // Dark reddish-brown

    update(grid: Grid, x: number, y: number): boolean {
        // Check for heat sources - remelt into Lava
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            // Heat sources: Fire, Lava, Ember
            if (id === MaterialId.FIRE || id === MaterialId.LAVA || id === MaterialId.EMBER) {
                if (Math.random() < 0.05) { // 5% chance per frame to remelt
                    grid.set(x, y, MaterialId.LAVA);
                    return true;
                }
            }
        }

        // Solid - doesn't move
        return false;
    }
}

// Cryo - Freezing gas that extinguishes fire and freezes water
export class Cryo extends Material {
    id = MaterialId.CRYO;
    name = "Cryo";
    color = 0x88FFFF; // Bright cyan

    update(grid: Grid, x: number, y: number): boolean {
        // 1. Affect nearby particles
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

            // Extinguish fire/ember
            if (id === MaterialId.FIRE || id === MaterialId.EMBER) {
                grid.set(nx, ny, MaterialId.SMOKE);
                grid.set(x, y, MaterialId.EMPTY); // Cryo consumed
                return true;
            }
            // Freeze water to ice
            if (id === MaterialId.WATER && Math.random() < 0.1) {
                grid.set(nx, ny, MaterialId.ICE);
            }
            // Freeze steam to ice
            if (id === MaterialId.STEAM && Math.random() < 0.15) {
                grid.set(nx, ny, MaterialId.ICE);
            }
            // Cool lava to magma rock
            if (id === MaterialId.LAVA && Math.random() < 0.15) {
                grid.set(nx, ny, MaterialId.MAGMA_ROCK);
                grid.set(x, y, MaterialId.EMPTY); // Consumed
                return true;
            }
        }

        // 2. Decay
        if (Math.random() < 0.015) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // 3. Rise like gas (but faster than smoke)
        if (Math.random() > 0.5) {
            return false; // Only move 50% of frames
        }

        const dirX = Math.floor(Math.random() * 3) - 1;
        const targetX = x + dirX;
        const targetY = y - 1;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const content = grid.get(targetX, targetY);
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // Drift sideways
        const side = Math.random() < 0.5 ? -1 : 1;
        if (grid.get(x + side, y) === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }
}

// Coal - Falls like sand, burns slowly with lots of smoke
export class Coal extends Material {
    id = MaterialId.COAL;
    name = "Coal";
    color = 0x222222; // Very dark gray

    update(grid: Grid, x: number, y: number): boolean {
        // Check for ignition from fire/lava/ember
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.FIRE || id === MaterialId.LAVA || id === MaterialId.EMBER) {
                // Turn into ember (slow burn)
                if (Math.random() < 0.02) {
                    grid.set(x, y, MaterialId.EMBER);
                    grid.setVelocity(x, y, 0.8);
                    return true;
                }
            }
        }

        // Fall like sand
        const below = grid.get(x, y + 1);
        if (below === MaterialId.EMPTY) {
            grid.move(x, y, x, y + 1);
            return true;
        }

        // Diagonal fall
        const dir = Math.random() < 0.5 ? 1 : -1;
        const diag1 = grid.get(x + dir, y + 1);
        if (diag1 === MaterialId.EMPTY) {
            grid.move(x, y, x + dir, y + 1);
            return true;
        }
        const diag2 = grid.get(x - dir, y + 1);
        if (diag2 === MaterialId.EMPTY) {
            grid.move(x, y, x - dir, y + 1);
            return true;
        }

        // Stay active 20% of time when blocked (keeps checking for fall opportunities)
        return Math.random() < 0.2;
    }
}

// Firework - Launches upward, explodes into colorful sparks at apex
export class Firework extends Material {
    id = MaterialId.FIREWORK;
    name = "Firework";
    color = 0xFF00FF; // Magenta

    update(grid: Grid, x: number, y: number): boolean {
        // Use velocity to track launch phase (negative = rising, positive = falling)
        let velocity = grid.getVelocity(x, y);

        // Initialize launch
        if (velocity === 0) {
            velocity = -3 - Math.random() * 2; // Launch upward (-3 to -5)
            grid.setVelocity(x, y, velocity);
        }

        // Apply gravity
        velocity += 0.08; // Light gravity so it rises high

        // Explode at apex (when velocity crosses 0)
        if (velocity >= -0.1 && velocity <= 0.5) {
            this.explode(grid, x, y);
            return true;
        }

        // Move based on velocity
        const targetY = y + Math.round(velocity);
        const above = grid.get(x, targetY);

        if (above === MaterialId.EMPTY) {
            grid.move(x, y, x, targetY);
            grid.setVelocity(x, targetY, velocity);
            return true;
        } else if (above !== MaterialId.WALL && above !== undefined) {
            // Hit something - explode early
            this.explode(grid, x, y);
            return true;
        }

        grid.setVelocity(x, y, velocity);
        return true;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        // Colorful explosion!
        const radius = 4 + Math.floor(Math.random() * 3);

        grid.set(cx, cy, MaterialId.EMPTY);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist2 = dx * dx + dy * dy;
                if (dist2 <= radius * radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === MaterialId.EMPTY && Math.random() < 0.4) {
                        // Create fire sparks
                        grid.set(nx, ny, MaterialId.FIRE);
                    }
                }
            }
        }
    }
}

