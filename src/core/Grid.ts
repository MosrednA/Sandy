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
    /** Per-cell sleep timer (0 = active, increments each idle frame, >= SLEEP_THRESHOLD = sleeping) */
    sleepTimer: Uint8Array;
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
        sleepTimer?: SharedArrayBuffer,
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
            this.sleepTimer = buffers.sleepTimer
                ? new Uint8Array(buffers.sleepTimer)
                : new Uint8Array(width * height);
            if (buffers.sync) {
                this.syncView = new Int32Array(buffers.sync);
            }
        } else {
            this.cells = new Uint8Array(width * height);
            this.velocity = new Float32Array(width * height);
            this.temperature = new Float32Array(width * height);
            this.sleepTimer = new Uint8Array(width * height);
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

        // Move sleep timer (particle stays awake since it moved)
        this.sleepTimer[idx2] = 0;
        this.sleepTimer[idx1] = 0;

        // Wake chunk and particle neighbors
        this.wake(x1, y1);
        this.wake(x2, y2);
        this.wakeNeighbors(x1, y1);
        this.wakeNeighbors(x2, y2);
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

        // Both particles swapped - reset sleep timers
        this.sleepTimer[idx1] = 0;
        this.sleepTimer[idx2] = 0;

        // Wake chunk and particle neighbors
        this.wake(x1, y1);
        this.wake(x2, y2);
        this.wakeNeighbors(x1, y1);
        this.wakeNeighbors(x2, y2);
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
            this.sleepTimer[idx] = 0; // New particle starts awake
            this.wake(x, y);
            this.wakeNeighbors(x, y);
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
        this.sleepTimer[index] = 0; // New particle starts awake
        // Bitwise floor is faster than Math.floor for positive integers
        const x = index - ((index / this.width) | 0) * this.width; // x = index % width (faster)
        const y = (index / this.width) | 0;
        this.wake(x, y);
        this.wakeNeighbors(x, y);
    }

    getIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    clear(): void {
        this.cells.fill(0);
        this.velocity.fill(0);
        this.temperature.fill(20); // Reset to room temp
        this.sleepTimer.fill(0); // Reset sleep timers
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

    /**
     * Wake a specific cell (reset its sleep timer to 0).
     * Called when a particle becomes active.
     */
    wakeCell(x: number, y: number): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.sleepTimer[y * this.width + x] = 0;
        }
    }

    /**
     * Wake a cell and its 8 neighbors (reset sleep timers).
     * Called on any grid mutation to ensure neighbors react to changes.
     */
    wakeNeighbors(x: number, y: number): void {
        const width = this.width;
        const height = this.height;
        const sleepTimer = this.sleepTimer;

        // Wake the 3x3 area centered on (x, y)
        for (let dy = -1; dy <= 1; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            const rowOffset = ny * width;
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                if (nx >= 0 && nx < width) {
                    sleepTimer[rowOffset + nx] = 0;
                }
            }
        }
    }

    /**
     * Scans entire grid and wakes all chunks containing particles,
     * plus the chunk directly below each (gravity anticipation).
     * Call this once per frame before snapshotting active chunks.
     */
    wakeAllOccupiedChunks(): void {
        const width = this.width;
        const cells = this.cells;
        const cols = this.cols;
        const rows = this.rows;

        // Track which chunks have particles
        const occupied = new Uint8Array(cols * rows);

        // Single pass: mark chunks with any non-empty cell
        for (let y = 0; y < this.height; y++) {
            const cy = (y / CHUNK_SIZE) | 0;
            const rowOffset = y * width;
            for (let x = 0; x < width; x++) {
                if (cells[rowOffset + x] !== 0) {
                    const cx = (x / CHUNK_SIZE) | 0;
                    occupied[cy * cols + cx] = 1;
                }
            }
        }

        // Wake occupied chunks + chunk below (gravity) + neighbors
        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                if (occupied[cy * cols + cx]) {
                    // Wake this chunk
                    this.chunks[cy * cols + cx] = 1;
                    // Wake chunk below (gravity anticipation)
                    if (cy + 1 < rows) {
                        this.chunks[(cy + 1) * cols + cx] = 1;
                    }
                    // Wake left/right neighbors (for horizontal spread)
                    if (cx > 0) this.chunks[cy * cols + (cx - 1)] = 1;
                    if (cx + 1 < cols) this.chunks[cy * cols + (cx + 1)] = 1;
                    // Wake diagonal below (for diagonal falling)
                    if (cy + 1 < rows && cx > 0) {
                        this.chunks[(cy + 1) * cols + (cx - 1)] = 1;
                    }
                    if (cy + 1 < rows && cx + 1 < cols) {
                        this.chunks[(cy + 1) * cols + (cx + 1)] = 1;
                    }
                }
            }
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
