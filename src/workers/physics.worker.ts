import { World } from '../core/World';
import { Phase } from '../core/Constants';
import { registerAllMaterials } from '../materials/registerAll';
import { processHeatConduction } from './heatConduction';
import { OffGridManager } from './offGridManager';
import { runPhase } from './phaseRunner';
import type { ChunkAssignment } from './types';

registerAllMaterials();

let world: World | null = null;
let assignedChunks: ChunkAssignment[] = [];
let workerId = -1;

let jitterX = 0;
let jitterY = 0;

const offGridManager = new OffGridManager();

type InitMessage = {
    type: 'INIT';
    width: number;
    height: number;
    buffers: {
        grid: SharedArrayBuffer;
        velocity: SharedArrayBuffer;
        temperature: SharedArrayBuffer;
        chunkState: SharedArrayBuffer;
        sleepTimer?: SharedArrayBuffer;
        sync?: SharedArrayBuffer;
    };
    id: number;
    assigned: ChunkAssignment[];
};

type PhaseMessage = {
    type: 'PHASE';
    phase: Phase;
    activeChunks?: Uint8Array;
    jitterX?: number;
    jitterY?: number;
};

self.onmessage = (e) => {
    const data = e.data as InitMessage | PhaseMessage;
    if (data.type === 'INIT') {
        handleInit(data);
    } else if (data.type === 'PHASE') {
        handlePhase(data);
    }
};

function handleInit(data: InitMessage) {
    const { width, height, buffers, id, assigned } = data;
    workerId = id;
    assignedChunks = assigned;
    world = new World(width, height, buffers);
    console.log(`Worker ${id} initialized with ${assignedChunks.length} chunks.`);
}

function handlePhase(data: PhaseMessage) {
    if (!world) return;

    const phase = data.phase as Phase;
    if (data.jitterX !== undefined) jitterX = data.jitterX;
    if (data.jitterY !== undefined) jitterY = data.jitterY;

    // Active chunk gating re-enabled with scan-based wake strategy
    runPhase(world, assignedChunks, phase, jitterX, jitterY, data.activeChunks);

    let particleBuffer: ArrayBuffer | undefined;
    let particleCount = 0;

    if (phase === Phase.RED) {
        processHeatConduction(world, assignedChunks);
        const particles = offGridManager.processFrame(world);
        particleBuffer = particles.buffer;
        particleCount = particles.count;
    }

    if (particleBuffer) {
        self.postMessage(
            { type: 'DONE', workerId, particleBuffer, particleCount },
            { transfer: [particleBuffer] },
        );
    } else {
        self.postMessage({ type: 'DONE', workerId });
    }
}
