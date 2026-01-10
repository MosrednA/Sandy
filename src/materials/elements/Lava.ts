import { Grid } from '../../core/Grid';
import { Liquid } from '../Liquid';
import { MaterialId } from '../MaterialIds';

export class Lava extends Liquid {
    id = MaterialId.LAVA;
    name = 'Lava';
    color = 0xFF4411;
    density = 20;
    dispersion = 3;
    flowRate = 0.15;
    conductivity = 0.6;

    update(grid: Grid, x: number, y: number): boolean {
        const temp = grid.getTemp(x, y);

        if (temp < 600 && Math.random() < 0.15) {
            grid.set(x, y, MaterialId.MAGMA_ROCK);
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

            if (id === MaterialId.WATER) {
                if (temp < 950 && Math.random() < 0.1) {
                    grid.set(x, y, MaterialId.MAGMA_ROCK);
                    grid.set(nx, ny, MaterialId.STEAM);
                    return true;
                }
            } else if (id === MaterialId.ICE) {
                if (Math.random() < 0.4) {
                    grid.set(nx, ny, MaterialId.STEAM);
                    grid.setTemp(nx, ny, 200);
                }
                if (Math.random() < 0.02) {
                    grid.set(x, y, MaterialId.MAGMA_ROCK);
                    return true;
                }
            }
        }

        if (Math.random() < 0.01) {
            const above = grid.get(x, y - 1);
            if (above === MaterialId.EMPTY) {
                const roll = Math.random();
                if (roll < 0.4) {
                    grid.set(x, y - 1, MaterialId.FIRE);
                } else if (roll < 0.7) {
                    grid.set(x, y - 1, MaterialId.SMOKE);
                } else {
                    grid.set(x, y - 1, MaterialId.GAS);
                }
            }
        }

        grid.setTemp(x, y, 1000);
        return super.update(grid, x, y);
    }
}
