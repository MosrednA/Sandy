import { Grid } from './Grid';

const SIGNATURE = [0x53, 0x41, 0x4E, 0x44]; // SAND
const VERSION = 1;

export class Serializer {

    /**
     * Serializes the grid into a compressed Uint8Array using RLE.
     * Header: SAND (4) + Ver (1) + W (2) + H (2) + Flags (1)
     * Body: [Count (2), Value (1)] ...
     */
    static serialize(grid: Grid): Uint8Array {
        const width = grid.width;
        const height = grid.height;
        const cells = grid.cells;
        const len = cells.length;

        // Pass 1: Estimate size (conservative)
        // Worst case: No runs = 3 bytes per pixel.
        // We can use a dynamic array or a large buffer and slice it.
        // Using a dynamic approach with array chunks usually safer in JS than pre-allocating huge buffer if we don't know size.
        // But for performance, let's guess.

        const output = [];

        // Write Header
        output.push(...SIGNATURE);
        output.push(VERSION);
        // Width (Uint16)
        output.push(width & 0xFF, (width >> 8) & 0xFF);
        // Height (Uint16)
        output.push(height & 0xFF, (height >> 8) & 0xFF);
        // Flags (Reserved)
        output.push(0);

        // RLE Encoding
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

        // Write final run
        output.push(currentCount & 0xFF, (currentCount >> 8) & 0xFF);
        output.push(currentVal);

        return new Uint8Array(output);
    }

    /**
     * Deserializes data into the grid.
     * Throws error if signature or version mismatch (unless backward compatible).
     */
    static deserialize(data: Uint8Array, grid: Grid): void {
        let ptr = 0;

        // Check Signature
        for (let i = 0; i < 4; i++) {
            if (data[ptr++] !== SIGNATURE[i]) {
                throw new Error('Invalid file signature');
            }
        }

        const version = data[ptr++];
        if (version > VERSION) {
            throw new Error(`Unsupported version: ${version}`);
        }

        const width = data[ptr++] | (data[ptr++] << 8);
        const height = data[ptr++] | (data[ptr++] << 8);
        const flags = data[ptr++]; // Unused for now

        // We could resize the grid here if we wanted to support loading different sizes.
        // For now, let's warn or clear if dimensions don't match, 
        // OR better: Load what fits / center it? 
        // Simplest: Must match.
        if (width !== grid.width || height !== grid.height) {
            console.warn(`World size mismatch. File: ${width}x${height}, Grid: ${grid.width}x${grid.height}. Loading what fits.`);
        }

        grid.clear();

        let cellIndex = 0;
        const maxIndex = grid.width * grid.height;

        while (ptr < data.length) {
            if (cellIndex >= maxIndex) break;

            const count = data[ptr++] | (data[ptr++] << 8);
            const val = data[ptr++];

            // Fill run
            const end = Math.min(cellIndex + count, maxIndex);
            // Optimization: If val is 0, we can skip (since we cleared)
            // But if we didn't clear (or if we want to overwrite), we set.
            if (val !== 0) {
                grid.cells.fill(val, cellIndex, end);
                // We also need to wake chunks for these new particles
                // It's expensive to wake individually. 
                // Better to fill first, then wake active areas?
                // For simplicity, let's just wake all chunks or wake per run.
            }

            // If we are loading a save, we probably want to wake everything to ensure physics starts correctly?
            // Or maybe just static stuff stays static.
            // Let's rely on the user to interact or wake chunks that changed.
            // Actually, we should wake chunks where we place things.
            if (val !== 0) {
                // Wake logic: just wake the start and end of the run? 
                // A run can span many lines. 
                // Simplest robust way: Iterate chunks and wake all? 
                // Or: wake local area.

                // Let's iterate the run range for waking (lazy wake)
                // Since this runs only once on load, a bit of overhead is fine.
                for (let k = cellIndex; k < end; k++) {
                    // Only wake periodicially or just use setIndex logic without atomic overhead?
                    // grid.setIndex(k, val); -> this handles waking.
                    // But we used .fill for speed.

                    // Manual wake for run:
                    const x = k % grid.width;
                    const y = (k / grid.width) | 0;
                    grid.wake(x, y);
                }
            }

            cellIndex = end;
        }

        // After loading, swap chunks to ensure state is consistent
        grid.swapChunks();
    }
}
