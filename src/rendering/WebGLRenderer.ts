import { Application, Texture, Sprite, Container, BlurFilter } from 'pixi.js';
import { World } from '../core/World';
import { materialRegistry } from '../materials/MaterialRegistry';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../core/Constants';

export class WebGLRenderer {
    app: Application;
    world: World;

    // Pixel data as Uint32 for faster writes
    private pixelBuffer: ArrayBuffer;
    private pixelData: Uint8ClampedArray;
    private pixelData32: Uint32Array;
    private texture: Texture;
    private sprite: Sprite;

    // Glow layer
    private glowContainer: Container;
    private glowSprite: Sprite;
    private glowBuffer: ArrayBuffer;
    private glowData: Uint8ClampedArray;
    private glowData32: Uint32Array;
    private glowTexture: Texture;

    // Glow material IDs (Fire, Ember, Lava)
    private glowMaterials: Uint8Array = new Uint8Array(256);

    // Pre-computed colors from registry
    private colors!: Uint32Array;

    // Constants
    private readonly BG_COLOR = 0xFF111111; // ABGR
    private readonly BLACK_HOLE_COLOR = 0xFF440022;
    private readonly BLACK_HOLE_GLOW = 0xFFFF0088;
    private readonly BLACK_HOLE_ID = 18;

    private initialized = false;

    constructor(world: World, canvas: HTMLCanvasElement) {
        this.world = world;

        // Create pixel buffers with Uint32 view for fast writes
        const size = WORLD_WIDTH * WORLD_HEIGHT * 4;
        this.pixelBuffer = new ArrayBuffer(size);
        this.pixelData = new Uint8ClampedArray(this.pixelBuffer);
        this.pixelData32 = new Uint32Array(this.pixelBuffer);

        this.glowBuffer = new ArrayBuffer(size);
        this.glowData = new Uint8ClampedArray(this.glowBuffer);
        this.glowData32 = new Uint32Array(this.glowBuffer);

        // Fill with background color using 32-bit writes
        this.pixelData32.fill(this.BG_COLOR);

        // Mark glow materials
        this.glowMaterials[10] = 1; // Fire
        this.glowMaterials[13] = 1; // Ember
        this.glowMaterials[14] = 1; // Lava
        this.glowMaterials[18] = 1; // Black Hole

        // Create PixiJS Application
        this.app = new Application();

        // Placeholder
        this.texture = Texture.EMPTY;
        this.sprite = new Sprite();
        this.glowContainer = new Container();
        this.glowSprite = new Sprite();
        this.glowTexture = Texture.EMPTY;

        this.init(canvas);
    }

    private async init(canvas: HTMLCanvasElement) {
        await this.app.init({
            canvas: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x111111,
            antialias: false,
            resolution: 1,
            autoDensity: false,
            resizeTo: window,
        });

        // Get pre-computed colors from registry
        this.colors = materialRegistry.colors;

        // Create textures
        this.texture = Texture.from({
            resource: this.pixelData,
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
        });

        this.glowTexture = Texture.from({
            resource: this.glowData,
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
        });

        // Main sprite
        this.sprite = new Sprite(this.texture);
        this.sprite.width = window.innerWidth;
        this.sprite.height = window.innerHeight;
        this.app.stage.addChild(this.sprite);

        // Glow layer
        this.glowSprite = new Sprite(this.glowTexture);
        this.glowSprite.width = window.innerWidth;
        this.glowSprite.height = window.innerHeight;
        this.glowSprite.blendMode = 'add';
        this.glowSprite.alpha = 0.6;

        const blurFilter = new BlurFilter({ strength: 8, quality: 2 });
        this.glowContainer.filters = [blurFilter];
        this.glowContainer.addChild(this.glowSprite);
        this.app.stage.addChild(this.glowContainer);

        window.addEventListener('resize', () => {
            this.sprite.width = window.innerWidth;
            this.sprite.height = window.innerHeight;
            this.glowSprite.width = window.innerWidth;
            this.glowSprite.height = window.innerHeight;
        });

        this.initialized = true;
        console.log('WebGL Renderer initialized (optimized)');
    }

    draw() {
        if (!this.initialized) return;

        const cells = this.world.grid.cells;
        const buf = this.pixelData32;
        const glow = this.glowData32;
        const colors = this.colors;
        const glowMats = this.glowMaterials;
        const bgColor = this.BG_COLOR;
        const bhColor = this.BLACK_HOLE_COLOR;
        const bhGlow = this.BLACK_HOLE_GLOW;
        const bhId = this.BLACK_HOLE_ID;
        const len = WORLD_WIDTH * WORLD_HEIGHT;

        // Clear glow buffer
        glow.fill(0);

        // Single pass - optimized hot loop
        for (let i = 0; i < len; i++) {
            const id = cells[i];

            if (id === 0) {
                buf[i] = bgColor;
            } else if (id === bhId) {
                buf[i] = bhColor;
                glow[i] = bhGlow;
            } else {
                buf[i] = colors[id] || bgColor;
                if (glowMats[id]) {
                    glow[i] = colors[id];
                }
            }
        }

        // Update textures
        this.texture.source.update();
        this.glowTexture.source.update();
    }
}
