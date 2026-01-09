import { World } from '../core/World';
import { Phase, CHUNK_SIZE } from '../core/Constants';
import type { OffGridParticle } from '../core/Constants';
import { materialRegistry } from '../materials/MaterialRegistry';
import { registerAllMaterials } from '../materials/registerAll';

// Register all materials (centralized to prevent sync issues)
registerAllMaterials();

let world: World;
let assignedChunks: { cx: number, cy: number }[] = [];
let workerId = -1;

let jitterX = 0;
let jitterY = 0;

const offGridParticles: OffGridParticle[] = [];

self.onmessage = (e) => {
    const data = e.data;

    if (data.type === 'INIT') {
        const { width, height, buffers, id, assigned } = data;
        workerId = id;
        assignedChunks = assigned;

        world = new World(width, height, buffers);

        console.log(`Worker ${id} initialized with ${assignedChunks.length} chunks.`);
    } else if (data.type === 'PHASE') {
        if (!world) return;

        const phase = data.phase as Phase;

        // Receive activeChunks snapshot for sleep optimization


        if (data.jitterX !== undefined) jitterX = data.jitterX;
        if (data.jitterY !== undefined) jitterY = data.jitterY;

        runPhase(phase);

        // Process Physics once per frame (Phase RED is start of frame)
        let particleBuffer: ArrayBuffer | undefined;
        let particleCount = 0;

        if (phase === Phase.RED) {
            processHeatConduction();
            processOffGridParticles();

            // BATCH MESSAGE PASSING: Pack particles into a Transferable Float32Array
            // Layout: [x, y, vx, vy, id, color] per particle (6 floats each)
            if (offGridParticles.length > 0) {
                particleCount = offGridParticles.length;
                const buffer = new Float32Array(particleCount * 6);
                for (let i = 0; i < particleCount; i++) {
                    const p = offGridParticles[i];
                    const offset = i * 6;
                    buffer[offset] = p.x;
                    buffer[offset + 1] = p.y;
                    buffer[offset + 2] = p.vx;
                    buffer[offset + 3] = p.vy;
                    buffer[offset + 4] = p.id;
                    buffer[offset + 5] = p.color;
                }
                particleBuffer = buffer.buffer;
            }
        }

        // Notify done - use Transferable for particle buffer to avoid copying
        if (particleBuffer) {
            self.postMessage(
                { type: 'DONE', workerId, particleBuffer, particleCount },
                { transfer: [particleBuffer] } // Transfer ownership, zero-copy
            );
        } else {
            self.postMessage({ type: 'DONE', workerId });
        }
    }
};

// NEW: Heat conduction - spread temperature between neighboring particles
// Uses per-material conductivity and only processes active chunks
function processHeatConduction() {
    const grid = world.grid;
    const temp = grid.temperature;
    const cells = grid.cells;
    const width = grid.width;

    // Process only assigned chunks that are active
    for (const chunk of assignedChunks) {
        const { cx, cy } = chunk;

        // Skip sleeping chunks (no moving particles)
        const chunkIdx = cy * grid.cols + cx;
        if (!grid.activeChunks[chunkIdx]) continue;

        // Calculate chunk bounds
        const startX = Math.max(1, cx * CHUNK_SIZE);
        const endX = Math.min(width - 1, (cx + 1) * CHUNK_SIZE);
        const startY = Math.max(1, cy * CHUNK_SIZE);
        const endY = Math.min(grid.height - 1, (cy + 1) * CHUNK_SIZE);

        // Process cells in this chunk
        // Use pre-computed conductivity LUT for performance
        const conductivityLUT = materialRegistry.conductivities;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const idx = y * width + x;
                const cellId = cells[idx];
                if (cellId === 0) continue; // Skip empty

                // Get this material's conductivity from LUT (no function call)
                const conductivity = conductivityLUT[cellId];

                const currentTemp = temp[idx];
                let avgTemp = currentTemp;
                let count = 1;

                // Check 4 cardinal neighbors
                const up = idx - width;
                const down = idx + width;
                const left = idx - 1;
                const right = idx + 1;

                // Helper to add neighbor with averaged conductivity (uses LUT)
                const addNeighbor = (nIdx: number) => {
                    const nId = cells[nIdx];
                    if (nId !== 0 && nId !== 255) {
                        const nCond = conductivityLUT[nId];
                        // Use geometric mean of conductivities
                        const blendCond = Math.sqrt(conductivity * nCond);
                        avgTemp += temp[nIdx] * blendCond;
                        count += blendCond;
                    }
                };

                addNeighbor(up);
                addNeighbor(down);
                addNeighbor(left);
                addNeighbor(right);

                // Blend towards weighted average
                if (count > 1) {
                    const target = avgTemp / count;
                    temp[idx] = currentTemp + (target - currentTemp) * conductivity;
                }
            }
        }
    }
}

function processOffGridParticles() {
    const grid = world.grid;
    // 1. Ingest queued particles from Grid (generated by Explosions this frame)
    if (grid.queuedParticles.length > 0) {
        offGridParticles.push(...grid.queuedParticles);
        grid.queuedParticles = []; // Clear queue
    }

    // 2. Simulate
    const width = grid.width;
    const height = grid.height;

    for (let i = offGridParticles.length - 1; i >= 0; i--) {
        const p = offGridParticles[i];

        // Physics
        p.vy += 0.2; // Gravity
        p.vx *= 0.99; // Drag
        p.vy *= 0.99;

        const nextX = p.x + p.vx;
        const nextY = p.y + p.vy;

        // Bounds Check
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
            // Out of bounds: Destroy
            offGridParticles.splice(i, 1);
            continue;
        }

        // Collision Check (Simple point check at floor)
        const ix = Math.floor(nextX);
        const iy = Math.floor(nextY);

        // If hitting a solid/liquid (non-empty, non-gas)
        const hitId = grid.get(ix, iy);
        const hitMat = hitId !== 0 ? materialRegistry.get(hitId) : null;
        const hitIsGas = hitMat?.isGas ?? false;

        // Swap with gases (steam, smoke, etc.) - move the gas to previous position
        if (hitIsGas) {
            const prevIX = Math.floor(p.x);
            const prevIY = Math.floor(p.y);
            // Swap: put gas at previous position (if empty), continue moving
            if (grid.get(prevIX, prevIY) === 0) {
                grid.set(prevIX, prevIY, hitId);
                grid.set(ix, iy, 0); // Clear gas from target
            }
            // Move through
            p.x = nextX;
            p.y = nextY;
        } else if (hitId !== 0 && hitId !== 255) {
            // Hit something solid! Re-integrate.
            const prevIX = Math.floor(p.x);
            const prevIY = Math.floor(p.y);

            // Check if previous position is valid for placement
            if (grid.get(prevIX, prevIY) === 0) {
                grid.set(prevIX, prevIY, p.id);
                grid.setVelocity(prevIX, prevIY, p.vy); // Transfer momentum

                // Splash Effect
                // If we hit liquid with high velocity, splash some liquid up
                const isLiquid = hitId === 3 || hitId === 8 || hitId === 9 || hitId === 14 || hitId === 20;
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

                if (isLiquid && speed > 3) {
                    // CONSERVATION OF MASS:
                    // Only splash if we can remove a pixel of liquid.
                    // We only splash 1 particle per impact to avoid explosion.
                    // Or we can splash more if we remove more? 
                    // Let's splash 1 particle for now. 

                    // Remove the liquid we hit
                    grid.set(ix, iy, 0);

                    offGridParticles.push({
                        x: ix, // Start at the source liquid position
                        y: iy,
                        vx: (Math.random() - 0.5) * 4, // Random spray
                        vy: -2 - Math.random() * 4, // Upward force
                        id: hitId,
                        color: 0
                    });
                }
            } else {
                // Try to squeeze in? For now just absorb.
            }

            offGridParticles.splice(i, 1);
        } else {
            // Move free (empty or boundary already handled)
            p.x = nextX;
            p.y = nextY;
        }
    }
}

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

        // NOTE: Chunk sleeping optimization removed - was causing particles to freeze.
        // The wake propagation logic needs more work before this can be re-enabled.

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
