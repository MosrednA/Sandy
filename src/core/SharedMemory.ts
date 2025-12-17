import { WORLD_WIDTH, WORLD_HEIGHT, CHUNK_SIZE } from './Constants';

// Sync buffer indices
export const PARTICLE_COUNT_INDEX = 0;

export class SharedMemory {
    // Grid Data
    gridBuffer: SharedArrayBuffer;
    velocityBuffer: SharedArrayBuffer;

    // chunk active state (cols * rows)
    chunkStateBuffer: SharedArrayBuffer;

    // Sync primitives
    // [0]: particleCount (Int32)
    // [1]: reserved
    // [2]: reserved
    syncBuffer: SharedArrayBuffer;
    syncView: Int32Array;

    constructor() {
        if (!crossOriginIsolated) {
            throw new Error("SharedArrayBuffer requires cross-origin isolation. Please restart the dev server to apply vite.config.ts headers (COOP/COEP).");
        }

        const size = WORLD_WIDTH * WORLD_HEIGHT;
        this.gridBuffer = new SharedArrayBuffer(size); // Uint8
        this.velocityBuffer = new SharedArrayBuffer(size * 4); // Float32

        const cols = Math.ceil(WORLD_WIDTH / CHUNK_SIZE);
        const rows = Math.ceil(WORLD_HEIGHT / CHUNK_SIZE);
        this.chunkStateBuffer = new SharedArrayBuffer(cols * rows); // Uint8 (Active/Sleeping)

        this.syncBuffer = new SharedArrayBuffer(256 * 4); // 256 Int32s
        this.syncView = new Int32Array(this.syncBuffer);
    }

    getParticleCount(): number {
        return Atomics.load(this.syncView, PARTICLE_COUNT_INDEX);
    }

    resetParticleCount(): void {
        Atomics.store(this.syncView, PARTICLE_COUNT_INDEX, 0);
    }
}
