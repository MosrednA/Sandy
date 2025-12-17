<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="Canvas"/>
</p>

# 🏜️ Sandy

A high-performance **falling sand simulation** built with TypeScript and Web Workers. Create, destroy, and watch elements interact in a satisfying particle sandbox.

![Falling Sand Demo](https://raw.githubusercontent.com/MosrednA/Sandy/main/public/demo.gif)

---

## ✨ Features

### 🧱 Materials
| Category       | Materials                     |
| -------------- | ----------------------------- |
| **Solids**     | Sand, Stone, Wood, Ice, Plant |
| **Liquids**    | Water, Oil, Acid              |
| **Gases**      | Steam, Flammable Gas          |
| **Energetics** | Fire, Lava, Ember, Gunpowder  |

### ⚡ Interactions
- 🔥 **Fire** spreads to wood and ignites oil & gas explosively
- 💧 **Water** extinguishes fire and creates steam near lava
- 🧪 **Acid** dissolves materials and creates bubbling reactions
- 🧊 **Ice** freezes water and melts near heat sources
- 🌱 **Plants** grow when touched by water

### 🚀 Performance
- **Chunk-based physics** – Only active regions are simulated
- **Web Workers** – Physics runs off the main thread
- **Dirty rectangle rendering** – Minimal canvas updates
- **60 FPS** target with thousands of particles

---

## 🎮 Controls

| Action              | Input                                |
| ------------------- | ------------------------------------ |
| **Draw**            | Left Mouse (hold & drag)             |
| **Change Material** | Click material buttons               |
| **Brush Size**      | Slider in UI panel                   |
| **Clear Canvas**    | Clear button                         |
| **Override Mode**   | Toggle to replace existing particles |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MosrednA/Sandy.git
cd Sandy

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
Sandy/
├── src/
│   ├── core/           # World, Grid, and simulation logic
│   ├── materials/      # Material definitions (Sand, Water, Fire, etc.)
│   ├── rendering/      # Canvas rendering system
│   ├── input/          # Mouse/touch input handling
│   ├── workers/        # Web Worker for physics thread
│   └── main.ts         # Application entry point
├── public/             # Static assets
└── index.html          # HTML entry point
```

---

## 🧩 Adding New Materials

1. Create a new material class in `src/materials/`
2. Extend the `Material` base class
3. Implement `id`, `name`, `color`, and `update()` method
4. Register in `main.ts` with `materialRegistry.register()`
5. Add UI button in the HTML template

See `/add-material` workflow for detailed steps.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest new materials or interactions
- 🔧 Submit pull requests

---

## 📄 License

MIT © 2024

---

<p align="center">
  Made with 🏖️ and TypeScript
</p>
