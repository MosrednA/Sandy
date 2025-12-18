import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Steam extends Material {
    id = 7;
    name = "Steam";
    color = 0xE0F0FF; // Translucent Steam

    update(grid: Grid, x: number, y: number): boolean {
        // Rises! Anti-gravity.

        // Behave like gas: always try to move up and scatter

        // Decay
        if (Math.random() < 0.005) { // 0.5% chance per frame to disappear
            grid.set(x, y, 0);
            return true;
        }

        // Slow down rising - only move 30% of frames
        if (Math.random() > 0.3) {
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
            if (content === 0) {
                grid.move(x, y, targetX, targetY);
                return true;
            } else if (content === 3 || content === 15) { // Water or Ice
                // Condense back to water
                if (Math.random() < 0.2) { // 20% chance
                    grid.set(x, y, 3);
                    return true;
                }
            } else if (content !== 0 && content !== 255) {
                // If blocked, try just side?
                const sideContent = grid.get(targetX, y);
                if (sideContent === 0) {
                    grid.move(x, y, targetX, y);
                    return true;
                }
            }
        }

        return false;
    }
}

export class Smoke extends Material {
    id = 12;
    name = "Smoke";
    color = 0x222222; // Dark Smoke

    update(grid: Grid, x: number, y: number): boolean {
        // Smoke rises slowly and dissipates

        // Decay - Smoke dissipates faster than steam
        if (Math.random() < 0.02) { // 2% chance per frame to disappear
            grid.set(x, y, 0);
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
            if (content === 0) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // Try just sideways if blocked above
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === 0) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }
}

export class HotSmoke extends Material {
    id = 19;
    name = "HotSmoke";
    color = 0x553311; // Dark Orange/Brown (transition color)

    update(grid: Grid, x: number, y: number): boolean {
        // Hot Smoke rises like smoke but quickly cools down to regular smoke

        // 1. Cool down (transition to Smoke)
        if (Math.random() < 0.03) { // 3% chance per frame to cool down (was 15%)
            grid.set(x, y, 12); // Turn into Smoke (ID 12)
            return true;
        }

        // 2. Decay (disappear completely)
        if (Math.random() < 0.01) {
            grid.set(x, y, 0);
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
            if (content === 0) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        // 4. Drift sideways if blocked above
        const side = Math.random() < 0.5 ? -1 : 1;
        const sideContent = grid.get(x + side, y);
        if (sideContent === 0) {
            grid.move(x, y, x + side, y);
            return true;
        }

        // 5. If blocked completely, try to stay awake?
        // Returning false allows it to sleep. If we want it "volatile", we return true?
        // But if it's trapped, it should sleep.
        return false;
    }
}
