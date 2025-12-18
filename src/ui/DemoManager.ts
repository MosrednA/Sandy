import { World } from '../core/World';
import { DemoScenes } from '../scenes/DemoScenes';

export class DemoManager {
    container: HTMLDivElement;
    world: World;

    constructor(world: World) {
        this.world = world;
        this.container = document.createElement('div');
        this.container.id = 'demo-overlay';
        this.container.style.display = 'none';
        this.container.innerHTML = `
            <div class="save-load-modal" style="width: 400px;">
                <h2>Demo Worlds</h2>
                <div class="sl-section">
                    <p>Select a scenario to showcase the physics engine.</p>
                    <div class="demo-list">
                        <button class="demo-btn" id="demo-rain">
                            <strong>🌧️ The Infinite Rain</strong>
                            <span>Thermodynamics: Heat turns Water to Steam, Ice turns Steam to Water.</span>
                        </button>
                        <button class="demo-btn" id="demo-refinery">
                            <strong>🏭 The Refinery</strong>
                            <span>Chaos Sorting: Watch Oil, Slime, and Water separate by density.</span>
                        </button>
                        <button class="demo-btn" id="demo-doomsday">
                            <strong>⏳ Doomsday Clock</strong>
                            <span>Rube Goldberg: A fuse, a wall, and a city about to be destroyed.</span>
                        </button>
                    </div>
                </div>
                <div class="sl-footer">
                   <button id="close-demo-btn">Close</button>
                </div>
            </div>
        `;

        // Add some styles specifically for demos
        const style = document.createElement('style');
        style.textContent = `
            .demo-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }
            .demo-btn {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                color: #eee;
                transition: all 0.2s;
                text-align: left;
            }
            .demo-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateX(4px);
            }
            .demo-btn strong {
                font-size: 1.1em;
                margin-bottom: 4px;
                color: #4488FF;
            }
            .demo-btn span {
                font-size: 0.85em;
                color: #aaa;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.container);

        this.setupEvents();
    }

    setupEvents() {
        document.getElementById('close-demo-btn')?.addEventListener('click', () => {
            this.hide();
        });

        document.getElementById('demo-rain')?.addEventListener('click', () => {
            DemoScenes.loadRainCycle(this.world.grid);
            this.hide();
        });

        document.getElementById('demo-refinery')?.addEventListener('click', () => {
            DemoScenes.loadRefinery(this.world.grid);
            this.hide();
        });

        document.getElementById('demo-doomsday')?.addEventListener('click', () => {
            DemoScenes.loadDoomsday(this.world.grid);
            this.hide();
        });
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}
