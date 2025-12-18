import { Material } from './Material';

// Fast O(1) material lookup using flat array
class MaterialRegistry {
    // Pre-allocated array for O(1) lookup
    private materials: (Material | undefined)[] = new Array(256).fill(undefined);

    // Pre-computed color cache for renderer (avoid property access in hot loop)
    public colors: Uint32Array = new Uint32Array(256);

    // Density Lookup Table (0 = No Density/Solid, >0 = Liquid Density)
    public densities: Uint8Array = new Uint8Array(256);

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
            this.densities[material.id] = 0; // 0 implies unused or solid (infinite density for our checks?) 
            // Logic check: We typically check if (other.density < my.density)
            // If solid has density 0, it means we (10) > solid (0).
            // Wait, usually solid is "heavier" or "fixed".
            // Liquid logic: if (other.density < this.density) -> Swap.
            // If Stone (Solid) has density 0, then Water(10) > Stone(0). Water will swap with Stone?
            // NO. We only swap if we can move there.
            // Usually we check `if (below === 0)` first.
            // If `below` is Stone, we check density?
            // Current code: `if (other && (other.density !== undefined)) { ... }`
            // Solids like Stone usually don't have density defined.
            // So `undefined` check prevents swap.
            // We need a value that represents "Undefined".
            // Uint8Array initializes to 0.
            // If we use 0 to mean "Undefined", then lighter-than-water (Oil=5) cannot be 0.
            // Does anything have density 0? Empty is 0. 
            // Empty has ID 0. densities[0] = 0.

            // If Stone (1) has no density, it is 0.
            // Water(10) checks Stone(0). 0 < 10. Swap?
            // YES, Water would sink through Stone if Stone is 0!
            // Solution: Solids should have MAX_DENSITY (255) effectively?
            // But logic is: `if (other.density < this.density)`.
            // We want to sink through LIGHTER things.
            // So Solids should be HEAVIER (255).
            this.densities[material.id] = 255;
        }

        // Exception: Empty (0) should be 0? 
        // We handle Empty check explicitly `if (below === 0)`.
        // But if we didn't, we want Water(10) to move into Empty(0)?
        // Yes, 0 < 10. So Swap. (Move).

        // What about Gas? Steam?
        // If Gas has no density defined? 
        // Gas should be light.
        // Let's check definitions.
    }

    // Inlined for performance - avoid function call overhead in hot paths
    get(id: number): Material | undefined {
        return this.materials[id];
    }

    // Direct array access for maximum performance
    getUnsafe(id: number): Material {
        return this.materials[id]!;
    }
}

export const materialRegistry = new MaterialRegistry();
