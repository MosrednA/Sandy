import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class MagmaRock extends Material {
    id = MaterialId.MAGMA_ROCK;
    name = 'MagmaRock';
    color = 0x442222;
    density = 30;
    conductivity = 0.3;
    canSleep = true; // MagmaRock can sleep when settled

    update(grid: Grid, x: number, y: number): boolean {
        const temp = grid.getTemp(x, y);
        if (temp > 800 && Math.random() < 0.1) {
            grid.set(x, y, MaterialId.LAVA);
            return true;
        }

        const dy = y + 1;
        if (dy < grid.height) {
            const below = grid.get(x, dy);
            if (below === MaterialId.EMPTY) {
                grid.move(x, y, x, dy);
                return true;
            }
            if (below === MaterialId.WATER || below === MaterialId.LAVA || below === MaterialId.OIL) {
                grid.swap(x, y, x, dy);
                return true;
            }
        }

        const dir = Math.random() < 0.5 ? 1 : -1;
        const dx = x + dir;
        const dy2 = y + 1;

        if (dx >= 0 && dx < grid.width && dy2 < grid.height) {
            const belowDiag = grid.get(dx, dy2);
            if (belowDiag === MaterialId.EMPTY) {
                grid.move(x, y, dx, dy2);
                return true;
            }
            if (belowDiag === MaterialId.WATER || belowDiag === MaterialId.LAVA || belowDiag === MaterialId.OIL) {
                grid.swap(x, y, dx, dy2);
                return true;
            }
        }

        return false;
    }
}
