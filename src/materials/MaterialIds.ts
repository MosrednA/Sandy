/**
 * Centralized Material ID Constants
 * Use these instead of magic numbers for better readability and maintainability.
 */
export const MaterialId = {
    EMPTY: 0,
    STONE: 1,
    SAND: 2,
    WATER: 3,
    WOOD: 5,
    STEAM: 7,
    ACID: 8,
    OIL: 9,
    FIRE: 10,
    GUNPOWDER: 11,
    SMOKE: 12,
    EMBER: 13,
    LAVA: 14,
    ICE: 15,
    SALT: 17,
    BLACK_HOLE: 18,
    HOT_SMOKE: 19,
    POISON: 20,
    C4: 21,
    MAGMA_ROCK: 22,
    CRYO: 23,
    COAL: 24,
    FIREWORK: 25,
    WALL: 255,  // Boundary
} as const;

export type MaterialIdType = typeof MaterialId[keyof typeof MaterialId];

/**
 * Shared neighbor offset arrays to avoid repetition
 */
export const Neighbors = {
    /** 4-way cardinal directions (up, down, left, right) */
    CARDINAL: [
        { dx: 0, dy: -1 },  // up
        { dx: 0, dy: 1 },   // down
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 },   // right
    ] as const,

    /** 8-way including diagonals */
    ALL: [
        { dx: 0, dy: -1 },  // up
        { dx: 0, dy: 1 },   // down
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 },   // right
        { dx: -1, dy: -1 }, // up-left
        { dx: 1, dy: -1 },  // up-right
        { dx: -1, dy: 1 },  // down-left
        { dx: 1, dy: 1 },   // down-right
    ] as const,
} as const;
