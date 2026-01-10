<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/PixiJS-E91E63?style=for-the-badge&logo=webgl&logoColor=white" alt="PixiJS"/>
  <img src="https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL"/>
  <img src="https://img.shields.io/badge/Web%20Workers-FF6600?style=for-the-badge&logo=javascript&logoColor=white" alt="Web Workers"/>
</p>

# 🏜️ Sandy

A **blazing-fast falling sand simulation** with GPU rendering, multi-threaded physics, and beautiful glow effects. Inspired by classics like *Powder Game* and *Noita*.

![Falling Sand Demo](https://raw.githubusercontent.com/MosrednA/Sandy/main/public/demo.gif)

> **Version**: 0.1.0 (Alpha)  
> **Last Updated**: 2026-01-10  
> **Status**: Active Development

---

## ✨ Features

### 🧱 Materials
- **Solids**: Sand, Stone, Wood, Ice, Magma Rock, Glass.
- **Liquids**: Water, Oil, Acid, Lava, Slime, Mercury.
- **Gases**: Steam, Smoke, Gas (explosive!), Cryo (freezing), Dust (explosive!).
- **Energetics**: Fire, Gunpowder, C4 (plastic explosive), Coal, Firework.
- **Special**: Black Hole (attracts and consumes particles), Plasma (ultra-hot ionized gas).
- **Tools**: Erase, Brush size, Override toggle.

### 🌡️ Thermodynamics System (New!)
- **Heat Conduction**: Heat spreads across materials naturally.
- **Phase Changes**:
  - Ice melts > 0°
  - Water boils > 100° (Temperature preserved!)
  - Steam condenses < 100°
  - Lava cools to Magma Rock (Thermal Inertia simulated)
- **Auto-Ignition**: Wood, Oil, Coal, and Gunpowder ignite automatically at specific temperatures.

### ⚡ Interactions
- 🔥 Fire spreads to wood, ignites oil, gas, coal, land slime
- 💧 Water extinguishes fire, creates steam near lava
- 🧪 Acid dissolves materials, melts ice fast, reacts with lava
- 🧊 Ice freezes water, melts near heat sources
- 🌋 Lava melts ice, boils water, and cools into sinking Magma Rock
- ❄️ Cryo freezes water & steam, extinguishes fire, cools lava
- 🪵 Burning wood creates charcoal (Coal) that can be re-ignited
- 🎆 Fireworks launch upward and explode into sparks
- 💥 C4 creates massive explosions with shockwaves
- ⚫ Black Holes pull in and consume nearby particles!
- 🌫️ **Leidenfrost Effect**: Heavy liquids (Lava) displace gases (Steam) to prevent unnatural floating.

### 🚀 Performance Optimizations
| Optimization            | Description                     |
| ----------------------- | ------------------------------- |
| **WebGL Rendering**     | GPU-accelerated via PixiJS      |
| **Uint32 Pixel Writes** | 4x fewer memory operations      |
| **Pre-computed Colors** | Zero runtime color conversion   |
| **Web Workers**         | Physics runs off main thread    |
| **Shared Memory**       | Atomic particle counting        |
| **Save System V2**      | Persistence of Temp & Velocity  |
| **Glow Effects**        | Additive blending for fire/lava |

### 🎨 Visual Enhancements (Noita-Inspired)
| Feature                   | Description                           |
| ------------------------- | ------------------------------------- |
| **Per-Pixel Color Noise** | Organic texture variation             |
| **Enhanced Glow**         | Bloom effects for emissive materials  |
| **Hot Smoke Transition**  | Fire → Hot Smoke → Smoke gradient     |
| **Atmospheric Depth**     | Vignette and dark background          |
| **Rich Color Palettes**   | Saturated, hand-tuned material colors |

---

## 🎮 Controls

| Action            | Input                    |
| ----------------- | ------------------------ |
| **Draw**          | Left Mouse (hold & drag) |
| **Erase**         | Right Mouse              |
| **Brush Size**    | Slider in UI             |
| **Clear Canvas**  | Clear button             |
| **Override Mode** | Toggle on/off            |

---

## 🛠️ Getting Started

```bash
# Clone
git clone https://github.com/MosrednA/Sandy.git
cd Sandy

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
Sandy/
├── src/
│   ├── core/           # World, Grid, SharedMemory, Constants, Serializer
│   ├── materials/      # 24 materials: Sand, Water, Fire, BlackHole, Plasma, etc.
│   ├── rendering/      # WebGLRenderer (PixiJS), BlackHoleFilter shader
│   ├── input/          # Line-interpolated drawing with brush support
│   ├── ui/             # SaveLoadUI for world persistence
│   ├── workers/        # Physics worker (multi-threaded SharedArrayBuffer)
│   └── main.ts         # Entry point, UI setup
├── server/             # Express server for save/load API
│   └── worlds/         # Saved world files (.sand)
├── public/             # Static assets
└── index.html
```

---

## 🏗️ Architecture

### Core Systems
| System | Description |
|--------|-------------|
| **Grid** | 2D cellular automata with chunk-based sleeping optimization |
| **World** | Physics coordinator, iterates materials bottom-up |
| **WorkerManager** | Distributes chunks across Web Workers with SharedArrayBuffer |
| **SharedMemory** | Lock-free atomic operations for particle counting |

### Rendering Pipeline
1. **Main Thread**: Reads grid state from SharedArrayBuffer
2. **WebGLRenderer**: Writes to ImageData using Uint32Array for 4x faster pixels
3. **PixiJS**: GPU compositing with blur filters for glow effects
4. **BlackHoleFilter**: Custom WebGL shader for gravitational distortion

### Physics Model
- **Chunk Sleeping**: Only active chunks are processed (huge perf win)
- **Phase-Based Updates**: 4-phase checkerboard to prevent race conditions
- **Jitter**: Random offset each frame prevents directional bias
- **Heat Conduction**: Per-material conductivity with phase transitions

---

## 🧩 Adding New Materials

See the [`/add-material`](.agent/workflows/add-material.md) workflow for detailed steps.

---

## 🧪 Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📄 License

MIT © 2024

---

<p align="center">
  Made with 🏖️ and TypeScript
</p>
