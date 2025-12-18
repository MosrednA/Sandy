import { Grid } from '../core/Grid';
import { Material } from './Material';

export class Empty extends Material {
    id = 0;
    name = "Empty";
    color = 0x000000;

    update(_grid: Grid, _x: number, _y: number): boolean {
        return false;
    }
}

export class Stone extends Material {
    id = 1;
    name = "Stone";
    color = 0x5C5C6E; // Cool Rocky Gray

    update(_grid: Grid, _x: number, _y: number): boolean {
        return false;
    }
}
