import { Grid } from './Grid';
import { materialRegistry } from '../materials/MaterialRegistry';
import { WORLD_WIDTH, WORLD_HEIGHT, CHUNK_SIZE } from './Constants';

export class World {
    grid: Grid;
    frameCount: number = 0;

    constructor(width?: number, height?: number, buffers?: {
        grid: SharedArrayBuffer,
        velocity: SharedArrayBuffer,
        temperature: SharedArrayBuffer,
        chunkState: SharedArrayBuffer,
        sync?: SharedArrayBuffer
    }) {
        // Use args or fallback to constants
        const w = width || WORLD_WIDTH;
        const h = height || WORLD_HEIGHT;
        this.grid = new Grid(w, h, buffers);
    }

    update() {
        this.frameCount++;
        this.grid.frameCount = this.frameCount;

        const grid = this.grid;
        const width = grid.width;
        const height = grid.height;
        const cells = grid.cells;
        const activeChunks = grid.activeChunks;
        const cols = grid.cols;
        const rows = grid.rows;

        // Optimization: Chunks
        grid.swapChunks();

        // Iterate through CHUNKS first
        // Note: To preserve the bottom-up gravity logic, we should iterate chunks bottom-up.
        for (let cy = rows - 1; cy >= 0; cy--) {
            const chunkRowOffset = cy * cols;
            for (let cx = 0; cx < cols; cx++) {

                // Check if this chunk is active (from prev frame)
                if (activeChunks[chunkRowOffset + cx] === 0) continue;

                const startY = cy * CHUNK_SIZE;
                const endY = Math.min((cy + 1) * CHUNK_SIZE, height);

                const startChunkX = cx * CHUNK_SIZE;
                const endChunkX = Math.min((cx + 1) * CHUNK_SIZE, width);

                // Iterate pixels inside the chunk - Bottom-Up
                for (let y = endY - 1; y >= startY; y--) {
                    const rowOffset = y * width;
                    const leftToRight = (y + this.frameCount) % 2 === 0;

                    // We need to iterate strictly within [startChunkX, endChunkX)
                    // But handle leftToRight direction
                    let x = leftToRight ? startChunkX : endChunkX - 1;
                    const finalX = leftToRight ? endChunkX : startChunkX - 1;
                    const step = leftToRight ? 1 : -1;

                    // While loop optimized
                    while (x !== finalX) {
                        // Direct access: we are bounds-guaranteed by chunk logic
                        const id = cells[rowOffset + x];
                        if (id !== 0) {
                            const mat = materialRegistry.get(id);
                            if (mat) {
                                mat.update(grid, x, y);
                            }
                        }
                        x += step;
                    }
                }
            }
        }

    }
}
