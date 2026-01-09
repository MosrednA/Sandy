import { CHUNK_SIZE } from './Constants';
import { PARTICLE_COUNT_INDEX } from './SharedMemory'; // KEEP THIS IMPORT
import type { OffGridParticle } from './Constants'; // Add this

/**
 * 2D grid for the falling sand simulation.
 * Stores material IDs, velocities, and temperatures for each cell.
 * Supports chunk-based sleeping optimization for performance.
 * 
 * @example
 * ```ts
 * const grid = new Grid(256, 256);
 * grid.set(100, 50, MaterialIds.SAND);
 * const id = grid.get(100, 50); // Returns SAND id
 * ```
 */
export class Grid {
    /** Width of the grid in cells */
    width: number;
    /** Height of the grid in cells */
    height: number;
    /** Flat array of material IDs (0 = empty, 255 = boundary) */
    cells: Uint8Array;

    /** Queue for off-grid particles generated during this frame (e.g., firework sparks) */
    public queuedParticles: OffGridParticle[] = [];

    /** Number of chunk columns */
    cols: number;
    /** Number of chunk rows */
    rows: number;
    /** Chunk state for next frame (1 = active, 0 = sleeping) */
    chunks: Uint8Array;
    /** Chunk state for current frame */
    activeChunks: Uint8Array;
    /** Per-cell velocity (positive = falling faster) */
    velocity: Float32Array;
    /** Per-cell temperature in Celsius (default: 20°C room temp) */
    temperature: Float32Array;
    /** Current physics frame count */
    frameCount: number = 0;

    /** Shared sync buffer for atomic particle counting across threads */
    private syncView: Int32Array | null = null;

    /**
     * Creates a new Grid instance.
     * @param width - Grid width in cells
     * @param height - Grid height in cells
     * @param buffers - Optional SharedArrayBuffers for multi-threaded physics
     */
    constructor(width: number, height: number, buffers?: {
        grid: SharedArrayBuffer,
        velocity: SharedArrayBuffer,
        temperature: SharedArrayBuffer,
        chunkState: SharedArrayBuffer,
        sync?: SharedArrayBuffer
    }) {
        this.width = width;
        this.height = height;

        this.cols = Math.ceil(width / CHUNK_SIZE);
        this.rows = Math.ceil(height / CHUNK_SIZE);

        if (buffers) {
            this.cells = new Uint8Array(buffers.grid);
            this.velocity = new Float32Array(buffers.velocity);
            this.temperature = new Float32Array(buffers.temperature);
            this.chunks = new Uint8Array(buffers.chunkState);
            if (buffers.sync) {
                this.syncView = new Int32Array(buffers.sync);
            }
        } else {
            this.cells = new Uint8Array(width * height);
            this.velocity = new Float32Array(width * height);
            this.temperature = new Float32Array(width * height);
            this.chunks = new Uint8Array(this.cols * this.rows).fill(1);
        }

        this.activeChunks = new Uint8Array(this.cols * this.rows).fill(1);
    }

    /**
     * Get material ID at (x, y). Returns 255 (Boundary) if out of bounds.
     */
    get(x: number, y: number): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 255;
        return this.cells[y * this.width + x];
    }

    getVelocity(x: number, y: number): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.velocity[y * this.width + x];
    }

    setVelocity(x: number, y: number, v: number): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.velocity[y * this.width + x] = v;
            this.wake(x, y);
        }
    }

    // Temperature methods
    getTemp(x: number, y: number): number {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 20; // Room temp
        return this.temperature[y * this.width + x];
    }

    setTemp(x: number, y: number, t: number): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.temperature[y * this.width + x] = t;
        }
    }

    /**
     * Moves a particle including its data (velocity).
     */
    move(x1: number, y1: number, x2: number, y2: number): void {
        const idx1 = y1 * this.width + x1;
        const idx2 = y2 * this.width + x2;

        // Move ID
        this.cells[idx2] = this.cells[idx1];
        this.cells[idx1] = 0;

        // Move Velocity
        this.velocity[idx2] = this.velocity[idx1];
        this.velocity[idx1] = 0;

        // Move Temperature
        this.temperature[idx2] = this.temperature[idx1];
        this.temperature[idx1] = 20; // Reset to room temp

        this.wake(x1, y1);
        this.wake(x2, y2);
    }

    /**
     * Swap two particles (including velocity)
     */
    swap(x1: number, y1: number, x2: number, y2: number): void {
        const idx1 = y1 * this.width + x1;
        const idx2 = y2 * this.width + x2;

        const tmpId = this.cells[idx1];
        this.cells[idx1] = this.cells[idx2];
        this.cells[idx2] = tmpId;

        const tmpVel = this.velocity[idx1];
        this.velocity[idx1] = this.velocity[idx2];
        this.velocity[idx2] = tmpVel;

        // Swap Temperature
        const tmpTemp = this.temperature[idx1];
        this.temperature[idx1] = this.temperature[idx2];
        this.temperature[idx2] = tmpTemp;

        this.wake(x1, y1);
        this.wake(x2, y2);
    }

    /**
     * Set material ID at (x, y). Safe vs bounds. Wakes relevant chunks.
     */
    set(x: number, y: number, id: number): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const idx = y * this.width + x;
            const old = this.cells[idx];

            // Update shared particle count atomically
            if (this.syncView) {
                if (old === 0 && id !== 0) {
                    Atomics.add(this.syncView, PARTICLE_COUNT_INDEX, 1);
                } else if (old !== 0 && id === 0) {
                    Atomics.add(this.syncView, PARTICLE_COUNT_INDEX, -1);
                }
            }

            this.cells[idx] = id;
            this.velocity[idx] = 0; // Reset velocity on manual set
            this.temperature[idx] = 20; // Reset to room temp
            this.wake(x, y);
        }
    }

    /**
     * Direct access for performance.
     */
    setIndex(index: number, id: number): void {
        const old = this.cells[index];

        // Update shared particle count atomically
        if (this.syncView) {
            if (old === 0 && id !== 0) {
                Atomics.add(this.syncView, PARTICLE_COUNT_INDEX, 1);
            } else if (old !== 0 && id === 0) {
                Atomics.add(this.syncView, PARTICLE_COUNT_INDEX, -1);
            }
        }

        this.cells[index] = id;
        this.velocity[index] = 0; // Reset velocity
        this.temperature[index] = 20; // Reset to room temp
        // Bitwise floor is faster than Math.floor for positive integers
        const x = index - ((index / this.width) | 0) * this.width; // x = index % width (faster)
        const y = (index / this.width) | 0;
        this.wake(x, y);
    }

    getIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    clear(): void {
        this.cells.fill(0);
        this.velocity.fill(0);
        this.temperature.fill(20); // Reset to room temp
        this.chunks.fill(0);
        this.activeChunks.fill(0);
        if (this.syncView) {
            Atomics.store(this.syncView, PARTICLE_COUNT_INDEX, 0);
        }
    }

    wake(x: number, y: number) {
        // Optimization: Use bitwise floor for positive numbers
        const cx = (x / CHUNK_SIZE) | 0;
        const cy = (y / CHUNK_SIZE) | 0;

        // Always wake own chunk
        this.wakeChunk(cx, cy);

        // Only wake neighbors if we are on the boundary
        const localX = x % CHUNK_SIZE;
        const localY = y % CHUNK_SIZE;

        const onLeft = localX === 0;
        const onRight = localX === CHUNK_SIZE - 1;
        const onTop = localY === 0;
        const onBottom = localY === CHUNK_SIZE - 1;

        if (onLeft) this.wakeChunk(cx - 1, cy);
        else if (onRight) this.wakeChunk(cx + 1, cy);

        if (onTop) this.wakeChunk(cx, cy - 1);
        else if (onBottom) this.wakeChunk(cx, cy + 1);

        // Diagonals
        if (onLeft && onTop) this.wakeChunk(cx - 1, cy - 1);
        else if (onRight && onTop) this.wakeChunk(cx + 1, cy - 1);
        else if (onLeft && onBottom) this.wakeChunk(cx - 1, cy + 1);
        else if (onRight && onBottom) this.wakeChunk(cx + 1, cy + 1);
    }

    private wakeChunk(cx: number, cy: number) {
        if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
            this.chunks[cy * this.cols + cx] = 1;
        }
    }

    swapChunks() {
        this.activeChunks.set(this.chunks);
        this.chunks.fill(0);
    }

    /**
     * Helper to manually adjust particle count (e.g. after bulk loading).
     */
    modifyParticleCount(delta: number): void {
        if (this.syncView && delta !== 0) {
            Atomics.add(this.syncView, PARTICLE_COUNT_INDEX, delta);
        }
    }

    /**
     * Queues a particle to be moved to the off-grid physics system.
     */
    addOffGridParticle(x: number, y: number, vx: number, vy: number, id: number, color: number): void {
        this.queuedParticles.push({ x, y, vx, vy, id, color });
    }
}
