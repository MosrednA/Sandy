import { SharedMemory } from './SharedMemory';
import { Phase, CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './Constants';
import PhysicsWorker from '../workers/physics.worker?worker'; // Vite Worker Import

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
                    chunkState: this.sharedMemory.chunkStateBuffer,
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
        // 1. Snapshot active chunks & Clear Next Frame Buffer
        const chunkState = new Uint8Array(this.sharedMemory.chunkStateBuffer);
        this.currentActiveChunks.set(chunkState);
        chunkState.fill(0); // Clear for writing next frame's info

        // Clear particles from previous frame
        this.activeParticles = [];

        // Generate Jitter
        const jitterX = Math.floor(Math.random() * CHUNK_SIZE);
        const jitterY = Math.floor(Math.random() * CHUNK_SIZE);

        // 2. Run Phases
        // Shuffle phases to prevent directional bias
        const phases = [Phase.RED, Phase.BLUE, Phase.GREEN, Phase.YELLOW];
        for (let i = phases.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [phases[i], phases[j]] = [phases[j], phases[i]];
        }

        // We pass currentActiveChunks to the FIRST phase (whatever it is) just in case,
        // though we currently ignore it in the worker.
        // Actually, we only need to pass it if we use it.
        // For now, let's just pass undefined or keep passing it to all if simpler?
        // Let's pass it to the first one.

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
                    // Collect particles from worker
                    if (e.data.particles) {
                        // NOTE: This assumes RED phase sends particles.
                        // We aggregate them.
                        // Since we clear activeParticles at start of update, we just append here.
                        this.activeParticles.push(...e.data.particles);
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
