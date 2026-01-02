import { Grid } from '../core/Grid';

export abstract class Material {
    abstract id: number;
    abstract name: string;
    abstract color: number; // 0xFFEEDD generic hex
    density?: number;
    conductivity: number = 0.2; // Heat conductivity (0.0 = insulator, 1.0 = perfect conductor)
    isGas: boolean = false; // Whether this material can be displaced by falling solids/liquids

    /**
     * Update a single cell.
     * Return true if the cell moved/changed, false otherwise (for optimization/sleep).
     */
    abstract update(grid: Grid, x: number, y: number): boolean;
}
