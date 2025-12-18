import './style.css';
import { World } from './core/World';
import { WebGLRenderer } from './rendering/WebGLRenderer';
import { InputHandler } from './input/InputHandler';
import { SaveLoadUI } from './ui/SaveLoadUI';
import { registerAllMaterials } from './materials/registerAll';

// 1. Register Materials (centralized to prevent worker sync issues)
registerAllMaterials();

// 2. Setup Canvas
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game-container">
    <canvas id="sand-canvas"></canvas>
    <div id="stats">
        <div id="fps-counter">0 FPS</div>
        <div id="particle-counter">0 Particles</div>
    </div>
    <div class="ui-panel">
        <h1>Materials</h1>
        <div class="controls">
            <div class="category">
                <span class="category-label">Solids</span>
                <div class="material-group">
                    <button class="mat-btn active" data-id="2" data-name="Sand" data-tip="Falls and piles up. Sinks in water." style="--btn-color: #FEDC97"></button>
                    <button class="mat-btn" data-id="1" data-name="Stone" data-tip="Indestructible solid block." style="--btn-color: #888888"></button>
                    <button class="mat-btn" data-id="5" data-name="Wood" data-tip="Solid. Burns when touched by fire." style="--btn-color: #8B4513"></button>
                    <button class="mat-btn" data-id="15" data-name="Ice" data-tip="Freezes water. Melts near fire." style="--btn-color: #AADDFF"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Liquids</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="3" data-name="Water" data-tip="Flows and spreads. Extinguishes fire." style="--btn-color: #4488FF"></button>
                    <button class="mat-btn" data-id="8" data-name="Acid" data-tip="Dissolves sand, stone and wood!" style="--btn-color: #66FF33"></button>
                    <button class="mat-btn" data-id="9" data-name="Oil" data-tip="Floats on water. Very flammable!" style="--btn-color: #331100"></button>
                    <button class="mat-btn" data-id="14" data-name="Lava" data-tip="Burns everything. Stone + steam with water." style="--btn-color: #FF2200"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Gases</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="7" data-name="Steam" data-tip="Rises slowly. Turns back to water." style="--btn-color: #DDEEFF"></button>
                    <button class="mat-btn" data-id="17" data-name="Gas" data-tip="Rises and spreads. EXPLODES with fire!" style="--btn-color: #FFFF88"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Fire</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="10" data-name="Fire" data-tip="Spreads to flammables. Creates smoke." style="--btn-color: #FF4400"></button>
                    <button class="mat-btn" data-id="11" data-name="Powder" data-tip="Gunpowder! Explodes when ignited." style="--btn-color: #444444"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Special</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="18" data-name="Black Hole" data-tip="Attracts and consumes particles!" style="--btn-color: #220033"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Tools</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="0" data-name="Erase" data-tip="Delete particles." style="--btn-color: #222222"></button>
                </div>
            </div>
            <div class="slider-group">
                <label>Size</label>
                <input type="range" id="brush-size" min="1" max="15" value="3">
            </div>
            <div class="action-group">
                <button id="clear-btn" class="action-btn">Clear</button>
                <button id="open-sl-btn" class="action-btn" style="background: rgba(68, 136, 255, 0.2); color: #88bbff;">Save/Load</button>
                <label class="toggle-label">
                    <input type="checkbox" id="override-toggle" checked>
                    <span>Override</span>
                </label>
            </div>
            <div id="info-panel" class="info-panel">
                <span class="info-name">Sand</span>
                <span class="info-desc">Falls and piles up. Sinks in water.</span>
            </div>
        </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#sand-canvas')!;
// Init with window size
// Note: Changing canvas size requires re-creating Grid or complex logic.
// For simplicity in this demo, we'll set it to window size on load.
// Dynamic resize support would require recreating World/Grid on resize event.
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 3. Initialize Core Systems
// We need to allow World to take variable size in constructor if not checking constants
// But accessing Grid relies on it. World constructor handles new Grid(W,H).
// We imported Constants but we can ignore them if we pass args.
// Let's modify World to accept W/H or just create a new one.
// Actually, Grid expects W/H. World constructor needs to pass them.
// I need to check World.ts if it accepts args.
// It didn't. I'll pass them in anyway and then fix World.ts if needed, 
// or I'll just rely on Constants for now? No, user wants Fullscreen.
// I MUST update World.ts logic to accept dynamic size.

// Let's assume I will update World.ts next.
// const world = new World(canvas.width, canvas.height); 

// TEMPORARY: using Constants for logic to avoid breaking everything immediately,
// BUT scaling visual canvas to full screen.
// This results in "stretched" pixels if aspect ratio differs, or pixelated look.
// Better: Update constants or World to match window.
// Since Constants are exported... adjusting them is hard.
// I will change Main to just use the Constants for logical resolution, 
// but CSS scales it to fullscreen?
// User said "Make the app fullscreen". 
// Option A: Logic resolution = Screen resolution (1:1 pixels). Best quality.
// Option B: Logic resolution = Fixed (e.g. 400x300), Scaled to fit.
// Given "Sand" simulation, 1:1 is best but performance heavy on 4K.
// detailed "large canvas" request earlier means we should probably go big.
// I'll stick to scaling for now to ensure performance unless instructed otherwise.
// Wait, "simulating a large canvas" was the request.
// So I should try to make logical resolution match window.

// UPDATE: I will need to update World.ts to accept dimensions.
// For now, I will write the Main.ts assuming World accepts (width, height).

// 3. Initialize Core Systems
// We'll update World to take args.
// But first, let's just make it work with the current fixed size but stretched to fill screen?
// No, that looks bad.
// I will try to make the canvas match window size, but maybe downscale by 2 for performance?
// scale = 1 means 1:1 pixels.
// 3. Initialize Core Systems with Parallel Compute
import { SharedMemory } from './core/SharedMemory';
import { WorkerManager } from './core/WorkerManager';
import { WORLD_WIDTH, WORLD_HEIGHT } from './core/Constants';

const scale = 1;
canvas.width = Math.ceil(window.innerWidth / scale);
canvas.height = Math.ceil(window.innerHeight / scale);

// Align canvas size to Constants if we want mapping to be exact, 
// OR we just use the Constants for the internal buffer size and stretch it?
// The previous logic tried to adapt. But WorkerManager uses Constants.
// Let's enforce the Canvas rendering to view the internal Grid (World Size).
// Or we map the dynamic canvas to the fixed world.
// For now, let's use the Constants.WORLD_WIDTH/HEIGHT for the simulation.
// And scale the canvas via CSS or rendering context?
// Renderer uses `this.imageData = ctx.createImageData(world.grid.width, world.grid.height);`
// So the imageData is sized to the Grid.
// We should set the canvas to match the Grid size, then use CSS to scale it up.

canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const sharedMemory = new SharedMemory();
const workerManager = new WorkerManager(sharedMemory);

// Main Thread World (Read-Only basically, or for Input)
const world = new World(WORLD_WIDTH, WORLD_HEIGHT, {
  grid: sharedMemory.gridBuffer,
  velocity: sharedMemory.velocityBuffer,
  chunkState: sharedMemory.chunkStateBuffer,
  sync: sharedMemory.syncBuffer
});

const renderer = new WebGLRenderer(world, canvas);
const input = new InputHandler(world, canvas);

// 4. UI Logic
const buttons = document.querySelectorAll('.mat-btn');
const infoName = document.querySelector<HTMLSpanElement>('.info-name')!;
const infoDesc = document.querySelector<HTMLSpanElement>('.info-desc')!;

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const id = parseInt(btn.getAttribute('data-id') || '2');
    input.selectedMaterialId = id;

    // Update info panel on click too
    const name = btn.getAttribute('data-name') || '';
    const tip = btn.getAttribute('data-tip') || '';
    infoName.textContent = name;
    infoDesc.textContent = tip;
  });

  // Update info panel on hover
  btn.addEventListener('mouseenter', () => {
    const name = btn.getAttribute('data-name') || '';
    const tip = btn.getAttribute('data-tip') || '';
    infoName.textContent = name;
    infoDesc.textContent = tip;
  });
});

const brushSlider = document.querySelector<HTMLInputElement>('#brush-size')!;
brushSlider.addEventListener('input', (e: Event) => {
  const target = e.target as HTMLInputElement;
  input.brushSize = parseInt(target.value);
});

// Clear button
const clearBtn = document.getElementById('clear-btn')!;
clearBtn.addEventListener('click', () => {
  input.clearCanvas();
});

const saveLoadUI = new SaveLoadUI(world);
const openSlBtn = document.getElementById('open-sl-btn')!;
openSlBtn.addEventListener('click', () => {
  saveLoadUI.show();
});

// Override toggle
const overrideToggle = document.querySelector<HTMLInputElement>('#override-toggle')!;
overrideToggle.addEventListener('change', () => {
  input.overrideMode = overrideToggle.checked;
});

// UI Logic
const fpsEl = document.getElementById('fps-counter')!;
const pEl = document.getElementById('particle-counter')!;

let lastTime = performance.now();
let frames = 0;
let lastFpsTime = lastTime;

// 5. Game Loop
async function loop() {
  const now = performance.now();
  frames++;

  if (now - lastFpsTime >= 1000) {
    fpsEl.innerText = `${frames} FPS`;
    pEl.innerText = `${sharedMemory.getParticleCount().toLocaleString()} Particles`;

    frames = 0;
    lastFpsTime = now;
  }

  // Orchestrate Physics
  await workerManager.update();

  // Draw result
  renderer.draw();

  requestAnimationFrame(loop);
}

// Handle Resize (Reload for simplicity as logic grid needs recreation)
window.addEventListener('resize', () => {
  // Debounce or just reload
  // location.reload();
  // With fixed world size, we don't need to reload! Just CSS handles it.
});

loop();
