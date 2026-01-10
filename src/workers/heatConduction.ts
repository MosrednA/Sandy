import { CHUNK_SIZE } from '../core/Constants';
import { materialRegistry } from '../materials/MaterialRegistry';
import type { World } from '../core/World';
import type { ChunkAssignment } from './types';

// Temperature delta threshold for waking particles (prevents sleeping through heat changes)
const TEMP_WAKE_THRESHOLD = 5;

export function processHeatConduction(world: World, assignedChunks: ChunkAssignment[]) {
    const grid = world.grid;
    const temp = grid.temperature;
    const cells = grid.cells;
    const width = grid.width;
    const sleepTimer = grid.sleepTimer;
    const conductivityLUT = materialRegistry.conductivities;

    for (const chunk of assignedChunks) {
        const { cx, cy } = chunk;
        const chunkIdx = cy * grid.cols + cx;
        if (!grid.activeChunks[chunkIdx]) continue;

        const startX = Math.max(1, cx * CHUNK_SIZE);
        const endX = Math.min(width - 1, (cx + 1) * CHUNK_SIZE);
        const startY = Math.max(1, cy * CHUNK_SIZE);
        const endY = Math.min(grid.height - 1, (cy + 1) * CHUNK_SIZE);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const idx = y * width + x;
                const cellId = cells[idx];
                if (cellId === 0) continue;

                const conductivity = conductivityLUT[cellId];
                const currentTemp = temp[idx];
                let avgTemp = currentTemp;
                let count = 1;

                const up = idx - width;
                const down = idx + width;
                const left = idx - 1;
                const right = idx + 1;

                const addNeighbor = (nIdx: number) => {
                    const nId = cells[nIdx];
                    if (nId !== 0 && nId !== 255) {
                        const nCond = conductivityLUT[nId];
                        const blendCond = Math.sqrt(conductivity * nCond);
                        avgTemp += temp[nIdx] * blendCond;
                        count += blendCond;
                    }
                };

                addNeighbor(up);
                addNeighbor(down);
                addNeighbor(left);
                addNeighbor(right);

                if (count > 1) {
                    const target = avgTemp / count;
                    const newTemp = currentTemp + (target - currentTemp) * conductivity;
                    temp[idx] = newTemp;

                    // Wake particle if temperature changed significantly
                    const delta = Math.abs(newTemp - currentTemp);
                    if (delta > TEMP_WAKE_THRESHOLD) {
                        sleepTimer[idx] = 0;
                        // Wake neighbors too (heat propagates)
                        sleepTimer[up] = 0;
                        sleepTimer[down] = 0;
                        sleepTimer[left] = 0;
                        sleepTimer[right] = 0;
                    }
                }
            }
        }
    }
}
