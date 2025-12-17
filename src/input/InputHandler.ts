import { World } from '../core/World';

export class InputHandler {
    world: World;
    canvas: HTMLCanvasElement;
    isDrawing: boolean = false;
    selectedMaterialId: number = 2; // Default Sand
    brushSize: number = 3;
    overrideMode: boolean = true; // When true, draw over existing materials

    // Track last position for line interpolation
    private lastX: number = -1;
    private lastY: number = -1;

    constructor(world: World, canvas: HTMLCanvasElement) {
        this.world = world;
        this.canvas = canvas;

        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        window.addEventListener('mouseup', () => this.handleEnd());

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private getGridPos(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        // Logical Size / Visual Size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        return { x, y };
    }

    private handleStart(e: MouseEvent) {
        this.isDrawing = true;
        const { x, y } = this.getGridPos(e);
        this.lastX = x;
        this.lastY = y;
        this.paintAt(x, y, e.buttons === 2 ? 0 : this.selectedMaterialId);
    }

    private handleMove(e: MouseEvent) {
        if (!this.isDrawing) return;

        const { x, y } = this.getGridPos(e);
        const id = e.buttons === 2 ? 0 : this.selectedMaterialId;

        // Interpolate between last position and current position
        if (this.lastX >= 0 && this.lastY >= 0) {
            this.drawLine(this.lastX, this.lastY, x, y, id);
        } else {
            this.paintAt(x, y, id);
        }

        this.lastX = x;
        this.lastY = y;
    }

    private handleEnd() {
        this.isDrawing = false;
        this.lastX = -1;
        this.lastY = -1;
    }

    private drawLine(x0: number, y0: number, x1: number, y1: number, id: number) {
        // Bresenham's line algorithm
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            this.paintAt(x, y, id);

            if (x === x1 && y === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    private paintAt(x: number, y: number, id: number) {
        const r = this.brushSize;
        const isErasing = id === 0;

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    // Random spray effect
                    if (Math.random() > 0.2) {
                        const tx = x + dx;
                        const ty = y + dy;

                        // Override mode check
                        if (!isErasing && !this.overrideMode) {
                            // Only draw on empty cells
                            const existing = this.world.grid.get(tx, ty);
                            if (existing !== 0) continue;
                        }

                        this.world.grid.set(tx, ty, id);
                    }
                }
            }
        }
    }

    clearCanvas() {
        this.world.grid.cells.fill(0);
        this.world.grid.velocity.fill(0);
        this.world.grid.chunks.fill(1); // Wake all chunks
    }
}
