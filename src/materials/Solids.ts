import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Empty extends Material {
    id = 0;
    name = "Empty";
    color = 0x000000;
    conductivity = 0.01; // Almost no conduction through air

    update(_grid: Grid, _x: number, _y: number): boolean {
        return false;
    }
}

export class Stone extends Material {
    id = 1;
    name = "Stone";
    color = 0x5C5C6E; // Cool Rocky Gray
    conductivity = 0.3; // Slow conductor
    canSleep = true; // Stone is always static

    update(_grid: Grid, _x: number, _y: number): boolean {
        return false;
    }
}

/**
 * Glass - Solidified sand (created by heating sand)
 * Transparent, doesn't move, can be melted back by extreme heat
 */
export class Glass extends Material {
    id = 27; // MaterialId.GLASS
    name = "Glass";
    color = 0x88CCFF; // Light blue tint for visibility
    conductivity = 0.4;
    canSleep = true; // Glass only reacts to extreme heat

    update(grid: Grid, x: number, y: number): boolean {
        // Glass melts back to sand at very high temperatures
        const temp = grid.getTemp(x, y);
        if (temp > 1200) {
            if (Math.random() < 0.05) {
                grid.set(x, y, 2); // MaterialId.SAND
                return true;
            }
        }
        return false;
    }
}

