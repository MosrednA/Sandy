import { Grid } from '../core/Grid';
import { Material } from './Material';
import { MaterialId } from './MaterialIds';

export class BlackHole extends Material {
    id = MaterialId.BLACK_HOLE;
    name = "BlackHole";
    color = 0x220044; // Deep purple

    // Simplified physics - only consume very nearby particles
    // Visual effect handled by GPU shader/glow
    private readonly CONSUME_RADIUS = 6;
    private readonly PULL_RADIUS = 20; // Much smaller active radius
    private readonly SAMPLES = 20;     // Very few samples

    update(grid: Grid, x: number, y: number): boolean {
        // Only process nearby particles - visual "pull" is done by shader

        for (let i = 0; i < this.SAMPLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.PULL_RADIUS;

            const dx = Math.floor(Math.cos(angle) * dist);
            const dy = Math.floor(Math.sin(angle) * dist);

            if (dx === 0 && dy === 0) continue;

            const px = x + dx;
            const py = y + dy;
            const id = grid.get(px, py);

            // Skip empty, boundary, stone, and other black holes
            if (id === MaterialId.EMPTY || id === MaterialId.WALL || id === MaterialId.STONE || id === MaterialId.BLACK_HOLE) continue;

            const actualDist = Math.sqrt(dx * dx + dy * dy);

            // Consume if close
            if (actualDist <= this.CONSUME_RADIUS) {
                grid.set(px, py, MaterialId.EMPTY);
                continue;
            }

            // Pull toward center
            const moveX = dx > 0 ? -1 : (dx < 0 ? 1 : 0);
            const moveY = dy > 0 ? -1 : (dy < 0 ? 1 : 0);

            const targetX = px + moveX;
            const targetY = py + moveY;

            if (grid.get(targetX, targetY) === MaterialId.EMPTY) {
                grid.move(px, py, targetX, targetY);
            }
        }

        return true;
    }
}

export class Void extends Material {
    id = MaterialId.HOT_SMOKE; // Note: Shares ID with HotSmoke, effectively unused
    name = "Void";
    color = 0x000000; // Pure black

    update(grid: Grid, x: number, y: number): boolean {
        // Void instantly deletes anything touching it
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id !== MaterialId.EMPTY && id !== MaterialId.WALL && id !== MaterialId.HOT_SMOKE && id !== MaterialId.BLACK_HOLE) {
                grid.set(x + n.dx, y + n.dy, MaterialId.EMPTY);
            }
        }

        return false;
    }
}

/**
 * Plasma - Ultra-high temperature ionized gas
 * Emissive, causes chain reactions, melts/vaporizes on contact
 */
export class Plasma extends Material {
    id = MaterialId.PLASMA;
    name = "Plasma";
    color = 0xFF44FF; // Hot magenta/purple
    isGas = true;
    conductivity = 0.9; // Excellent heat conductor

    update(grid: Grid, x: number, y: number): boolean {
        // Plasma is extremely hot
        grid.setTemp(x, y, 2000);

        // Short lifespan
        if (Math.random() < 0.03) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        // Vaporize/ignite neighbors
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            if (id === MaterialId.WALL || id === MaterialId.EMPTY) continue;

            // Vaporize water to steam
            if (id === MaterialId.WATER) {
                grid.set(nx, ny, MaterialId.STEAM);
                continue;
            }

            // Melt ice to steam
            if (id === MaterialId.ICE) {
                grid.set(nx, ny, MaterialId.STEAM);
                continue;
            }

            // Ignite flammable materials
            if (id === MaterialId.WOOD || id === MaterialId.OIL ||
                id === MaterialId.GUNPOWDER || id === MaterialId.COAL) {
                grid.set(nx, ny, MaterialId.FIRE);
                continue;
            }

            // Melt sand to glass
            if (id === MaterialId.SAND && Math.random() < 0.1) {
                grid.set(nx, ny, MaterialId.GLASS);
            }

            // Heat transfer
            grid.setTemp(nx, ny, grid.getTemp(nx, ny) + 200);
        }

        // Rise quickly (ionized = light)
        if (Math.random() > 0.2) {
            return false;
        }

        const dx = Math.floor(Math.random() * 3) - 1;
        const ny = y - 1;
        const nx = x + dx;

        if (grid.get(nx, ny) === MaterialId.EMPTY) {
            grid.move(x, y, nx, ny);
            return true;
        }

        // Spread sideways
        const side = Math.random() < 0.5 ? -1 : 1;
        if (grid.get(x + side, y) === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }
}


