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

    // Glow material IDs (Fire, Ember, Lava, Acid)
    private glowMaterials: Uint8Array = new Uint8Array(256);

    // Pre-computed colors with variations
    // Layout: [Mat0_Var0, Mat0_Var1, Mat0_Var2, Mat0_Var3, Mat1_Var0...]
    private colorVariants!: Uint32Array;

    // Per-pixel noise buffer (stores index 0-3)
    private noiseBuffer: Uint8Array;

    // Constants
    private readonly BG_COLOR = 0xFF050505; // Deep black (ABGR)

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

        // Noise buffer for texture variation
        this.noiseBuffer = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
        // Fill noise buffer with random 0..3
        for (let i = 0; i < this.noiseBuffer.length; i++) {
            this.noiseBuffer[i] = Math.floor(Math.random() * 4);
        }

        // Fill with background color using 32-bit writes
        this.pixelData32.fill(this.BG_COLOR);

        // Mark glow materials
        this.glowMaterials[8] = 1;  // Acid
        this.glowMaterials[10] = 1; // Fire
        this.glowMaterials[13] = 1; // Ember
        this.glowMaterials[14] = 1; // Lava
        this.glowMaterials[18] = 1; // Black Hole
        this.glowMaterials[25] = 1; // Firework

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

        // Initialize color variants from registry
        this.initColorVariants(materialRegistry.colors);

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

        const blurFilter = new BlurFilter({ strength: 12, quality: 3 });
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

    // Draw particles
    draw(particles?: any[]) {
        if (!this.initialized) return;

        const cells = this.world.grid.cells;
        const buf = this.pixelData32;
        const glow = this.glowData32;
        const variants = this.colorVariants;
        const noise = this.noiseBuffer;
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
                // Use pre-computed variant based on noise buffer
                // id << 2 multiplies by 4 (to get to the block of variants)
                // noise[i] is 0..3 (offset within block)
                buf[i] = variants[(id << 2) + noise[i]] || bgColor;

                if (glowMats[id]) {
                    glow[i] = variants[(id << 2)]; // Use base color for glow? Or variant? Base is cleaner.
                }
            }
        }

        // Overlay Off-Grid Particles
        if (particles) {
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const x = Math.floor(p.x);
                const y = Math.floor(p.y);

                if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                    const idx = y * WORLD_WIDTH + x;
                    const id = p.id;

                    // Lookup color
                    // We use the base variant (0) or random?
                    // Let's use noise for consistency if we can access it, or just base.
                    // Accessing noise[idx] is fine.
                    const col = variants[(id << 2) + noise[idx]] || 0xFFFFFFFF;
                    buf[idx] = col;

                    // Glow if material glows
                    if (glowMats[id]) {
                        glow[idx] = variants[(id << 2)];
                    }
                }
            }
        }

        // Update textures
        this.texture.source.update();
        this.glowTexture.source.update();
    }

    private initColorVariants(baseColors: Uint32Array) {
        // Create 4 variants for each of the 256 materials
        this.colorVariants = new Uint32Array(256 * 4);

        for (let id = 0; id < 256; id++) {
            const color = baseColors[id];
            if (color === 0) continue; // Skip empty/invalid

            // Extract ABGR components (Little Endian)
            // 0xAABBGGRR
            const r = color & 0xFF;
            const g = (color >> 8) & 0xFF;
            const b = (color >> 16) & 0xFF;
            const a = (color >> 24) & 0xFF;

            // Generate 4 variants
            for (let v = 0; v < 4; v++) {
                // Variation factor: -10 to +10 roughly
                // v=0: Base
                // v=1: Darker
                // v=2: Lighter
                // v=3: Slightly different tone

                let r2 = r, g2 = g, b2 = b;

                if (v === 1) {
                    r2 = Math.max(0, r - 15);
                    g2 = Math.max(0, g - 15);
                    b2 = Math.max(0, b - 15);
                } else if (v === 2) {
                    r2 = Math.min(255, r + 15);
                    g2 = Math.min(255, g + 15);
                    b2 = Math.min(255, b + 15);
                } else if (v === 3) {
                    // Shift tint slightly (e.g. more red/less blue)
                    r2 = Math.min(255, r + 8);
                    b2 = Math.max(0, b - 8);
                }

                // Recombine
                this.colorVariants[(id * 4) + v] = (a << 24) | (b2 << 16) | (g2 << 8) | r2;
            }
        }
    }
}
