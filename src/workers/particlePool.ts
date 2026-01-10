/**
 * High-performance particle storage using TypedArrays with object pooling.
 * 
 * Layout per particle (6 floats = 24 bytes):
 * [0] x position
 * [1] y position
 * [2] vx velocity
 * [3] vy velocity
 * [4] id (material)
 * [5] color
 * 
 * Benefits:
 * - Zero GC pressure (no object allocation/deallocation)
 * - Cache-friendly linear memory
 * - Direct transfer to main thread via ArrayBuffer
 */

const FLOATS_PER_PARTICLE = 6;
const INITIAL_CAPACITY = 1024;

export class ParticlePool {
    private data: Float32Array;
    private capacity: number;
    private _count: number = 0;

    constructor(initialCapacity: number = INITIAL_CAPACITY) {
        this.capacity = initialCapacity;
        this.data = new Float32Array(initialCapacity * FLOATS_PER_PARTICLE);
    }

    get count(): number {
        return this._count;
    }

    /**
     * Add a particle to the pool. Returns index.
     */
    add(x: number, y: number, vx: number, vy: number, id: number, color: number): number {
        if (this._count >= this.capacity) {
            this.grow();
        }

        const idx = this._count;
        const offset = idx * FLOATS_PER_PARTICLE;

        this.data[offset] = x;
        this.data[offset + 1] = y;
        this.data[offset + 2] = vx;
        this.data[offset + 3] = vy;
        this.data[offset + 4] = id;
        this.data[offset + 5] = color;

        this._count++;
        return idx;
    }

    /**
     * Get particle data by index.
     */
    get(idx: number): { x: number; y: number; vx: number; vy: number; id: number; color: number } {
        const offset = idx * FLOATS_PER_PARTICLE;
        return {
            x: this.data[offset],
            y: this.data[offset + 1],
            vx: this.data[offset + 2],
            vy: this.data[offset + 3],
            id: this.data[offset + 4],
            color: this.data[offset + 5],
        };
    }

    /**
     * Update particle position.
     */
    setPosition(idx: number, x: number, y: number): void {
        const offset = idx * FLOATS_PER_PARTICLE;
        this.data[offset] = x;
        this.data[offset + 1] = y;
    }

    /**
     * Update particle velocity.
     */
    setVelocity(idx: number, vx: number, vy: number): void {
        const offset = idx * FLOATS_PER_PARTICLE;
        this.data[offset + 2] = vx;
        this.data[offset + 3] = vy;
    }

    /**
     * Get raw data for a particle (for inline access in hot loops).
     */
    getOffset(idx: number): number {
        return idx * FLOATS_PER_PARTICLE;
    }

    /**
     * Direct access to underlying array.
     */
    getData(): Float32Array {
        return this.data;
    }

    /**
     * Remove particle by swapping with last (O(1) removal).
     */
    removeAt(idx: number): void {
        if (idx >= this._count) return;

        const lastIdx = this._count - 1;
        if (idx !== lastIdx) {
            // Swap with last particle
            const srcOffset = lastIdx * FLOATS_PER_PARTICLE;
            const dstOffset = idx * FLOATS_PER_PARTICLE;

            this.data[dstOffset] = this.data[srcOffset];
            this.data[dstOffset + 1] = this.data[srcOffset + 1];
            this.data[dstOffset + 2] = this.data[srcOffset + 2];
            this.data[dstOffset + 3] = this.data[srcOffset + 3];
            this.data[dstOffset + 4] = this.data[srcOffset + 4];
            this.data[dstOffset + 5] = this.data[srcOffset + 5];
        }

        this._count--;
    }

    /**
     * Clear all particles (keeps capacity).
     */
    clear(): void {
        this._count = 0;
    }

    /**
     * Create a copy of active particle data for transfer.
     */
    toTransferBuffer(): { buffer: ArrayBuffer; count: number } | null {
        if (this._count === 0) return null;

        const size = this._count * FLOATS_PER_PARTICLE;
        const buffer = new Float32Array(size);
        buffer.set(this.data.subarray(0, size));

        return { buffer: buffer.buffer, count: this._count };
    }

    private grow(): void {
        const newCapacity = this.capacity * 2;
        const newData = new Float32Array(newCapacity * FLOATS_PER_PARTICLE);
        newData.set(this.data);

        this.capacity = newCapacity;
        this.data = newData;
    }
}

// Constants for inline access
export const PX = 0;
export const PY = 1;
export const PVX = 2;
export const PVY = 3;
export const PID = 4;
export const PCOLOR = 5;
export const PSTRIDE = FLOATS_PER_PARTICLE;
