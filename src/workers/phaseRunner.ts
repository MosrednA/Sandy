import { CHUNK_SIZE, Phase, SLEEP_THRESHOLD } from '../core/Constants';
import { materialRegistry } from '../materials/MaterialRegistry';
import type { World } from '../core/World';
import type { ChunkAssignment } from './types';

const cellIndices: number[] = new Array(CHUNK_SIZE * CHUNK_SIZE);
for (let i = 0; i < cellIndices.length; i++) {
    cellIndices[i] = i;
}

function shuffleArray(arr: number[], count: number): void {
    for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

export function runPhase(
    world: World,
    assignedChunks: ChunkAssignment[],
    phase: Phase,
    _jitterX: number,
    _jitterY: number,
    activeChunks?: Uint8Array,
) {
    const grid = world.grid;
    const width = grid.width;
    const height = grid.height;
    const sleepTimer = grid.sleepTimer;
    const canSleepLUT = materialRegistry.canSleep;

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

        // Skip out-of-bounds virtual chunks (we assign -1.. for jitter padding)
        if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) {
            continue;
        }

        // Skip sleeping chunks if snapshot provided
        if (activeChunks) {
            const idx = cy * grid.cols + cx;
            if (activeChunks[idx] === 0) {
                continue;
            }
        }

        const cxEven = cx % 2 === 0;
        const cyEven = cy % 2 === 0;

        let match = false;
        if (isRed && cxEven && cyEven) match = true;
        else if (isBlue && !cxEven && cyEven) match = true;
        else if (isGreen && cxEven && !cyEven) match = true;
        else if (isYellow && !cxEven && !cyEven) match = true;

        if (!match) continue;

        // Process chunk region WITHOUT jitter offset to avoid edge bugs
        // Jitter is meant to prevent directional bias, but causes gaps at screen edges
        // Instead, shuffle cell processing order (already done) handles randomization
        let startChunkX = cx * CHUNK_SIZE;
        let endChunkX = (cx + 1) * CHUNK_SIZE;
        let startY = cy * CHUNK_SIZE;
        let endY = (cy + 1) * CHUNK_SIZE;

        // Clamp to world bounds
        startChunkX = Math.max(0, Math.min(width, startChunkX));
        endChunkX = Math.max(0, Math.min(width, endChunkX));
        startY = Math.max(0, Math.min(height, startY));
        endY = Math.max(0, Math.min(height, endY));

        if (startChunkX >= endChunkX || startY >= endY) continue;

        const chunkWidth = endChunkX - startChunkX;
        const chunkHeight = endY - startY;
        const cellCount = chunkWidth * chunkHeight;

        shuffleArray(cellIndices, cellCount);

        for (let i = 0; i < cellCount; i++) {
            const idx = cellIndices[i];
            const localX = idx % chunkWidth;
            const localY = Math.floor(idx / chunkWidth);
            const x = startChunkX + localX;
            const y = startY + localY;

            const cellIdx = y * width + x;
            const id = grid.cells[cellIdx];
            if (id !== 0) {
                // Check if particle is sleeping
                const timer = sleepTimer[cellIdx];
                const canSleep = canSleepLUT[id];

                if (canSleep && timer >= SLEEP_THRESHOLD) {
                    // Particle is sleeping - skip update
                    continue;
                }

                const m = materialRegistry.get(id);
                if (m) {
                    const moved = m.update(grid, x, y);
                    if (!moved && canSleep) {
                        // Particle didn't move - increment sleep timer (cap at 255)
                        if (timer < 255) {
                            sleepTimer[cellIdx] = timer + 1;
                        }
                    }
                    // Note: If particle moved, wakeNeighbors() was called by grid.move/swap/set
                    // which resets the sleep timer
                }
            }
        }
    }
}
