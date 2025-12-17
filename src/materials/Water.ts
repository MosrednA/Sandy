import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Water extends Material {
    id = 3;
    name = "Water";
    color = 0x4488FF;

    update(grid: Grid, x: number, y: number): boolean {
        // Gravity
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5;
        if (velocity > 8) velocity = 8;

        const steps = Math.floor(velocity);
        let moved = false;
        let currentX = x;
        let currentY = y;
        let hitGround = false;

        // 1. Vertical Fall Loop
        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === 0) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else if (below === 9) { // Oil ID = 9
                // Water is heavier than Oil. Water sinks, Oil rises.
                grid.swap(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
                velocity = 0; // Friction
                hitGround = true; // Density interaction counts as hitting something
                break;
            } else {
                // Hit something (Solid or Water)
                // If it's water, we technically join it (pressure), but for falling, we stop.
                velocity = 0;
                hitGround = true;
                break;
            }
        }

        // Update velocity
        if (!hitGround) {
            grid.setVelocity(currentX, currentY, velocity);
            // If we are falling, we don't disperse sideways usually, unless we want chaotic waterfall
            // But let's allow dispersion ONLY if we didn't move vertically? 
            // Or if we hit ground this frame?
            // If we are high in the air, we just fall.
            return true;
        } else {
            grid.setVelocity(currentX, currentY, 0);
        }

        // 2. Horizontal Flow (Dispersion) - Only if on ground (or hit ground)

        // SOLIDITY CHECK:
        // If there is water directly above us, we are "deep" water.
        // Deep water should mostly stay put to support the water above and prevent "swiss cheese".
        // We only allowing deep water to move occasionally (pressure) to allow equalization.
        const above = grid.get(x, y - 1);
        if (above === this.id) {
            if (Math.random() > 0.1) return moved; // 90% chance to sleep (be solid) if covered
        }

        // 3. Side (Left/Right) with Instant Flow (Tunneling)
        // High dispersion for fluid pressure effect
        const dispersion = 8;
        const dir = Math.random() < 0.5 ? 1 : -1; // Randomize start dir

        // Check primary random direction
        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (dir * i);
            const content = grid.get(targetX, currentY);

            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue; // Tunnel through water
            } else {
                break; // Wall or Solid
            }
        }

        // Check opposite direction
        const otherDir = -dir;
        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (otherDir * i);
            const content = grid.get(targetX, currentY);

            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue; // Tunnel through water
            } else {
                break; // Wall or Solid
            }
        }

        return moved;
    }
}
