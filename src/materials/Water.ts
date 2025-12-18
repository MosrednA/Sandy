import { Grid } from '../core/Grid';
import { Liquid } from './Liquid';
import { MaterialId } from './MaterialIds';

export class Water extends Liquid {
    id = 3;
    name = "Water";
    color = 0x2266CC; // Deep Blue
    density = 10;
    dispersion = 8;

    update(grid: Grid, x: number, y: number): boolean {
        // Water emits cooling temperature (10° - room temp)
        grid.setTemp(x, y, 10);

        // Temperature state changes
        const temp = grid.getTemp(x, y);

        // Freeze below 0°
        if (temp < 0) {
            if (Math.random() < 0.1) { // 10% - fast freeze
                grid.set(x, y, MaterialId.ICE);
                return true;
            }
        }
        // Boil above 100°
        else if (temp > 100) {
            if (Math.random() < 0.15) { // 15% - fast boil
                grid.set(x, y, MaterialId.STEAM);
                grid.setTemp(x, y, temp); // Keep the heat so it doesn't instantly condense
                return true;
            }
        }

        // Extinguish Fire on contact - creates steam
        const neighbors = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        for (const n of neighbors) {
            const id = grid.get(x + n.dx, y + n.dy);
            if (id === MaterialId.FIRE) {
                // Extinguish fire completely
                grid.set(x + n.dx, y + n.dy, MaterialId.STEAM);
                grid.set(x, y, MaterialId.STEAM); // Water evaporates
                return true;
            }
        }

        // Normal liquid physics
        return super.update(grid, x, y);
    }
}
