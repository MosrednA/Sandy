export const CHUNK_SIZE = 64; // Logic chunk size (increased for worker overhead reduction)
export const GRAVITY = 0.35; // Was 0.5 - reduced for lighter feel

// Dimensions
// Dimensions
export const WORLD_WIDTH = 1024; // 16 chunks * 64
export const WORLD_HEIGHT = 768; // 12 chunks * 64

export const Phase = {
    RED: 0,
    BLUE: 1,
    GREEN: 2,
    YELLOW: 3,
} as const;

export type Phase = typeof Phase[keyof typeof Phase];

// 400 / 64 = 6.25 chunks... having non-integer chunks is annoying for checkerboard.
// Let's adjust world size to be multiple of 64 or handle boundaries carefully.
// 64 * 7 = 448
// 64 * 5 = 320
// Let's force WORLD_WIDTH/HEIGHT to be aligned or grid will just ceil it.
// ... (existing comments)
// Grid uses ceil, so it's fine.

export interface OffGridParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    id: number;
    color: number;
}

