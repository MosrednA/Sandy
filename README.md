<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/PixiJS-E91E63?style=for-the-badge&logo=webgl&logoColor=white" alt="PixiJS"/>
  <img src="https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white" alt="WebGL"/>
</p>

# 🏜️ Sandy

A **blazing-fast falling sand simulation** with GPU rendering, multi-threaded physics, and beautiful glow effects.

![Falling Sand Demo](https://raw.githubusercontent.com/MosrednA/Sandy/main/public/demo.gif)

---

## ✨ Features

### 🧱 Materials
- **Solids**: Sand, Stone, Wood, Ice, Magma Rock.
- **Liquids**: Water, Oil, Acid, Lava, Slime.
- **Gases**: Steam, Smoke, Gas (explosive!), Cryo (freezing).
- **Energetics**: Fire, Gunpowder, C4 (plastic explosive), Coal, Firework.
- **Special**: Black Hole (attracts and consumes particles).
- **Tools**: Erase, Brush size, Override toggle.

### ⚡ Interactions
- 🔥 Fire spreads to wood, ignites oil, gas, coal, and slime
- 💧 Water extinguishes fire, creates steam near lava
- 🧪 Acid dissolves materials, melts ice fast, reacts with lava
- 🧊 Ice freezes water, melts near heat sources
- 🌋 Lava cools to Magma Rock, remelts when heated
- ❄️ Cryo freezes water & steam, extinguishes fire, cools lava
- 🪵 Burning wood creates charcoal (Coal) that can be re-ignited
- 🎆 Fireworks launch upward and explode into sparks
- 💥 C4 creates massive explosions with shockwaves
- ⚫ Black Holes pull in and consume nearby particles!
- 💨 Particles fall through gases naturally (density-based)

### 🚀 Performance Optimizations
| Optimization            | Description                     |
| ----------------------- | ------------------------------- |
| **WebGL Rendering**     | GPU-accelerated via PixiJS      |
| **Uint32 Pixel Writes** | 4x fewer memory operations      |
| **Pre-computed Colors** | Zero runtime color conversion   |
| **Web Workers**         | Physics runs off main thread    |
| **Shared Memory**       | Atomic particle counting        |
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
│   ├── core/           # World, Grid, SharedMemory, Constants
│   ├── materials/      # Sand, Water, Fire, BlackHole, etc.
│   ├── rendering/      # WebGLRenderer, BlackHoleFilter
│   ├── input/          # Line-interpolated drawing
│   ├── workers/        # Physics worker (multi-threaded)
│   └── main.ts         # Entry point
└── index.html
```

---

## 🧩 Adding New Materials

See the [`/add-material`](.agent/workflows/add-material.md) workflow for detailed steps.

---

## 📄 License

MIT © 2024

---

<p align="center">
  Made with 🏖️ and TypeScript
</p>
