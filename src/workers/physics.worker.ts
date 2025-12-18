import { World } from '../core/World';
import { Phase, CHUNK_SIZE } from '../core/Constants';
import { materialRegistry } from '../materials/MaterialRegistry';
import { registerAllMaterials } from '../materials/registerAll';

// Register all materials (centralized to prevent sync issues)
registerAllMaterials();

let world: World;
let assignedChunks: { cx: number, cy: number }[] = [];
let workerId = -1;
// Reserved for future chunk sleeping optimization
// @ts-expect-error Reserved for future use
let _currentActiveChunks: Uint8Array | null = null;
let jitterX = 0;
let jitterY = 0;
// @ts-expect-error Reserved for future use
let _cols = 0;

self.onmessage = (e) => {
    const data = e.data;

    if (data.type === 'INIT') {
        const { width, height, buffers, id, assigned } = data;
        workerId = id;
        assignedChunks = assigned;
        _cols = Math.ceil(width / CHUNK_SIZE);

        world = new World(width, height, buffers);

        console.log(`Worker ${id} initialized with ${assignedChunks.length} chunks.`);
    } else if (data.type === 'PHASE') {
        if (!world) return;

        const phase = data.phase as Phase;

        // Receive activeChunks snapshot for sleep optimization
        if (data.activeChunks) {
            _currentActiveChunks = new Uint8Array(data.activeChunks);
        }

        if (data.jitterX !== undefined) jitterX = data.jitterX;
        if (data.jitterY !== undefined) jitterY = data.jitterY;

        runPhase(phase);

        // Notify done
        self.postMessage({ type: 'DONE', workerId });
    }
};

// Pre-allocated array for shuffled cell indices (reused each chunk)
const cellIndices: number[] = new Array(CHUNK_SIZE * CHUNK_SIZE);
for (let i = 0; i < cellIndices.length; i++) cellIndices[i] = i;

// Fisher-Yates shuffle (in-place, fast)
function shuffleArray(arr: number[], count: number): void {
    for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

function runPhase(phase: Phase) {
    const grid = world.grid;
    const width = grid.width;
    const height = grid.height;

    // Increment frame count only on Phase 0
    if (phase === Phase.RED) {
        world.frameCount++;
        grid.frameCount = world.frameCount;
    }

    const isRed = phase === Phase.RED;
    const isBlue = phase === Phase.BLUE;
    const isGreen = phase === Phase.GREEN;
    const isYellow = phase === Phase.YELLOW;

    for (const chunk of assignedChunks) {
        const { cx, cy } = chunk;

        // Check Phase Match (Checkerboard pattern)
        const cxEven = cx % 2 === 0;
        const cyEven = cy % 2 === 0;

        let match = false;
        if (isRed && cxEven && cyEven) match = true;
        else if (isBlue && !cxEven && cyEven) match = true;
        else if (isGreen && cxEven && !cyEven) match = true;
        else if (isYellow && !cxEven && !cyEven) match = true;

        if (!match) continue;

        // Process Chunk with JITTER offset
        let startChunkX = cx * CHUNK_SIZE + jitterX;
        let endChunkX = (cx + 1) * CHUNK_SIZE + jitterX;
        let startY = cy * CHUNK_SIZE + jitterY;
        let endY = (cy + 1) * CHUNK_SIZE + jitterY;

        // Clamp to World Bounds
        startChunkX = Math.max(0, Math.min(width, startChunkX));
        endChunkX = Math.max(0, Math.min(width, endChunkX));
        startY = Math.max(0, Math.min(height, startY));
        endY = Math.max(0, Math.min(height, endY));

        if (startChunkX >= endChunkX || startY >= endY) continue;

        const chunkWidth = endChunkX - startChunkX;
        const chunkHeight = endY - startY;
        const cellCount = chunkWidth * chunkHeight;

        // Shuffle cell indices for this chunk
        shuffleArray(cellIndices, cellCount);

        // Process cells in shuffled order
        for (let i = 0; i < cellCount; i++) {
            const idx = cellIndices[i];
            const localX = idx % chunkWidth;
            const localY = Math.floor(idx / chunkWidth);
            const x = startChunkX + localX;
            const y = startY + localY;

            const id = grid.cells[y * width + x];
            if (id !== 0) {
                const m = materialRegistry.get(id);
                if (m) {
                    m.update(grid, x, y);
                }
            }
        }
    }
}
