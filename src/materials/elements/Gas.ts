import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class Gas extends Material {
    id = MaterialId.GAS;
    name = 'Gas';
    color = 0xFFEE66;
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        const temp = grid.getTemp(x, y);

        if (temp < -50 && Math.random() < 0.15) {
            grid.set(x, y, MaterialId.CRYO);
            return true;
        }

        if (temp > 1500 && Math.random() < 0.2) {
            grid.set(x, y, MaterialId.PLASMA);
            return true;
        }

        if (temp > 200 && Math.random() < 0.3) {
            this.ignite(grid, x, y);
            return true;
        }

        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;
            const id = grid.get(nx, ny);

            if (id === MaterialId.ICE && Math.random() < 0.08) {
                grid.set(x, y, MaterialId.CRYO);
                return true;
            }

            if (id === MaterialId.LAVA && Math.random() < 0.15) {
                grid.set(x, y, MaterialId.PLASMA);
                return true;
            }

            if (id === MaterialId.CRYO && Math.random() < 0.05) {
                grid.set(x, y, MaterialId.CRYO);
                return true;
            }

            if (id === MaterialId.PLASMA && Math.random() < 0.1) {
                grid.set(x, y, MaterialId.PLASMA);
                return true;
            }
        }

        if (Math.random() < 0.002) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        if (Math.random() > 0.4) {
            return false;
        }

        const dirX = Math.floor(Math.random() * 3) - 1;
        const targetX = x + dirX;
        const targetY = y - 1;

        if (targetY >= 0 && targetX >= 0 && targetX < grid.width) {
            const content = grid.get(targetX, targetY);
            if (content === MaterialId.EMPTY) {
                grid.move(x, y, targetX, targetY);
                return true;
            }
        }

        const side = Math.random() < 0.5 ? -1 : 1;
        if (grid.get(x + side, y) === MaterialId.EMPTY) {
            grid.move(x, y, x + side, y);
            return true;
        }

        return false;
    }

    private ignite(grid: Grid, cx: number, cy: number) {
        const radius = 3;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === MaterialId.WALL || id === undefined) continue;

                    if (id === MaterialId.GAS) {
                        grid.set(nx, ny, MaterialId.FIRE);
                    } else if (id === MaterialId.EMPTY && Math.random() < 0.5) {
                        grid.set(nx, ny, MaterialId.FIRE);
                    }
                }
            }
        }
        grid.set(cx, cy, MaterialId.FIRE);
    }
}
