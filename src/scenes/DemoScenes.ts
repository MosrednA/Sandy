import { Grid } from '../core/Grid';

export class DemoScenes {

    static drawRect(grid: Grid, x: number, y: number, w: number, h: number, id: number) {
        // Bounds checking helper
        if (x >= grid.width || y >= grid.height) return;
        const wSafe = Math.min(w, grid.width - x);
        const hSafe = Math.min(h, grid.height - y);

        for (let i = x; i < x + wSafe; i++) {
            for (let j = y; j < y + hSafe; j++) {
                grid.set(i, j, id);
            }
        }
    }

    static drawCircle(grid: Grid, cx: number, cy: number, r: number, id: number) {
        for (let i = cx - r; i < cx + r; i++) {
            for (let j = cy - r; j < cy + r; j++) {
                if (i >= 0 && i < grid.width && j >= 0 && j < grid.height) {
                    if ((i - cx) ** 2 + (j - cy) ** 2 <= r ** 2) {
                        grid.set(i, j, id);
                    }
                }
            }
        }
    }

    static clear(grid: Grid) {
        grid.clear();
    }

    static loadRainCycle(grid: Grid) {
        this.clear(grid);
        const w = grid.width;
        const h = grid.height;
        const cx = Math.floor(w / 2);

        // Scaling factors
        const scaleY = Math.max(1, h / 400);

        // 1. The Cloud (Top)
        // Ice block to catch steam - wider relative to screen
        const iceWidth = Math.floor(w * 0.4);
        const iceY = Math.floor(h * 0.1);
        this.drawRect(grid, cx - Math.floor(iceWidth / 2), iceY, iceWidth, Math.max(10, 10 * scaleY), 15); // Ice Plate

        // Stone containment for reservoir
        const resHeight = Math.floor(h * 0.1);
        this.drawRect(grid, cx - Math.floor(iceWidth / 2) - 10, iceY - 10, 10, resHeight, 1);
        this.drawRect(grid, cx + Math.floor(iceWidth / 2), iceY - 10, 10, resHeight, 1);

        // 2. The Mountain (Middle)
        // Spans the whole width
        for (let x = 0; x < w; x++) {
            // Triangle wave shape
            // varied height based on x
            const distFromCenter = Math.abs(x - cx);
            const heightAtX = Math.max(0, (w / 2 - distFromCenter) * 0.6);

            // Draw mountain surface
            const surfaceY = Math.floor(h - (heightAtX * 0.8) - (h * 0.1));

            // Add noise and fill
            if (surfaceY < h) {
                grid.set(x, surfaceY, 1); // Peak
                if (Math.random() < 0.3) grid.set(x, surfaceY - 1, 1);
                // Fill below partially
                for (let k = 1; k < 5; k++) {
                    if (surfaceY + k < h) grid.set(x, surfaceY + k, 1);
                }
            }
        }

        // 3. The Magma Chamber (Bottom)
        const magmaH = Math.floor(h * 0.15);
        this.drawRect(grid, 0, h - magmaH, w, magmaH, 14); // Lava lake

        // 4. Initial Water Rain
        const rainW = Math.floor(iceWidth * 0.5);
        this.drawRect(grid, cx - Math.floor(rainW / 2), iceY + 15, rainW, Math.floor(h * 0.1), 3); // Falling water

        grid.modifyParticleCount(2000);
    }

    static loadRefinery(grid: Grid) {
        this.clear(grid);
        const w = grid.width;
        const h = grid.height;
        const cx = Math.floor(w / 2);

        // Dynamic sizes
        const tankW = Math.floor(w * 0.6);
        const tankH = Math.floor(h * 0.5);
        const tankY = Math.floor(h * 0.4);
        const funnelH = Math.floor(h * 0.2);

        // Main Funnel
        const topY = Math.floor(h * 0.1);
        for (let y = 0; y < funnelH; y++) {
            // grid.set(cx - 20 - y, topY + y, 1);
            // grid.set(cx + 20 + y, topY + y, 1);
            // Make funnel width relative? 
            const spread = Math.floor(20 + y);
            grid.set(cx - spread, topY + y, 1);
            grid.set(cx + spread, topY + y, 1);
        }

        // Sorting Tanks (Cascading)
        const halfTank = Math.floor(tankW / 2);
        this.drawRect(grid, cx - halfTank, tankY, 5, tankH, 1); // Wall L
        this.drawRect(grid, cx + halfTank, tankY, 5, tankH, 1); // Wall R
        this.drawRect(grid, cx - halfTank, tankY + tankH, tankW + 5, 5, 1); // Floor

        // Fill with CHAOS
        const fillAmount = Math.floor(tankW * tankH * 0.25); // 25% full to start
        // Avoid loop overhead if massive
        const maxParticles = 15000;
        const particlesToSpawn = Math.min(fillAmount, maxParticles);

        for (let i = 0; i < particlesToSpawn; i++) {
            const rx = cx - halfTank + 5 + Math.floor(Math.random() * (tankW - 10));
            const ry = tankY + Math.floor(Math.random() * (tankH - 10));
            if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
                const r = Math.random();
                let id = 3; // Water
                if (r < 0.33) id = 9; // Oil
                else if (r > 0.66) id = 20; // Slime
                grid.set(rx, ry, id);
            }
        }

        // Ignition source nearby
        this.drawRect(grid, cx + halfTank + 5, tankY + Math.floor(tankH / 2), 5, 5, 13); // Ember

        grid.modifyParticleCount(particlesToSpawn);
    }

    static loadDoomsday(grid: Grid) {
        this.clear(grid);
        const w = grid.width;
        const h = grid.height;

        // Layout:
        // Left: Fuse + Trigger
        // Middle: Wall
        // Right: Monster Tank
        // Bottom: City

        const fuseX = Math.floor(w * 0.2);
        const wallX = Math.floor(w * 0.45);

        // 1. The Fuse (Hourglass)
        const glassW = Math.max(20, Math.floor(w * 0.05));
        const glassH = Math.max(40, Math.floor(h * 0.15));
        const glassY = Math.floor(h * 0.1);

        this.drawRect(grid, fuseX, glassY, glassW, glassH, 1); // Glass walls
        this.drawRect(grid, fuseX + 2, glassY + 2, glassW - 4, Math.floor(glassH * 0.5), 2); // Sand Timer (Top half full)
        this.drawRect(grid, fuseX, glassY + glassH, glassW, 5, 1); // Floor with hole

        const holeX = fuseX + Math.floor(glassW / 2);
        grid.set(holeX, glassY + glassH, 0); // Hole
        grid.set(holeX, glassY + glassH + 1, 0);

        // 2. The Trigger
        const triggerY = Math.floor(h * 0.6);
        this.drawRect(grid, fuseX, triggerY, glassW, 5, 5); // Wood plank catch
        // Gunpowder Trail leading right to the wall
        if (wallX > fuseX) {
            this.drawRect(grid, fuseX, triggerY + 5, (wallX - fuseX) + 5, 5, 11);
        }

        // 3. The Payload (Containment Wall)
        const wallY = Math.floor(h * 0.2);
        const wallH = Math.floor(h * 0.7);
        this.drawRect(grid, wallX, wallY, 10, wallH, 5); // Wood Wall (Weak)

        // 4. The Monster (Behind the wall)
        const tankStart = wallX + 11;
        const tankWidth = Math.min(w - tankStart - 10, 300); // Max 300px wide
        const tankHeight = Math.floor(h * 0.4);
        const tankY = Math.floor(h * 0.3);

        if (tankWidth > 0) {
            for (let x = tankStart; x < tankStart + tankWidth; x++) {
                for (let y = tankY; y < tankY + tankHeight; y++) {
                    if (Math.random() < 0.8) {
                        const r = Math.random();
                        grid.set(x, y, r < 0.5 ? 20 : (r < 0.8 ? 8 : 14));
                    }
                }
            }
        }

        // 5. The City (Below)
        const cityY = h - 10;
        const housesStart = Math.max(0, wallX - 50); // Start a bit before the wall
        const houseW = 20;
        const houseGap = 30;
        const houseCount = Math.floor((w - housesStart) / houseGap);

        for (let i = 0; i < houseCount; i++) {
            const hx = housesStart + i * houseGap;
            if (hx + houseW >= w) break;
            this.drawRect(grid, hx, cityY - 20, houseW, 20, 5); // House
            this.drawRect(grid, hx + 8, cityY - 20, 4, 10, 0); // Door
        }

        // 6. Ignition for the fuse
        this.drawRect(grid, fuseX + Math.floor(glassW / 2) - 2, glassY - 2, 4, 2, 10); // Fire on top

        grid.modifyParticleCount(5000);
    }
}
