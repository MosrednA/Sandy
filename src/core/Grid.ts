import { CHUNK_SIZE } from './Constants';

export class Grid {
    width: number;
    height: number;
    cells: Uint8Array;

    // Optimization: Active Chunks
    cols: number;
    rows: number;
    chunks: Uint8Array; // 1 = Active, 0 = Sleeping (Next Frame)
    activeChunks: Uint8Array; // 1 = Active, 0 = Sleeping (Current Frame)
    velocity: Float32Array;
    frameCount: number = 0;
    particleCount: number = 0;

    constructor(width: number, height: number, buffers?: { grid: SharedArrayBuffer, velocity: SharedArrayBuffer, chunkState: SharedArrayBuffer }) {
        this.width = width;
        this.height = height;

        this.cols = Math.ceil(width / CHUNK_SIZE);
        this.rows = Math.ceil(height / CHUNK_SIZE);

        if (buffers) {
            this.cells = new Uint8Array(buffers.grid);
            this.velocity = new Float32Array(buffers.velocity);
            this.chunks = new Uint8Array(buffers.chunkState);
        } else {
            // Fallback (or Main Thread init logic if we didn't want SharedMemory class inside Grid?)
            // Actually, best to just pass TypedArrays or Buffers.
            this.cells = new Uint8Array(width * height);
            this.velocity = new Float32Array(width * height);
            this.chunks = new Uint8Array(this.cols * this.rows).fill(1);
        }

        // activeChunks can be local?
        // If workers need to know what was active LAST frame, they need to see it.
        // But usually workers just read 'chunks' which accumulates wake-ups for NEXT frame.
        // We probably only need to share 'chunks' (next frame active state).
        // 'activeChunks' allows us to skip inactive chunks during processing.
        // If we want workers to respect activeChunks, it needs to be shared or synchronized.
        // For simplicity, let's keep activeChunks local to the processing loop or shared if needed.
        // Let's assume activeChunks is local snapshot of shared chunks buffer from start of frame.
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

    /**
     * Moves a particle including its data (velocity).
     * Returns true if successful.
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
            if (old === 0 && id !== 0) this.particleCount++;
            else if (old !== 0 && id === 0) this.particleCount--;

            this.cells[idx] = id;
            this.velocity[idx] = 0; // Reset velocity on manual set
            this.wake(x, y);
        }
    }

    /**
     * Direct access for performance.
     */
    setIndex(index: number, id: number): void {
        const old = this.cells[index];
        if (old === 0 && id !== 0) this.particleCount++;
        else if (old !== 0 && id === 0) this.particleCount--;

        this.cells[index] = id;
        this.velocity[index] = 0; // Reset velocity
        const x = index % this.width;
        const y = Math.floor(index / this.width);
        this.wake(x, y);
    }

    getIndex(x: number, y: number): number {
        return y * this.width + x;
    }

    clear(): void {
        this.cells.fill(0);
        this.velocity.fill(0);
        this.chunks.fill(0);
        this.activeChunks.fill(0);
        this.particleCount = 0;
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
        else if (onRight) this.wakeChunk(cx + 1, cy); // Can't be both left and right if size > 1

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
            // Direct array access if possible, or calculate index
            this.chunks[cy * this.cols + cx] = 1;
        }
    }

    swapChunks() {
        // Swap active buffers
        // activeChunks = current frame reading
        // chunks = next frame writing
        this.activeChunks.set(this.chunks);
        this.chunks.fill(0);
    }
}

