import { Grid } from './Grid';

/** File signature bytes: 'SAND' in ASCII */
const SIGNATURE = [0x53, 0x41, 0x4E, 0x44]; // SAND
/** Current save format version (2 = with temperature support) */
const VERSION = 2;

/**
 * Handles serialization and deserialization of world state.
 * Uses Run-Length Encoding (RLE) for efficient compression.
 * 
 * File format:
 * - Header: SAND (4 bytes) + Version (1) + Width (2) + Height (2) + Flags (1)
 * - Block 1: Cells RLE [Count (2), MaterialID (1)] ...
 * - Block 2: Temperature RLE [Count (2), Float32 (4)] ... (V2+)
 * 
 * @example
 * ```ts
 * // Save world
 * const data = Serializer.serialize(grid);
 * await fetch('/api/save', { method: 'POST', body: data });
 * 
 * // Load world
 * const response = await fetch('/api/load/world1');
 * Serializer.deserialize(new Uint8Array(await response.arrayBuffer()), grid);
 * ```
 */
export class Serializer {

    /**
     * Serializes the grid into a compressed Uint8Array using RLE.
     * Header: SAND (4) + Ver (1) + W (2) + H (2) + Flags (1)
     * Body: 
     *  - Cells: [Count (2), Value (1)] ...
     *  - Temperature: [Count (2), Value (4)] ... (Added in V2)
     */
    static serialize(grid: Grid): Uint8Array {
        const width = grid.width;
        const height = grid.height;
        const cells = grid.cells;
        const temperature = grid.temperature;
        const len = cells.length;

        const output: number[] = [];

        // Write Header
        output.push(...SIGNATURE);
        output.push(VERSION);
        // Width (Uint16)
        output.push(width & 0xFF, (width >> 8) & 0xFF);
        // Height (Uint16)
        output.push(height & 0xFF, (height >> 8) & 0xFF);
        // Flags (Reserved)
        output.push(0);

        // --- Block 1: Cells RLE ---
        let currentVal = cells[0];
        let currentCount = 0;

        for (let i = 0; i < len; i++) {
            const val = cells[i];

            if (val === currentVal && currentCount < 65535) {
                currentCount++;
            } else {
                // Write previous run
                output.push(currentCount & 0xFF, (currentCount >> 8) & 0xFF);
                output.push(currentVal);

                // Start new run
                currentVal = val;
                currentCount = 1;
            }
        }
        // Final run
        output.push(currentCount & 0xFF, (currentCount >> 8) & 0xFF);
        output.push(currentVal);


        // --- Block 2: Temperature RLE (V2) ---
        // Helper to write float
        const f32 = new Float32Array(1);
        const u8 = new Uint8Array(f32.buffer);

        const writeFloat = (f: number) => {
            f32[0] = f;
            output.push(u8[0], u8[1], u8[2], u8[3]);
        };

        let currentTemp = temperature[0];
        let tempCount = 0;

        for (let i = 0; i < len; i++) {
            const val = temperature[i];

            // Should we reduce precision for better compression? 
            // Exact match might split runs due to floating point drift.
            // Let's rely on exact match for now - 20.0 is common.

            if (val === currentTemp && tempCount < 65535) {
                tempCount++;
            } else {
                // Write prev run
                output.push(tempCount & 0xFF, (tempCount >> 8) & 0xFF);
                writeFloat(currentTemp);

                currentTemp = val;
                tempCount = 1;
            }
        }
        // Final run
        output.push(tempCount & 0xFF, (tempCount >> 8) & 0xFF);
        writeFloat(currentTemp);

        return new Uint8Array(output);
    }

    /**
     * Deserializes data into the grid.
     * @param data - The serialized world data
     * @param grid - The grid to populate with loaded data
     * @throws Error if file signature is invalid (not a .sand file)
     * @throws Error if file version is newer than supported
     */
    static deserialize(data: Uint8Array, grid: Grid): void {
        if (!data || data.length < 10) {
            throw new Error(`Invalid save file: File is too small (${data?.length ?? 0} bytes, minimum 10 required)`);
        }

        let ptr = 0;

        // Check Signature
        for (let i = 0; i < 4; i++) {
            if (data[ptr++] !== SIGNATURE[i]) {
                throw new Error(
                    `Invalid save file: Expected 'SAND' signature but got '${String.fromCharCode(data[0], data[1], data[2], data[3])}'. ` +
                    `This file may be corrupted or not a Sandy world file.`
                );
            }
        }

        const version = data[ptr++];
        if (version > VERSION) {
            throw new Error(
                `Unsupported save file version: File is v${version}, but this version of Sandy only supports up to v${VERSION}. ` +
                `Please update Sandy to load this file.`
            );
        }

        const width = data[ptr++] | (data[ptr++] << 8);
        const height = data[ptr++] | (data[ptr++] << 8);
        ptr++; // Skip flags byte

        if (width !== grid.width || height !== grid.height) {
            console.warn(`World size mismatch. File: ${width}x${height}, Grid: ${grid.width}x${grid.height}. Loading what fits.`);
        }

        grid.clear(); // Resets temp to 20 by default

        const maxIndex = grid.width * grid.height;

        // --- Block 1: Read Cells ---
        let cellIndex = 0;
        let totalParticles = 0;

        while (cellIndex < maxIndex && ptr < data.length) {
            const count = data[ptr++] | (data[ptr++] << 8);
            const val = data[ptr++];

            const end = Math.min(cellIndex + count, maxIndex);

            if (val !== 0) {
                grid.cells.fill(val, cellIndex, end);
                totalParticles += (end - cellIndex);

                // Wake newly placed particles
                // Optimization: just wake chunks involved
                // Lazy approach: wake specific pixels? Or chunks?
                // Just use wake on the start/end/middle?
                // For simplicity, we assume this is rare enough.
                // iterate and wake? No, too slow for loading.
                // Physics will wake them if we set them active? 
                // Grid.clear() makes everything inactive/empty.

                // Let's iterate and wake chunks. 
                // A run might span multiple chunks.
                const startChunkX = (cellIndex % width) >> 6; // >> 6 is / 64 (CHUNK_SIZE)
                const startChunkY = ((cellIndex / width) | 0) >> 6;
                const endChunkX = ((end - 1) % width) >> 6;
                const endChunkY = (((end - 1) / width) | 0) >> 6;

                // Wake rectangle of chunks
                // This is rough but covers it
                for (let cy = startChunkY; cy <= endChunkY; cy++) {
                    for (let cx = startChunkX; cx <= endChunkX; cx++) {
                        // Assuming grid has wakeChunk method or we access ChunkManager?
                        // Grid has wake(x,y).
                        // Let's just wake a representative pixel in each chunk
                        const wx = Math.min((cx * 64) + 32, width - 1);
                        const wy = Math.min((cy * 64) + 32, height - 1);
                        grid.wake(wx, wy);
                    }
                }
            }
            cellIndex = end;
        }

        // --- Block 2: Read Temperature (V2 only) ---
        if (version >= 2) {
            let tempIndex = 0;
            const tempBuffer = new Uint8Array(4);
            const tempView = new DataView(tempBuffer.buffer);

            while (tempIndex < maxIndex && ptr < data.length) {
                const count = data[ptr++] | (data[ptr++] << 8);

                // Read Float32
                tempBuffer[0] = data[ptr++];
                tempBuffer[1] = data[ptr++];
                tempBuffer[2] = data[ptr++];
                tempBuffer[3] = data[ptr++];
                const val = tempView.getFloat32(0, true); // Little endian

                const end = Math.min(tempIndex + count, maxIndex);
                grid.temperature.fill(val, tempIndex, end);

                tempIndex = end;
            }
        }
        // If V1, temperature remains at default (20) from grid.clear()

        // After loading, swap chunks to ensure state is consistent
        grid.swapChunks();

        // Update particle count exactly once after bulk lead
        grid.modifyParticleCount(totalParticles);
    }
}
