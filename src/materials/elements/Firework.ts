import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class Firework extends Material {
    id = MaterialId.FIREWORK;
    name = 'Firework';
    color = 0xFF00FF;

    update(grid: Grid, x: number, y: number): boolean {
        let velocity = grid.getVelocity(x, y);

        if (velocity === 0) {
            velocity = -3 - Math.random() * 2;
            grid.setVelocity(x, y, velocity);
        }

        velocity += 0.08;

        if (velocity >= -0.1 && velocity <= 0.5) {
            this.explode(grid, x, y);
            return true;
        }

        const targetY = y + Math.round(velocity);
        const above = grid.get(x, targetY);

        if (above === MaterialId.EMPTY) {
            grid.move(x, y, x, targetY);
            grid.setVelocity(x, targetY, velocity);
            return true;
        }
        if (above !== MaterialId.WALL && above !== undefined) {
            this.explode(grid, x, y);
            return true;
        }

        grid.setVelocity(x, y, velocity);
        return true;
    }

    private explode(grid: Grid, cx: number, cy: number) {
        const radius = 4 + Math.floor(Math.random() * 3);

        grid.set(cx, cy, MaterialId.EMPTY);

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist2 = dx * dx + dy * dy;
                if (dist2 <= radius * radius) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    const id = grid.get(nx, ny);

                    if (id === MaterialId.EMPTY && Math.random() < 0.4) {
                        grid.set(nx, ny, MaterialId.FIRE);
                    }
                }
            }
        }
    }
}
