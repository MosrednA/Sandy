import { Grid } from '../core/Grid';
import { Material } from './Material';
import { materialRegistry } from './MaterialRegistry';

export abstract class Liquid extends Material {
    // Default density for water-like liquids
    density: number = 10;
    dispersion: number = 5;

    update(grid: Grid, x: number, y: number): boolean {
        // Gravity
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5; // Gravity acceleration
        if (velocity > 8) velocity = 8; // Terminal velocity

        const steps = Math.floor(velocity);

        let moved = false;
        let currentX = x;
        let currentY = y;
        let hitGround = false;

        // 1. Vertical Fall
        // Always check at least once (even if steps is 0) to handle density swaps
        const checkSteps = Math.max(1, steps);

        for (let i = 0; i < checkSteps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === 0) { // Empty
                if (steps > 0) { // Only move if we have enough velocity
                    grid.move(currentX, currentY, currentX, nextY);
                    moved = true;
                    currentY = nextY;
                } else {
                    // Not enough velocity yet, but space is clear - keep accumulating
                    break;
                }
            } else {
                // Density Check - Always check, even at low velocity
                const other = materialRegistry.get(below);
                if (other && (other.density !== undefined)) {
                    if (other.density < this.density) {
                        // We are heavier: Swap / Sink (always, regardless of velocity)
                        grid.swap(currentX, currentY, currentX, nextY);
                        moved = true;
                        currentY = nextY;
                        velocity *= 0.8;
                        continue;
                    }
                }

                // Hit something solid or same/heavier density
                velocity = 0;
                hitGround = true;
                break;
            }
        }

        // Update velocity
        if (hitGround) {
            grid.setVelocity(currentX, currentY, 0);
        } else {
            grid.setVelocity(currentX, currentY, velocity);
        }

        // If we're still falling (not on ground), don't flow horizontally
        if (!hitGround) {
            return moved;
        }

        // 2. Horizontal Flow (Dispersion) - Only when on ground
        // Use position + frame to determine base direction (opposite to scan order)
        // This creates more uniform spreading by having adjacent particles flow opposite ways
        const scanLeftToRight = (currentY + grid.frameCount) % 2 === 0;
        // Flow opposite to scan direction, with 15% chance to flip for natural variation
        let dir = scanLeftToRight ? -1 : 1;
        if (Math.random() < 0.15) dir = -dir;

        if (this.flow(grid, currentX, currentY, dir)) return true;
        if (this.flow(grid, currentX, currentY, -dir)) return true;

        return moved;
    }

    private flow(grid: Grid, x: number, y: number, dir: number): boolean {
        for (let i = 1; i <= this.dispersion; i++) {
            const tx = x + (dir * i);
            const content = grid.get(tx, y);

            if (content === 255) return false; // Boundary

            if (content === 0) {
                grid.move(x, y, tx, y);
                return true;
            } else if (content === this.id) {
                continue; // Pass through self
            } else {
                // Hit something else - Density Check for Horizontal Displacement
                const other = materialRegistry.get(content);
                if (other && other.density !== undefined && other.density < this.density) {
                    grid.swap(x, y, tx, y);
                    return true;
                }
                return false;
            }
        }
        return false;
    }
}
