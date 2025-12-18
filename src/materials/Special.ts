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

