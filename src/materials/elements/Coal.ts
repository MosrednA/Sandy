import { Grid } from '../../core/Grid';
import { Material } from '../Material';
import { MaterialId } from '../MaterialIds';

export class Coal extends Material {
    id = MaterialId.COAL;
    name = 'Coal';
    color = 0x222222;
    conductivity = 0.15;
    canSleep = true; // Coal can sleep when settled

    update(grid: Grid, x: number, y: number): boolean {
        const temp = grid.getTemp(x, y);
        if (temp > 250 && Math.random() < 0.05) {
            grid.set(x, y, MaterialId.EMBER);
            grid.setVelocity(x, y, 0.8);
            return true;
        }

        const below = grid.get(x, y + 1);
        if (below === MaterialId.EMPTY) {
            grid.move(x, y, x, y + 1);
            return true;
        }

        const dir = Math.random() < 0.5 ? 1 : -1;
        const diag1 = grid.get(x + dir, y + 1);
        if (diag1 === MaterialId.EMPTY) {
            grid.move(x, y, x + dir, y + 1);
            return true;
        }
        const diag2 = grid.get(x - dir, y + 1);
        if (diag2 === MaterialId.EMPTY) {
            grid.move(x, y, x - dir, y + 1);
            return true;
        }

        return Math.random() < 0.2;
    }
}
