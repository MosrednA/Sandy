import type { World } from '../core/World';
import { materialRegistry } from '../materials/MaterialRegistry';
import { ParticlePool, PX, PY, PVX, PVY, PID, PSTRIDE } from './particlePool';

/**
 * Manages off-grid particles using a pooled TypedArray for zero GC pressure.
 */
export class OffGridManager {
    private pool: ParticlePool;

    constructor() {
        this.pool = new ParticlePool(1024);
    }

    processFrame(world: World): { buffer?: ArrayBuffer; count: number } {
        const grid = world.grid;

        // Ingest queued particles from explosions/fireworks
        const queued = grid.queuedParticles;
        for (let i = 0; i < queued.length; i++) {
            const p = queued[i];
            this.pool.add(p.x, p.y, p.vx, p.vy, p.id, p.color);
        }
        grid.queuedParticles = [];

        const width = grid.width;
        const height = grid.height;
        const data = this.pool.getData();

        // Process particles in reverse order (safe removal via swap)
        for (let i = this.pool.count - 1; i >= 0; i--) {
            const offset = i * PSTRIDE;

            // Read current state
            const x = data[offset + PX];
            const y = data[offset + PY];
            let vx = data[offset + PVX];
            let vy = data[offset + PVY];
            const id = data[offset + PID];

            // Apply physics
            vy += 0.2; // Gravity
            vx *= 0.99; // Drag
            vy *= 0.99;

            const nextX = x + vx;
            const nextY = y + vy;

            // Bounds check
            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
                this.pool.removeAt(i);
                continue;
            }

            const ix = Math.floor(nextX);
            const iy = Math.floor(nextY);

            // Collision check
            const hitId = grid.get(ix, iy);
            const hitMat = hitId !== 0 ? materialRegistry.get(hitId) : null;
            const hitIsGas = hitMat?.isGas ?? false;

            if (hitIsGas) {
                // Swap with gas
                const prevIX = Math.floor(x);
                const prevIY = Math.floor(y);
                if (grid.get(prevIX, prevIY) === 0) {
                    grid.set(prevIX, prevIY, hitId);
                    grid.set(ix, iy, 0);
                }
                // Update position/velocity in pool
                data[offset + PX] = nextX;
                data[offset + PY] = nextY;
                data[offset + PVX] = vx;
                data[offset + PVY] = vy;
            } else if (hitId !== 0 && hitId !== 255) {
                // Hit solid/liquid - reintegrate
                const prevIX = Math.floor(x);
                const prevIY = Math.floor(y);

                if (grid.get(prevIX, prevIY) === 0) {
                    grid.set(prevIX, prevIY, id);
                    grid.setVelocity(prevIX, prevIY, vy);

                    // Splash effect
                    const isLiquid = hitId === 3 || hitId === 8 || hitId === 9 || hitId === 14 || hitId === 20;
                    const speed = Math.sqrt(vx * vx + vy * vy);

                    if (isLiquid && speed > 3) {
                        grid.set(ix, iy, 0);
                        this.pool.add(
                            ix,
                            iy,
                            (Math.random() - 0.5) * 4,
                            -2 - Math.random() * 4,
                            hitId,
                            0
                        );
                    }
                }

                this.pool.removeAt(i);
            } else {
                // Move freely
                data[offset + PX] = nextX;
                data[offset + PY] = nextY;
                data[offset + PVX] = vx;
                data[offset + PVY] = vy;
            }
        }

        // Create transfer buffer
        const result = this.pool.toTransferBuffer();
        if (result) {
            return { buffer: result.buffer, count: result.count };
        }
        return { count: 0 };
    }
}
