import { SharedMemory } from './SharedMemory';
import { Phase, CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './Constants';
import PhysicsWorker from '../workers/physics.worker?worker'; // Vite Worker Import

/**
 * Scans grid buffer and wakes chunks that contain particles + neighbors.
 * Operates directly on SharedArrayBuffers from main thread.
 */
function wakeOccupiedChunks(
    gridBuffer: SharedArrayBuffer,
    chunkStateBuffer: SharedArrayBuffer,
    width: number,
    height: number,
    cols: number,
    rows: number
): void {
    const cells = new Uint8Array(gridBuffer);
    const chunks = new Uint8Array(chunkStateBuffer);

    // Track which chunks have particles
    const occupied = new Uint8Array(cols * rows);

    // Single pass: mark chunks with any non-empty cell
    for (let y = 0; y < height; y++) {
        const cy = (y / CHUNK_SIZE) | 0;
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
            if (cells[rowOffset + x] !== 0) {
                const cx = (x / CHUNK_SIZE) | 0;
                occupied[cy * cols + cx] = 1;
            }
        }
    }

    // Wake occupied chunks + neighbors (gravity + spread + rise)
    for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
            if (occupied[cy * cols + cx]) {
                // Wake this chunk
                chunks[cy * cols + cx] = 1;
                // Wake chunk below (gravity for solids/liquids)
                if (cy + 1 < rows) {
                    chunks[(cy + 1) * cols + cx] = 1;
                }
                // Wake chunk above (for rising gases)
                if (cy > 0) {
                    chunks[(cy - 1) * cols + cx] = 1;
                }
                // Wake left/right (horizontal spread)
                if (cx > 0) chunks[cy * cols + (cx - 1)] = 1;
                if (cx + 1 < cols) chunks[cy * cols + (cx + 1)] = 1;
                // Wake diagonal below (diagonal falling)
                if (cy + 1 < rows && cx > 0) {
                    chunks[(cy + 1) * cols + (cx - 1)] = 1;
                }
                if (cy + 1 < rows && cx + 1 < cols) {
                    chunks[(cy + 1) * cols + (cx + 1)] = 1;
                }
            }
        }
    }
}

export class WorkerManager {
    workers: Worker[] = [];
    sharedMemory: SharedMemory;
    workerCount: number;

    // Active Chunks snapshot for the current frame
    // We copy the SAB 'chunks' (next frame wakeups) to this array at start of frame
    // and pass it to workers.
    currentActiveChunks: Uint8Array;

    // Aggregated off-grid particles for rendering
    activeParticles: any[] = []; // Using any to avoid importing type issues for now, or import it.

    constructor(sharedMemory: SharedMemory) {
        this.sharedMemory = sharedMemory;
        this.workerCount = navigator.hardwareConcurrency || 4;

        // Calculate grid dims for chunk assignment
        const cols = Math.ceil(WORLD_WIDTH / CHUNK_SIZE);
        const rows = Math.ceil(WORLD_HEIGHT / CHUNK_SIZE);
        this.currentActiveChunks = new Uint8Array(cols * rows);

        this.initWorkers(cols, rows);
    }

    private initWorkers(cols: number, rows: number) {
        // Simple distinct chunk assignment (Stripes or Blocks?)
        // Let's do Blocks for better spatial locality? Or standard stripes?
        // Task list suggested specific assignment.
        // Let's assign chunks round-robin to ensure load balancing if activity is localized?
        // Or create fixed regions.
        // Round-robin by chunks allows good distribution.

        const assignments: { cx: number, cy: number }[][] = Array.from({ length: this.workerCount }, () => []);

        let i = 0;
        // We start from -1 to handle Jitter shifting the grid Right/Down.
        // Chunk -1 covers the gap created at 0..Offset.
        for (let y = -1; y < rows; y++) {
            for (let x = -1; x < cols; x++) {
                assignments[i % this.workerCount].push({ cx: x, cy: y });
                i++;
            }
        }

        for (let w = 0; w < this.workerCount; w++) {
            const worker = new PhysicsWorker();
            this.workers.push(worker);

            worker.postMessage({
                type: 'INIT',
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                id: w,
                assigned: assignments[w],
                buffers: {
                    grid: this.sharedMemory.gridBuffer,
                    velocity: this.sharedMemory.velocityBuffer,
                    temperature: this.sharedMemory.temperatureBuffer,
                    chunkState: this.sharedMemory.chunkStateBuffer,
                    sleepTimer: this.sharedMemory.sleepTimerBuffer,
                    sync: this.sharedMemory.syncBuffer
                }
            });
        }
    }

    // Async update logic
    // We return a Promise that resolves when the frame is COMPLETE.
    // This allows Main loop to await it before Rendering (or Render in parallel if using double buffer, but we render directly from SAB).
    // Ideally:
    // 1. Prepare Frame (snapshot active chunks)
    // 2. Run Phase 0 -> Wait -> Phase 1 -> Wait -> ...
    // 3. Resolve

    async update() {
        const cols = Math.ceil(WORLD_WIDTH / CHUNK_SIZE);
        const rows = Math.ceil(WORLD_HEIGHT / CHUNK_SIZE);

        // 1. Wake all chunks containing particles + their neighbors
        // This ensures falling particles always have destination chunks active
        wakeOccupiedChunks(
            this.sharedMemory.gridBuffer,
            this.sharedMemory.chunkStateBuffer,
            WORLD_WIDTH,
            WORLD_HEIGHT,
            cols,
            rows
        );

        // 2. Snapshot active chunks for this frame
        const chunkState = new Uint8Array(this.sharedMemory.chunkStateBuffer);
        this.currentActiveChunks.set(chunkState);

        // 3. Clear chunk state for next frame's wake calls
        chunkState.fill(0);

        // Clear particles from previous frame
        this.activeParticles = [];

        // Generate Jitter
        const jitterX = Math.floor(Math.random() * CHUNK_SIZE);
        const jitterY = Math.floor(Math.random() * CHUNK_SIZE);

        // 4. Run Phases
        // Shuffle phases to prevent directional bias
        const phases = [Phase.RED, Phase.BLUE, Phase.GREEN, Phase.YELLOW];
        for (let i = phases.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [phases[i], phases[j]] = [phases[j], phases[i]];
        }

        // Pass activeChunks snapshot to all phases for chunk sleeping optimization
        await this.runPhase(phases[0], this.currentActiveChunks, jitterX, jitterY);
        await this.runPhase(phases[1], this.currentActiveChunks, jitterX, jitterY);
        await this.runPhase(phases[2], this.currentActiveChunks, jitterX, jitterY);
        await this.runPhase(phases[3], this.currentActiveChunks, jitterX, jitterY);
    }

    private runPhase(phase: Phase, activeSnapshot?: Uint8Array, jitterX: number = 0, jitterY: number = 0): Promise<void> {
        return new Promise(resolve => {
            let completed = 0;
            const target = this.workerCount;

            const onDone = (e: MessageEvent) => {
                if (e.data.type === 'DONE') {
                    // BATCH MESSAGE PASSING: Unpack particles from Transferable ArrayBuffer
                    if (e.data.particleBuffer && e.data.particleCount > 0) {
                        const buffer = new Float32Array(e.data.particleBuffer);
                        const count = e.data.particleCount;
                        // Layout: [x, y, vx, vy, id, color] per particle (6 floats each)
                        for (let i = 0; i < count; i++) {
                            const offset = i * 6;
                            this.activeParticles.push({
                                x: buffer[offset],
                                y: buffer[offset + 1],
                                vx: buffer[offset + 2],
                                vy: buffer[offset + 3],
                                id: buffer[offset + 4],
                                color: buffer[offset + 5]
                            });
                        }
                    }

                    completed++;
                    if (completed === target) {
                        // All workers done
                        this.workers.forEach(w => w.removeEventListener('message', onDone));
                        resolve();
                    }
                }
            };

            this.workers.forEach(w => {
                w.addEventListener('message', onDone);
                w.postMessage({
                    type: 'PHASE',
                    phase: phase,
                    activeChunks: activeSnapshot, // Only sent if provided (Phase 0)
                    jitterX,
                    jitterY
                });
            });
        });
    }
}
