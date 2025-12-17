import { Filter, GlProgram } from 'pixi.js';

// Black Hole distortion shader
// Creates visual "suction" effect without CPU cost

const vertex = `
    in vec2 aPosition;
    out vec2 vTextureCoord;
    
    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;
    
    vec4 filterVertexPosition(void) {
        vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
        position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
        position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
        return vec4(position, 0.0, 1.0);
    }
    
    vec2 filterTextureCoord(void) {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
    }
    
    void main(void) {
        gl_Position = filterVertexPosition();
        vTextureCoord = filterTextureCoord();
    }
`;

const fragment = `
    in vec2 vTextureCoord;
    out vec4 finalColor;
    
    uniform sampler2D uTexture;
    uniform vec2 uBlackHoles[8];
    uniform int uBlackHoleCount;
    uniform float uTime;
    uniform vec2 uResolution;
    
    void main(void) {
        vec2 uv = vTextureCoord;
        vec2 coord = uv * uResolution;
        
        // Apply distortion from each black hole
        for (int i = 0; i < 8; i++) {
            if (i >= uBlackHoleCount) break;
            
            vec2 holePos = uBlackHoles[i];
            vec2 diff = coord - holePos;
            float dist = length(diff);
            
            float radius = 120.0;
            float strength = 30.0;
            
            if (dist < radius && dist > 5.0) {
                // Pull effect - distort UV toward black hole
                float pull = (1.0 - dist / radius) * strength / dist;
                uv -= (diff / uResolution) * pull;
                
                // Add swirl
                float angle = pull * 0.1 * sin(uTime * 2.0);
                float s = sin(angle);
                float c = cos(angle);
                vec2 centered = uv - holePos / uResolution;
                uv = vec2(
                    centered.x * c - centered.y * s,
                    centered.x * s + centered.y * c
                ) + holePos / uResolution;
            }
        }
        
        // Clamp UV to prevent sampling outside texture
        uv = clamp(uv, 0.0, 1.0);
        
        finalColor = texture(uTexture, uv);
    }
`;

export class BlackHoleFilter extends Filter {
    private _blackHoles: Float32Array;
    private _time: number = 0;

    constructor(width: number, height: number) {
        const glProgram = GlProgram.from({
            vertex,
            fragment,
            name: 'black-hole-filter',
        });

        super({
            glProgram,
            resources: {
                blackHoleUniforms: {
                    uBlackHoles: { value: new Float32Array(16), type: 'vec2<f32>', size: 8 },
                    uBlackHoleCount: { value: 0, type: 'i32' },
                    uTime: { value: 0, type: 'f32' },
                    uResolution: { value: new Float32Array([width, height]), type: 'vec2<f32>' },
                },
            },
        });

        this._blackHoles = new Float32Array(16);
    }

    update(blackHolePositions: { x: number, y: number }[], deltaTime: number) {
        this._time += deltaTime * 0.001;

        const count = Math.min(blackHolePositions.length, 8);

        for (let i = 0; i < count; i++) {
            this._blackHoles[i * 2] = blackHolePositions[i].x;
            this._blackHoles[i * 2 + 1] = blackHolePositions[i].y;
        }

        this.resources.blackHoleUniforms.uniforms.uBlackHoles = this._blackHoles;
        this.resources.blackHoleUniforms.uniforms.uBlackHoleCount = count;
        this.resources.blackHoleUniforms.uniforms.uTime = this._time;
    }
}
