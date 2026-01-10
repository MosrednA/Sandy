import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class Cryo extends Material {
    id = MaterialId.CRYO;
    name = 'Cryo';
    color = 0x88FFFF;
    conductivity = 0.7;
    isGas = true;

    update(grid: Grid, x: number, y: number): boolean {
        grid.setTemp(x, y, -100);

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

            if (id === MaterialId.WATER && Math.random() < 0.15) {
                grid.set(nx, ny, MaterialId.ICE);
                grid.setTemp(nx, ny, -20);
            } else if (id === MaterialId.STEAM && Math.random() < 0.2) {
                grid.set(nx, ny, MaterialId.WATER);
            } else if ((id === MaterialId.FIRE || id === MaterialId.EMBER)) {
                grid.set(nx, ny, MaterialId.STEAM);
                if (Math.random() < 0.3) {
                    grid.set(x, y, MaterialId.EMPTY);
                    return true;
                }
            } else if (id === MaterialId.LAVA && Math.random() < 0.2) {
                grid.set(nx, ny, MaterialId.MAGMA_ROCK);
                grid.set(x, y, MaterialId.STEAM);
                return true;
            }
        }

        if (Math.random() < 0.015) {
            grid.set(x, y, MaterialId.EMPTY);
            return true;
        }

        if (Math.random() > 0.5) {
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
}
