import { World } from '../core/World';
import { Phase, CHUNK_SIZE } from '../core/Constants';
import { materialRegistry } from '../materials/MaterialRegistry';
import { Empty, Stone } from '../materials/Solids';
import { Sand } from '../materials/Sand';
import { Water } from '../materials/Water';
import { Acid, Oil } from '../materials/Liquids';
import { Steam, Smoke } from '../materials/Gases';
import { Fire, Gunpowder } from '../materials/Energetics';
import { Wood, Ember } from '../materials/Wood';
import { Lava, Ice, Plant, Gas } from '../materials/Elements';
import { BlackHole } from '../materials/Special';

// Force Register
materialRegistry.register(new Empty());
materialRegistry.register(new Stone());
materialRegistry.register(new Sand());
materialRegistry.register(new Water());
materialRegistry.register(new Acid());
materialRegistry.register(new Steam());
materialRegistry.register(new Oil());
materialRegistry.register(new Fire());
materialRegistry.register(new Gunpowder());
materialRegistry.register(new Wood());
materialRegistry.register(new Smoke());
materialRegistry.register(new Ember());
materialRegistry.register(new Lava());
materialRegistry.register(new Ice());
materialRegistry.register(new Plant());
materialRegistry.register(new Gas());
materialRegistry.register(new BlackHole());

let world: World;
let assignedChunks: { cx: number, cy: number }[] = [];
let workerId = -1;
let _currentActiveChunks: Uint8Array | null = null;
let jitterX = 0;
let jitterY = 0;
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

        // CHUNK SLEEPING: Disabled for now - jitter breaks chunk index mapping
        // The jittered pixel bounds don't align with the chunk state array indices
        // TODO: Fix by using non-jittered chunk indices for sleep check
        // if (currentActiveChunks && cols > 0) {
        //     const chunkIdx = cy * cols + cx;
        //     if (chunkIdx >= 0 && chunkIdx < currentActiveChunks.length) {
        //         if (currentActiveChunks[chunkIdx] === 0) continue;
        //     }
        // }

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

        // Iterate pixels inside the chunk - Bottom-Up
        for (let y = endY - 1; y >= startY; y--) {
            const rowOffset = y * width;
            const leftToRight = (y + world.frameCount) % 2 === 0;

            let x = leftToRight ? startChunkX : endChunkX - 1;
            const finalX = leftToRight ? endChunkX : startChunkX - 1;
            const step = leftToRight ? 1 : -1;

            while (x !== finalX) {
                const id = grid.cells[rowOffset + x];
                if (id !== 0) {
                    const m = materialRegistry.get(id);
                    if (m) {
                        m.update(grid, x, y);
                    }
                }
                x += step;
            }
        }
    }
}
