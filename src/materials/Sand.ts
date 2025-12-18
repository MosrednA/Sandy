import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Sand extends Material {
    id = 2;
    name = "Sand";
    color = 0xD4A574; // Warm Earthy Sand

    update(grid: Grid, x: number, y: number): boolean {
        // Simple Gravity
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5; // Gravity acceleration
        if (velocity > 8) velocity = 8; // Terminal velocity

        // Determine how many pixels to move this frame
        // We only move the integer part, but keep the fractional part for next frame?
        // Actually, just storing the velocity is enough for the "speed" check.
        // We attempt to move floor(velocity) times.
        const steps = Math.floor(velocity);

        // If velocity < 1, we might effectively pause? 
        // Or should we just treat 0.5 as "move every 2 frames"?
        // For simplicity, let's always ensure at least 1 step if falling, 
        // to prevent sticky behavior, or just rely on steps.
        // If steps = 0, we don't move, but velocity increases next frame.

        let moved = false;
        let currentX = x;
        let currentY = y;

        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);
            const WATER = 3;

            if (below === 0) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else if (below === WATER) {
                // WOBBLE: Chance to move diagonally even if down is open (to simulate turbulence/wobble)
                const wobble = Math.random() < 0.4; // 40% chance to deviate
                let didWobble = false;

                if (wobble) {
                    const dir = Math.random() < 0.5 ? 1 : -1;
                    const diagonal = grid.get(currentX + dir, nextY);
                    if (diagonal === WATER) {
                        grid.swap(currentX, currentY, currentX + dir, nextY);
                        moved = true;
                        currentX += dir;
                        currentY = nextY;
                        didWobble = true;
                    }
                }

                if (!didWobble) {
                    // Standard sinking
                    grid.swap(currentX, currentY, currentX, nextY);
                    moved = true;
                    currentY = nextY;
                }

                // Water slows us down
                velocity *= 0.9; // Less friction than before (was 0.5) to keep it moving
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
                } else if (diagonal1 === WATER) {
                    grid.swap(currentX, currentY, currentX + dir, nextY);
                    moved = true;
                    currentX += dir;
                    currentY = nextY;
                    velocity *= 0.5;
                } else if (diagonal2 === 0) {
                    grid.move(currentX, currentY, currentX - dir, nextY);
                    moved = true;
                    currentX -= dir;
                    currentY = nextY;
                } else if (diagonal2 === WATER) {
                    grid.swap(currentX, currentY, currentX - dir, nextY);
                    moved = true;
                    currentX -= dir;
                    currentY = nextY;
                    velocity *= 0.5;
                } else {
                    // Hit ground
                    velocity = 0;
                    grid.setVelocity(currentX, currentY, 0);
                    return moved;
                }
            }
        }

        grid.setVelocity(currentX, currentY, velocity);
        return moved;
    }
}
