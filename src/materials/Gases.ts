import { Grid } from '../core/Grid';
import { Material } from './Material';
import { MaterialId } from './MaterialIds';

export class Steam extends Material {
    id = MaterialId.STEAM;
    name = "Steam";
    color = 0xE0F0FF; // Translucent Steam

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

