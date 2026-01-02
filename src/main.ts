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
                    <button class="mat-btn" data-id="22" data-name="Magma" data-tip="Cooled lava. Remelts when heated." style="--btn-color: #442222"></button>
                    <button class="mat-btn" data-id="27" data-name="Glass" data-tip="Transparent solid. Melts at extreme heat." style="--btn-color: #88CCFF"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Liquids</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="3" data-name="Water" data-tip="Flows and spreads. Extinguishes fire." style="--btn-color: #4488FF"></button>
                    <button class="mat-btn" data-id="8" data-name="Acid" data-tip="Dissolves sand, stone and wood!" style="--btn-color: #CCFF33"></button>
                    <button class="mat-btn" data-id="9" data-name="Oil" data-tip="Floats on water. Very flammable!" style="--btn-color: #331100"></button>
                    <button class="mat-btn" data-id="14" data-name="Lava" data-tip="Burns everything. Stone + steam with water." style="--btn-color: #FF2200"></button>
                    <button class="mat-btn" data-id="20" data-name="Slime" data-tip="Radioactive! Mutates water to acid, burns wood." style="--btn-color: #00EE22"></button>
                    <button class="mat-btn" data-id="26" data-name="Mercury" data-tip="Super-heavy liquid metal. Sinks below everything." style="--btn-color: #C0C0C0"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Gases</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="7" data-name="Steam" data-tip="Rises slowly. Turns back to water." style="--btn-color: #DDEEFF"></button>
                    <button class="mat-btn" data-id="17" data-name="Gas" data-tip="Rises and spreads. EXPLODES with fire!" style="--btn-color: #FFFF88"></button>
                    <button class="mat-btn" data-id="23" data-name="Cryo" data-tip="Freezing gas. Freezes water, extinguishes fire." style="--btn-color: #88FFFF"></button>
                    <button class="mat-btn" data-id="28" data-name="Dust" data-tip="Floats in air. HIGHLY EXPLOSIVE with fire!" style="--btn-color: #AA9977"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Fire</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="10" data-name="Fire" data-tip="Spreads to flammables. Creates smoke." style="--btn-color: #FF4400"></button>
                    <button class="mat-btn" data-id="11" data-name="Powder" data-tip="Gunpowder! Explodes when ignited." style="--btn-color: #444444"></button>
                    <button class="mat-btn" data-id="21" data-name="C4" data-tip="Plastic explosive. Sticks to walls. BIG BOOM." style="--btn-color: #DDDDDD"></button>
                    <button class="mat-btn" data-id="24" data-name="Coal" data-tip="Burns slowly. Long-lasting fire source." style="--btn-color: #333333"></button>
                    <button class="mat-btn" data-id="25" data-name="Firework" data-tip="Launches up and explodes into sparks!" style="--btn-color: #FF00FF"></button>
                </div>
            </div>
            <div class="category">
                <span class="category-label">Special</span>
                <div class="material-group">
                    <button class="mat-btn" data-id="18" data-name="Black Hole" data-tip="Attracts and consumes particles!" style="--btn-color: #220033"></button>
                    <button class="mat-btn" data-id="29" data-name="Plasma" data-tip="Ultra-hot ionized gas. Vaporizes everything!" style="--btn-color: #FF44FF"></button>
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
                <button id="debug-btn" class="action-btn" style="background: rgba(255, 100, 100, 0.2); color: #ff8888;">Debug</button>
                <button id="heatmap-btn" class="action-btn" style="background: rgba(255, 165, 0, 0.2); color: #ffaa44;">Heatmap</button>
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

// 3. Initialize Core Systems with Parallel Compute
import { SharedMemory } from './core/SharedMemory';
import { WorkerManager } from './core/WorkerManager';
import { WORLD_WIDTH, WORLD_HEIGHT } from './core/Constants';

// Set canvas to match simulation grid size (CSS scales it to fullscreen)
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const sharedMemory = new SharedMemory();
const workerManager = new WorkerManager(sharedMemory);

// Main Thread World (Read-Only basically, or for Input)
const world = new World(WORLD_WIDTH, WORLD_HEIGHT, {
  grid: sharedMemory.gridBuffer,
  velocity: sharedMemory.velocityBuffer,
  temperature: sharedMemory.temperatureBuffer,
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



// Debug buttons
const debugBtn = document.getElementById('debug-btn')!;
let debugEnabled = false;
debugBtn.addEventListener('click', () => {
  debugEnabled = !debugEnabled;
  renderer.toggleDebug(debugEnabled);
  debugBtn.style.background = debugEnabled ? 'rgba(255, 100, 100, 0.6)' : 'rgba(255, 100, 100, 0.2)';
});

const heatmapBtn = document.getElementById('heatmap-btn')!;
let heatmapEnabled = false;
heatmapBtn.addEventListener('click', () => {
  heatmapEnabled = !heatmapEnabled;
  renderer.toggleHeatmap(heatmapEnabled);
  heatmapBtn.style.background = heatmapEnabled ? 'rgba(255, 165, 0, 0.6)' : 'rgba(255, 165, 0, 0.2)';
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

// 5. Game Loop - Capped at 60 FPS for consistent physics
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;

async function loop(timestamp: number = 0) {
  // FPS Cap: Skip frame if not enough time has passed
  const elapsed = timestamp - lastFrameTime;
  if (elapsed < FRAME_TIME) {
    requestAnimationFrame(loop);
    return;
  }
  lastFrameTime = timestamp - (elapsed % FRAME_TIME); // Maintain timing accuracy

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
  renderer.draw(workerManager.activeParticles);

  requestAnimationFrame(loop);
}

// Handle Resize (Reload for simplicity as logic grid needs recreation)
window.addEventListener('resize', () => {
  // Debounce or just reload
  // location.reload();
  // With fixed world size, we don't need to reload! Just CSS handles it.
});

loop();
