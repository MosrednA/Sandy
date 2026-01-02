import { Grid } from '../core/Grid';
import { Material } from './Material';
import { MaterialId } from './MaterialIds';

export class Steam extends Material {
    id = MaterialId.STEAM;
    name = "Steam";
    color = 0xE0F0FF; // Translucent Steam
    conductivity = 0.1; // Insulator
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        // Rises! Anti-gravity.

        // Behave like gas: always try to move up and scatter

        // Decay
        if (Math.random() < 0.005) { // 0.5% chance per frame to disappear
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // Slow down rising - only move 40% of frames (was 30%)
        if (Math.random() > 0.4) {
            return false;
        }

        // Move Up
        // Randomly jitter left/right while going up
        const dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

        const targetX = x + dirX;
        const targetY = y - 1;

        const destInBounds = targetX >= 0 && targetX < grid.width && targetY >= 0;

        if (destInBounds) {
            const content = grid.get(targetX, targetY);
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }

            // Temperature-based condensation (<100°)
            // If steam cools down (due to air or cold surfaces), it turns back to water
            const temp = grid.getTemp(x, y);
            if (temp < 100) {
                if (Math.random() < 0.2) {
                    grid.set(x, y, MaterialId.WATER);
                    // Temp is preserved effectively since water is ok with <100
                    return true;
                }
            }

            if (content !== MaterialId.EMPTY && content !== MaterialId.WALL) {
                // If blocked, try just side?
                const sideContent = grid.get(targetX, y);
                if (sideContent === MaterialId.EMPTY) {
                    grid.move(x, y, targetX, y);
                    return true;
                }
            }
        }

        return false;
    }
}

export class Smoke extends Material {
    id = MaterialId.SMOKE;
    name = "Smoke";
    color = 0x222222; // Dark Smoke
    conductivity = 0.05; // Almost insulator
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        // Smoke rises slowly and dissipates

        // Decay - Smoke dissipates faster than steam
        if (Math.random() < 0.02) { // 2% chance per frame to disappear
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // Slow rising - only move 20% of frames
        if (Math.random() > 0.2) {
            return false;
        }

        // Move Up with more scatter
        const dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

        const targetX = x + dirX;
        const targetY = y - 1;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const content = grid.get(targetX, targetY);
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // Try just sideways if blocked above
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }
}

export class HotSmoke extends Material {
    id = MaterialId.HOT_SMOKE;
    name = "HotSmoke";
    color = 0x553311; // Dark Orange/Brown (transition color)
    conductivity = 0.15; // Low conductor
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        // Hot Smoke rises like smoke but quickly cools down to regular smoke

        // HEAT: Hot Smoke emits +150° temperature
        grid.setTemp(x, y, 150);

        // Check for water contact - creates steam
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        ];
        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.WATER) {
                // Hot smoke heats water into steam
                if (Math.random() < 0.1) {
                    grid.set(x + n.dx, y + n.dy, MaterialId.STEAM);
                    grid.set(x, y, MaterialId.SMOKE); // Cools down
                    return true;
                }
            }
        }

        // 1. Cool down (transition to Smoke)
        if (Math.random() < 0.03) {
            grid.set(x, y, MaterialId.SMOKE);
            return true;
        }

        // 2. Decay (disappear completely)
        if (Math.random() < 0.01) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // 3. Movement (Rise) - Always try to move!
        // No sleep chance here anymore.

        // Chaos / Drift
        const dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const targetX = x + dirX;
        const targetY = y - 1;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const content = grid.get(targetX, targetY);
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // 4. Drift sideways if blocked above
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        // 5. If blocked completely, try to stay awake?
        // Returning false allows it to sleep. If we want it "volatile", we return true?
        // But if it's trapped, it should sleep.
        return false;
    }
}

/**
 * Dust - Suspended particles that float in air
 * Highly explosive when ignited, creates flash fires
 */
export class Dust extends Material {
    id = MaterialId.DUST;
    name = "Dust";
    color = 0xAA9977; // Tan/brown
    isGas = true;
    conductivity = 0.1;

    update(grid: Grid, x: number, y: number): boolean {
        // Temperature-based ignition (lower than gas - dust is more volatile!)
        const temp = grid.getTemp(x, y);
        if (temp > 150) {
            if (Math.random() < 0.5) {
                this.explode(grid, x, y);
                return true;
            }
        }

        // Check for fire contact
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        ];
        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.FIRE || id === MaterialId.EMBER) {
                this.explode(grid, x, y);
                return true;
            }
        }

        // Slow decay
        if (Math.random() < 0.001) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // Drift slowly - dust floats
        if (Math.random() > 0.3) return false;

        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        const nx = x + dx;
        const ny = y + dy;

        if (grid.get(nx, ny) === MaterialId.EMPTY) {
            grid.move(x, y, nx, ny);
            return true;
        }

        return false;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        // Dust explosion - rapid fire spread
        const radius = 4;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === MaterialId.WALL || id === undefined) continue;

                    // Chain reaction with other dust
                    if (id === MaterialId.DUST) {
                        grid.set(nx, ny, MaterialId.FIRE);
                    } else if (id === MaterialId.EMPTY && Math.random() < 0.6) {
                        grid.set(nx, ny, MaterialId.FIRE);
                    }
                }
            }
        }
        grid.set(cx, cy, MaterialId.FIRE);
        grid.setTemp(cx, cy, 800);
    }
}


