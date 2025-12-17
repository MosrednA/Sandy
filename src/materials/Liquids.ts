import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Acid extends Material {
    id = 8;
    name = "Acid";
    color = 0x66FF33; // Bright Green

    update(grid: Grid, x: number, y: number): boolean {
        // 1. Check for corrosion first
        // Check neighbors (down, left, right)
        const neighbors = [
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            // Corrode Stone (1), Sand (2), Wood (5 - if exists)
            // Does not corrode Boundary (255) OR Empty (0) OR Self (8)
            if (id === 1 || id === 2 || id === 5) {
                // Dissolve neighbor and self (probabilistic to last longer?)
                // Simple: Turn neighbor to smoke or empty, turn self to empty.
                if (Math.random() < 0.1) {
                    grid.set(nx, ny, 0); // Destroy neighbor
                    grid.set(x, y, 0);   // Destroy self
                    return true;
                }
            }
        }

        // 2. Movement (Liquid logic - copy of Water but simplified)
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5;
        if (velocity > 8) velocity = 8;

        const steps = Math.floor(velocity);
        let moved = false;
        let currentX = x;
        let currentY = y;
        let hitGround = false;

        // Vertical
        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === 0) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else {
                velocity = 0;
                hitGround = true;
                break;
            }
        }

        if (!hitGround) {
            grid.setVelocity(currentX, currentY, velocity);
            if (moved) this.wakeNeighbors(grid, currentX, currentY);
            return true;
        } else {
            grid.setVelocity(currentX, currentY, 0);
        }

        // Horizontal Dispersion

        // SOLIDITY CHECK: If covered by acid, mostly stay put
        const above = grid.get(x, y - 1);
        if (above === this.id) {
            if (Math.random() > 0.1) return moved; // 90% chance to be solid if covered
        }

        const dispersion = 5;
        const dir = Math.random() < 0.5 ? 1 : -1;

        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (dir * i);
            const content = grid.get(targetX, currentY);
            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue;
            } else {
                break;
            }
        }

        // Try other dir
        const otherDir = -dir;
        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (otherDir * i);
            const content = grid.get(targetX, currentY);
            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue;
            } else {
                break;
            }
        }

        return moved;
    }

    private wakeNeighbors(grid: Grid, x: number, y: number) {
        grid.wake(x, y);
    }
}

export class Oil extends Material {
    id = 9;
    name = "Oil";
    color = 0x331100; // Brownish Black

    update(grid: Grid, x: number, y: number): boolean {
        // Movement (Liquid logic)
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5;
        if (velocity > 8) velocity = 8;

        const steps = Math.floor(velocity);
        let moved = false;
        let currentX = x;
        let currentY = y;
        let hitGround = false;

        // Vertical
        for (let i = 0; i < steps; i++) {
            const nextY = currentY + 1;
            const below = grid.get(currentX, nextY);

            if (below === 0) {
                grid.move(currentX, currentY, currentX, nextY);
                moved = true;
                currentY = nextY;
            } else {
                velocity = 0;
                hitGround = true;
                break;
            }
        }

        if (!hitGround) {
            grid.setVelocity(currentX, currentY, velocity);
            // Implicitly wake handled by move/swap
            return true;
        } else {
            grid.setVelocity(currentX, currentY, 0);
        }

        // Horizontal Dispersion
        const dispersion = 6;
        const dir = Math.random() < 0.5 ? 1 : -1;

        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (dir * i);
            const content = grid.get(targetX, currentY);
            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue;
            } else {
                break;
            }
        }

        const otherDir = -dir;
        for (let i = 1; i <= dispersion; i++) {
            const targetX = currentX + (otherDir * i);
            const content = grid.get(targetX, currentY);
            if (content === 0) {
                grid.move(currentX, currentY, targetX, currentY);
                return true;
            } else if (content === this.id) {
                continue;
            } else {
                break;
            }
        }

        return moved;
    }
}
