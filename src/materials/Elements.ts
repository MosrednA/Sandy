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
    conductivity = 0.6; // Good heat radiator

    update(grid: Grid, x: number, y: number): boolean {
        // Lava flows like slow water, ignites things, hardens with water

        // 1. Check current temperature (Is it cooling down?)
        // We check this BEFORE setting it back to 1000, so we can detect conduction cooling.
        const temp = grid.getTemp(x, y);

        // NEW: Temperature-based solidification (cooled through conduction)
        // If lava has cooled below 600° (e.g., surrounded by stone), it solidifies
        if (temp < 600) {
            if (Math.random() < 0.15) { // 15% chance to solidify when cold
                grid.set(x, y, MaterialId.MAGMA_ROCK);
                return true;
            }
        }

        // 2. Check for water contact - turn both to Stone (Physical phase change interaction)
        // Only if Lava has actually cooled down (Simulating thermal inertia/crust formation)
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
                // Reaction: Lava + Water -> Magma Rock + Steam
                // Temperature Based: Only harden if we are losing heat (temp < liquid threshold)
                // We use 900° as threshold (Lava is nominally 1000°)
                if (temp < 950) { // If we lost >50° to the water
                    // Chance simulates "Time to freeze" (Thermal Capactiy)
                    if (Math.random() < 0.1) { // 10% chance if cooling
                        grid.set(x, y, MaterialId.MAGMA_ROCK);
                        grid.set(nx, ny, MaterialId.STEAM);
                        return true;
                    }
                }
            }
        }

        // 3. Emit fire/smoke occasionally
        if (Math.random() < 0.01) {
            const above = grid.get(x, y - 1);
            if (above === MaterialId.EMPTY) {
                grid.set(x, y - 1, Math.random() < 0.5 ? MaterialId.FIRE : MaterialId.SMOKE);
            }
        }

        // 4. Reset Heat Source (Lava maintain its heat unless fully cooled)
        // Note: In a full thermodynamic sim, we wouldn't do this, but for "Sandbox Lava", it generates heat.
        grid.setTemp(x, y, 1000);

        // 5. Use Liquid movement
        return super.update(grid, x, y);
    }
}

export class Ice extends Material {
    id = MaterialId.ICE;
    name = "Ice";
    color = 0x88CCEE; // Cyan Ice
    conductivity = 0.4; // Moderate conductor

    update(grid: Grid, x: number, y: number): boolean {
        // COLD: Ice emits -50° temperature
        grid.setTemp(x, y, -50);

        // Temperature-based melting (>0°)
        const temp = grid.getTemp(x, y);
        if (temp > 0) {
            if (Math.random() < 0.1) { // 10% melt rate when warm
                grid.set(x, y, MaterialId.WATER);
                return true;
            }
        }

        // Freeze nearby water
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        ];
        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.WATER && Math.random() < 0.02) {
                grid.set(x + n.dx, y + n.dy, MaterialId.ICE);
            }
        }

        return false;
    }
}


export class Gas extends Material {
    id = MaterialId.GAS;
    name = "Gas";
    color = 0xFFEE66; // Rich Gas

    update(grid: Grid, x: number, y: number): boolean {
        // Gas rises and explodes when ignited

        // Temperature-based ignition (>200°)
        const temp = grid.getTemp(x, y);
        if (temp > 200) {
            if (Math.random() < 0.3) {
                this.ignite(grid, x, y);
                return true;
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

                    if (id === MaterialId.GAS) { // Other gas - chain reaction
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
    density = 30; // Heavier than Lava(20) and Water(10)
    conductivity = 0.3; // Slow conductor

    update(grid: Grid, x: number, y: number): boolean {
        // Temperature-based remelting (>800°)
        const temp = grid.getTemp(x, y);
        if (temp > 800) {
            if (Math.random() < 0.1) { // 10% remelt when hot enough
                grid.set(x, y, MaterialId.LAVA);
                return true;
            }
        }

        // Gravity: Sink in liquids and fall through empty space

        // 1. Check straight down
        const dy = y + 1;
        if (dy < grid.height) {
            const below = grid.get(x, dy);

            // Fall into empty
            if (below === MaterialId.EMPTY) {
                grid.move(x, y, x, dy);
                return true;
            }

            // Sink in Liquids (Water, Lava, Oil)
            // Retrieve material to check if it's liquid? 
            // Or just check specific IDs we know.
            if (below === MaterialId.WATER || below === MaterialId.LAVA || below === MaterialId.OIL) {
                // MagmaRock is heavier (density ~30) than all these
                grid.swap(x, y, x, dy);
                return true;
            }
        }

        // 2. Tumble diagonal
        // If blocked, try to simulate pile mechanics
        const dir = Math.random() < 0.5 ? 1 : -1;
        const dx = x + dir;
        const dy2 = y + 1;

        if (dx >= 0 && dx < grid.width && dy2 < grid.height) {
            const belowDiag = grid.get(dx, dy2);
            if (belowDiag === MaterialId.EMPTY) {
                grid.move(x, y, dx, dy2);
                return true;
            } else if (belowDiag === MaterialId.WATER || belowDiag === MaterialId.LAVA || belowDiag === MaterialId.OIL) {
                grid.swap(x, y, dx, dy2);
                return true;
            }
        }

        // Look for other side if first side failed?
        // Simplification: just one side check per frame is enough for piles

        return false;
    }
}

// Cryo - Freezing gas that extinguishes fire and freezes water
export class Cryo extends Material {
    id = MaterialId.CRYO;
    name = "Cryo";
    color = 0x88FFFF; // Bright cyan
    conductivity = 0.7; // Fast cooling
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        // COLD: Cryo emits -100° temperature (coldest!)
        grid.setTemp(x, y, -100);

        // Decay
        if (Math.random() < 0.015) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // Rise like gas
        if (Math.random() > 0.5) {
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
    conductivity = 0.15; // Poor conductor

    update(grid: Grid, x: number, y: number): boolean {
        // Temperature-based ignition (>250°)
        const temp = grid.getTemp(x, y);
        if (temp > 250) {
            if (Math.random() < 0.05) { // 5% ignition when hot
                grid.set(x, y, MaterialId.EMBER);
                grid.setVelocity(x, y, 0.8); // Long burn
                return true;
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

