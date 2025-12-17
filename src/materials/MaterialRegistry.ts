import { Material } from './Material';

// We do not need to import specific materials here just for type safety of the array.
// But we might want them if we were auto-registering.
// However, the previous code imported them but didn't use them (which is fine).
// The main issue was the duplicate class definition.

class MaterialRegistry {
    private materials: Material[] = new Array(256);

    register(material: Material) {
        if (this.materials[material.id]) {
            console.warn(`Material with ID ${material.id} already registered. Overwriting.`);
        }
        this.materials[material.id] = material;
    }

    get(id: number): Material | undefined {
        return this.materials[id];
    }
}

export const materialRegistry = new MaterialRegistry();
