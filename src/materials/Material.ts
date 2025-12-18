import { Grid } from '../core/Grid';

export abstract class Material {
    abstract id: number;
    abstract name: string;
    abstract color: number; // 0xFFEEDD generic hex
    density?: number;

    /**
     * Update a single cell.
     * Return true if the cell moved/changed, false otherwise (for optimization/sleep).
     */
    abstract update(grid: Grid, x: number, y: number): boolean;
}
