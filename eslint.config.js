import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                // Browser globals
                console: 'readonly',
                window: 'readonly',
                document: 'readonly',
                requestAnimationFrame: 'readonly',
                performance: 'readonly',
                location: 'readonly',
                fetch: 'readonly',
                Response: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                Image: 'readonly',
                // DOM elements
                HTMLElement: 'readonly',
                HTMLDivElement: 'readonly',
                HTMLCanvasElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLSpanElement: 'readonly',
                HTMLButtonElement: 'readonly',
                CanvasRenderingContext2D: 'readonly',
                WebGLRenderingContext: 'readonly',
                WebGL2RenderingContext: 'readonly',
                ImageData: 'readonly',
                // Events
                Event: 'readonly',
                MouseEvent: 'readonly',
                KeyboardEvent: 'readonly',
                PointerEvent: 'readonly',
                // Typed arrays and buffers
                SharedArrayBuffer: 'readonly',
                Atomics: 'readonly',
                ArrayBuffer: 'readonly',
                Uint8Array: 'readonly',
                Uint16Array: 'readonly',
                Uint32Array: 'readonly',
                Float32Array: 'readonly',
                Int32Array: 'readonly',
                DataView: 'readonly',
                // Worker globals
                self: 'readonly',
                postMessage: 'readonly',
                onmessage: 'writable',
                importScripts: 'readonly',
                // Browser APIs
                crossOriginIsolated: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                Math: 'readonly',
                Worker: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                navigator: 'readonly',
                MessageEvent: 'readonly',
                File: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            // TypeScript specific
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',

            // General code quality
            'no-console': 'off', // Allow console for debugging
            'prefer-const': 'warn',
            'no-var': 'error',

            // Allow performance-oriented patterns
            'no-bitwise': 'off', // We use bitwise ops for performance
            'no-unused-vars': 'off', // Handled by TypeScript
            'no-redeclare': 'off', // Handled by TypeScript (e.g., type + const with same name)
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'server/**'],
    },
];
