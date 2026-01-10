import { Grid } from '../core/Grid';
import { Material } from './Material';
import { materialRegistry } from './MaterialRegistry';
import { GRAVITY } from '../core/Constants';
import { MaterialId } from './MaterialIds';

// Helper to check if a material is a gas (can be displaced by falling solids)
function isGas(id: number): boolean {
    return materialRegistry.get(id)?.isGas ?? false;
}

export class Sand extends Material {
    id = 2;
    name = "Sand";
    color = 0xD4A574; // Warm Earthy Sand
    conductivity = 0.2; // Poor conductor
    canSleep = true; // Sand can sleep when settled

    update(grid: Grid, x: number, y: number): boolean {
        // Simple Gravity
        let velocity = grid.getVelocity(x, y);
        velocity += GRAVITY; // Gravity acceleration
        if (velocity > 8) velocity = 8; // Terminal velocity

        const steps = Math.floor(velocity);

        let moved = false;
        let currentX = x;
        let currentY = y;

        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            // Fall through empty space
            if (below === MaterialId.EMPTY) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            }
            // Swap with gases (fall through them)
            else if (isGas(below)) {
                grid.swap(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            }
            // Swap with water (sink)
            else if (below === MaterialId.WATER) {
                const wobble = Math.random() < 0.4;
                let didWobble = false;

                if (wobble) {
                    const dir = Math.random() < 0.5 ? 1 : -1;
                    const diagonal = grid.get(currentX + dir, nextY);
                    if (diagonal === MaterialId.WATER || isGas(diagonal)) {
                        grid.swap(currentX, currentY, currentX + dir, nextY);
                        moved = true;
                        currentX += dir;
                        currentY = nextY;
                        didWobble = true;
                    }
                }

                if (!didWobble) {
                    grid.swap(currentX, currentY, currentX, nextY);
                    moved = true;
                    currentY = nextY;
                }

                velocity *= 0.9;
            } else {
                // Diagonal fall
                const dir = Math.random() < 0.5 ? 1 : -1;
                const diagonal1 = grid.get(currentX + dir, nextY);
                const diagonal2 = grid.get(currentX - dir, nextY);

                if (diagonal1 === MaterialId.EMPTY) {
                    grid.move(currentX, currentY, currentX + dir, nextY);
                    moved = true;
                    currentX += dir;
                    currentY = nextY;
                } else if (isGas(diagonal1) || diagonal1 === MaterialId.WATER) {
                    grid.swap(currentX, currentY, currentX + dir, nextY);
                    moved = true;
                    currentX += dir;
                    currentY = nextY;
                    if (diagonal1 === MaterialId.WATER) velocity *= 0.5;
                } else if (diagonal2 === MaterialId.EMPTY) {
                    grid.move(currentX, currentY, currentX - dir, nextY);
                    moved = true;
                    currentX -= dir;
                    currentY = nextY;
                } else if (isGas(diagonal2) || diagonal2 === MaterialId.WATER) {
                    grid.swap(currentX, currentY, currentX - dir, nextY);
                    moved = true;
                    currentX -= dir;
                    currentY = nextY;
                    if (diagonal2 === MaterialId.WATER) velocity *= 0.5;
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
}
