import { World } from '../core/World';
import { materialRegistry } from '../materials/MaterialRegistry';

export class Renderer {
    ctx: CanvasRenderingContext2D;
    world: World;
    imageData: ImageData;
    buffer: Uint32Array;

    // Cache updated 32-bit colors. Use Array/TypedArray for speed.
    private colorCache: Int32Array = new Int32Array(256).fill(0);

    constructor(world: World, ctx: CanvasRenderingContext2D) {
        this.world = world;
        this.ctx = ctx;
        // Turn off smoothing for pixel art look
        this.ctx.imageSmoothingEnabled = false;

        this.imageData = ctx.createImageData(world.grid.width, world.grid.height);
        this.buffer = new Uint32Array(this.imageData.data.buffer);
    }

    private getColor(id: number, baseColor: number): number {
        if (this.colorCache[id] !== 0) return this.colorCache[id];

        // Convert 0xRRGGBB to AABBGGRR (Little Endian)
        const r = (baseColor >> 16) & 0xFF;
        const g = (baseColor >> 8) & 0xFF;
        const b = baseColor & 0xFF;
        const a = 0xFF;

        // 0xAABBGGRR
        const col = (a << 24) | (b << 16) | (g << 8) | r;
        this.colorCache[id] = col;
        return col;
    }

    // Draw only active chunks (Dirty Rects)
    draw() {
        // We must import CHUNK_SIZE here or access from grid if public? Grid doesn't expose it.
        // Assuming CHUNK_SIZE is imported or we use grid.cols logic.
        // Let's rely on grid dimensions.
        const grid = this.world.grid;
        const width = grid.width;
        const height = grid.height;
        const cells = grid.cells;
        const buf = this.buffer;

        // For correct dirty rects, we need to check both:
        // 1. activeChunks (chunks simulated this frame)
        // 2. chunks (chunks just woken up for next frame, meaning they might have received new pixels)
        // If we don't clear/draw 'chunks', inputs might not show up until next frame.

        const cols = grid.cols;
        const rows = grid.rows;
        const chunkSize = Math.ceil(width / cols); // Should match CHUNK_SIZE



        for (let cy = 0; cy < rows; cy++) {
            for (let cx = 0; cx < cols; cx++) {
                const idx = cy * cols + cx;
                // If chunk is not active and will not be active next frame, skip it.
                // It means it's static and the previous frame's pixels are still valid.
                if (grid.activeChunks[idx] === 0 && grid.chunks[idx] === 0) {
                    continue;
                }

                // Make sure we clear this chunk's area in the buffer
                // because we are rewriting it.
                const startX = cx * chunkSize;
                const endX = Math.min((cx + 1) * chunkSize, width);
                const startY = cy * chunkSize;
                const endY = Math.min((cy + 1) * chunkSize, height);

                // Iterate pixels in this chunk
                for (let y = startY; y < endY; y++) {
                    const rowOffset = y * width;
                    for (let x = startX; x < endX; x++) {
                        const i = rowOffset + x;
                        const id = cells[i];

                        // Clear pixel (set to background)
                        // Or draw material color
                        if (id === 0) {
                            buf[i] = 0xFF111111;
                        } else {
                            const mat = materialRegistry.get(id);
                            if (mat) {
                                buf[i] = this.getColor(id, mat.color);
                            } else {
                                buf[i] = 0xFF111111;
                            }
                        }
                    }
                }
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
