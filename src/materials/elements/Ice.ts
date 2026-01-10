import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class Ice extends Material {
    id = MaterialId.ICE;
    name = 'Ice';
    color = 0x88CCEE;
    conductivity = 0.4;
    canSleep = true; // Ice only reacts to temperature

    update(grid: Grid, x: number, y: number): boolean {
        grid.setTemp(x, y, -50);

        const temp = grid.getTemp(x, y);
        if (temp > 0 && Math.random() < 0.1) {
            grid.set(x, y, MaterialId.WATER);
            return true;
        }

        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.WATER && Math.random() < 0.02) {
                grid.set(x + n.dx, y + n.dy, MaterialId.ICE);
            }
        }

        return false;
    }
}
