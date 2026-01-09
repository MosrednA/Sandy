import { Material } from './Material';

/**
 * Central registry for all materials in the simulation.
 * Provides O(1) lookup via pre-allocated arrays and caches computed values
 * (colors, densities, conductivities) for high-performance rendering and physics.
 * 
 * @example
 * ```ts
 * import { materialRegistry } from './MaterialRegistry';
 * 
 * // Register a new material
 * materialRegistry.register(new Sand());
 * 
 * // Get material by ID
 * const material = materialRegistry.get(2); // Returns Sand
 * 
 * // Fast color lookup for rendering
 * const color = materialRegistry.colors[2]; // ABGR format
 * ```
 */
class MaterialRegistry {
    /** Pre-allocated array for O(1) material lookup by ID. Max 256 materials. */
    private materials: (Material | undefined)[] = new Array(256).fill(undefined);

    /** 
     * Pre-computed ABGR colors for each material ID.
     * Used by the renderer to avoid property access in hot loops.
     * Format: 0xAABBGGRR (little-endian for direct pixel writes)
     */
    public colors: Uint32Array = new Uint32Array(256);

    /** 
     * Density lookup table for liquid displacement physics.
     * - 0: Empty/undefined
     * - 1-254: Lighter to heavier liquids
     * - 255: Solid (infinite density, cannot be displaced)
     */
    public densities: Uint8Array = new Uint8Array(256);

    /** 
     * Thermal conductivity lookup table for heat simulation.
     * Range: 0.0 (insulator) to 1.0 (perfect conductor).
     * Default: 0.2
     */
    public conductivities: Float32Array = new Float32Array(256).fill(0.2);

    /**
     * Registers a material and pre-computes its lookup values.
     * @param material - The material instance to register
     * @throws Console warning if overwriting an existing material ID
     */
    register(material: Material) {
        if (this.materials[material.id]) {
            console.warn(`Material with ID ${material.id} already registered. Overwriting.`);
        }
        this.materials[material.id] = material;

        // Pre-compute ABGR color for fast rendering
        const r = (material.color >> 16) & 0xFF;
        const g = (material.color >> 8) & 0xFF;
        const b = material.color & 0xFF;
        // ABGR format for little-endian systems
        this.colors[material.id] = (0xFF << 24) | (b << 16) | (g << 8) | r;

        // Populate Density LUT
        if (material.density !== undefined) {
            this.densities[material.id] = material.density;
        } else {
            // Solids should be HEAVIER (255) to prevent liquids sinking through them
            this.densities[material.id] = 255;
        }

        // Populate Conductivity LUT
        this.conductivities[material.id] = material.conductivity ?? 0.2;
    }

    /**
     * Gets a material by ID with bounds checking.
     * @param id - Material ID (0-255)
     * @returns The material instance or undefined if not registered
     */
    get(id: number): Material | undefined {
        return this.materials[id];
    }

    /**
     * Gets a material by ID without bounds checking.
     * Use only when you are certain the ID is valid (hot paths).
     * @param id - Material ID (0-255)
     * @returns The material instance (undefined behavior if not registered)
     */
    getUnsafe(id: number): Material {
        return this.materials[id]!;
    }
}

/** Singleton instance of the material registry. */
export const materialRegistry = new MaterialRegistry();

