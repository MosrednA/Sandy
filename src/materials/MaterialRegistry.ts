import { Material } from './Material';

// Fast O(1) material lookup using flat array
class MaterialRegistry {
    // Pre-allocated array for O(1) lookup
    private materials: (Material | undefined)[] = new Array(256).fill(undefined);

    // Pre-computed color cache for renderer (avoid property access in hot loop)
    public colors: Uint32Array = new Uint32Array(256);

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
