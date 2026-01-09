# Sandy Material Interactions Matrix

> **Last Updated**: 2026-01-09  
> **Total Materials**: 24  
> **Total Interactions**: 35+ documented

---

## Material Categories

| Category       | Materials                                      | Count |
| -------------- | ---------------------------------------------- | ----- |
| **Solids**     | Stone, Sand, Wood, Ice, MagmaRock, Glass, Coal | 7     |
| **Liquids**    | Water, Acid, Oil, Slime, Lava, Mercury         | 6     |
| **Gases**      | Steam, Smoke, HotSmoke, Gas, Cryo, Dust        | 6     |
| **Energetics** | Fire, Gunpowder, C4, Ember, Firework           | 5     |
| **Special**    | BlackHole, Plasma                              | 2     |

---

## ✅ Implemented Interactions

### 🔥 Fire
| Target | Result           | File            |
| ------ | ---------------- | --------------- |
| Wood   | → Ember          | `Energetics.ts` |
| Oil    | → Fire (spreads) | `Energetics.ts` |
| Slime  | → Fire (spreads) | `Energetics.ts` |
| Ice    | → Water (20%)    | `Energetics.ts` |

### 💧 Water
| Target        | Result                   | File         |
| ------------- | ------------------------ | ------------ |
| Fire          | → Steam (both evaporate) | `Liquids.ts` |
| (temp > 100°) | → Steam                  | `Liquids.ts` |
| (temp < 0°)   | → Ice                    | `Liquids.ts` |

### 🧊 Ice
| Target           | Result                 | File          |
| ---------------- | ---------------------- | ------------- |
| Water (neighbor) | → Ice (spreads freeze) | `Elements.ts` |
| (temp > 0°)      | → Water (melts)        | `Elements.ts` |
| Emits -50°       | Cools neighbors        | `Elements.ts` |

### 🌋 Lava
| Target        | Result                         | File          |
| ------------- | ------------------------------ | ------------- |
| Water         | → MagmaRock + Steam            | `Elements.ts` |
| Ice           | → Steam (40%) / MagmaRock (2%) | `Elements.ts` |
| (temp < 600°) | → MagmaRock                    | `Elements.ts` |
| Emits 1000°   | Heats neighbors                | `Elements.ts` |
| (1% chance)   | → emits Fire/Smoke/Gas         | `Elements.ts` |

### 🧪 Acid
| Target | Result                  | File         |
| ------ | ----------------------- | ------------ |
| Stone  | → dissolves both (10%)  | `Liquids.ts` |
| Sand   | → dissolves both (10%)  | `Liquids.ts` |
| Wood   | → dissolves both (10%)  | `Liquids.ts` |
| Ice    | → Water (30% fast melt) | `Liquids.ts` |
| Lava   | → HotSmoke + Smoke      | `Liquids.ts` |

### ☢️ Slime (Poison)
| Target        | Result                | File         |
| ------------- | --------------------- | ------------ |
| Water         | → Acid (5% mutation)  | `Liquids.ts` |
| Stone         | → Sand (0.5% erosion) | `Liquids.ts` |
| (temp > 250°) | → Fire                | `Liquids.ts` |

### 💣 Gunpowder
| Target        | Result                   | File            |
| ------------- | ------------------------ | --------------- |
| Water         | → Sand (10% neutralized) | `Energetics.ts` |
| Acid          | → Explosion              | `Energetics.ts` |
| (temp > 150°) | → Explosion              | `Energetics.ts` |

### 💥 C4
| Target        | Result              | File            |
| ------------- | ------------------- | --------------- |
| (temp > 100°) | → Massive Explosion | `Energetics.ts` |

### 💨 Gas
| Target         | Result               | File          |
| -------------- | -------------------- | ------------- |
| (temp < -50°)  | → Cryo (15%)         | `Elements.ts` |
| (temp > 1500°) | → Plasma (20%)       | `Elements.ts` |
| (temp > 200°)  | → Fire explosion     | `Elements.ts` |
| Ice            | → Cryo (8%)          | `Elements.ts` |
| Lava           | → Plasma (15%)       | `Elements.ts` |
| Cryo           | → Cryo (5% chain)    | `Elements.ts` |
| Plasma         | → Plasma (10% chain) | `Elements.ts` |

### 🌫️ Dust
| Target        | Result      | File       |
| ------------- | ----------- | ---------- |
| Fire/Ember    | → Explosion | `Gases.ts` |
| (temp > 150°) | → Explosion | `Gases.ts` |

### ❄️ Cryo
| Target      | Result                    | File          |
| ----------- | ------------------------- | ------------- |
| Water       | → Ice (15% direct freeze) | `Elements.ts` |
| Steam       | → Water (20% condense)    | `Elements.ts` |
| Fire/Ember  | → Steam (extinguish)      | `Elements.ts` |
| Lava        | → MagmaRock + Steam (20%) | `Elements.ts` |
| Emits -100° | Freezes via temperature   | `Elements.ts` |

### 🟣 Plasma
| Target      | Result                       | File         |
| ----------- | ---------------------------- | ------------ |
| Water       | → Steam                      | `Special.ts` |
| Ice         | → Steam (skip water)         | `Special.ts` |
| Wood        | → Fire                       | `Special.ts` |
| Oil         | → Fire                       | `Special.ts` |
| Coal        | → Fire                       | `Special.ts` |
| Gunpowder   | → triggers explosion (2000°) | `Special.ts` |
| C4          | → triggers explosion (2000°) | `Special.ts` |
| Gas         | → triggers explosion (2000°) | `Special.ts` |
| Dust        | → triggers explosion (2000°) | `Special.ts` |
| Sand        | → Glass (10%)                | `Special.ts` |
| Emits 2000° | Heats neighbors              | `Special.ts` |

### 🟤 MagmaRock
| Target                  | Result           | File          |
| ----------------------- | ---------------- | ------------- |
| (temp > 800°)           | → Lava (remelts) | `Elements.ts` |
| Sinks in Water/Lava/Oil | Density swap     | `Elements.ts` |

### �ite Coal
| Target        | Result  | File          |
| ------------- | ------- | ------------- |
| (temp > 250°) | → Ember | `Elements.ts` |

### 🔥 HotSmoke
| Target     | Result                   | File       |
| ---------- | ------------------------ | ---------- |
| Water      | → Steam + cools to Smoke | `Gases.ts` |
| (3% decay) | → Smoke                  | `Gases.ts` |

### ⚫ BlackHole
| Target                 | Result          | File         |
| ---------------------- | --------------- | ------------ |
| Everything (radius 6)  | → consumed      | `Special.ts` |
| Everything (radius 20) | → pulled toward | `Special.ts` |

### 🛢️ Oil
| Target          | Result            | File         |
| --------------- | ----------------- | ------------ |
| (temp 100-250°) | → emits Gas vapor | `Liquids.ts` |
| (temp > 250°)   | → Fire            | `Liquids.ts` |

### 🪙 Mercury
| Target        | Result                  | File         |
| ------------- | ----------------------- | ------------ |
| (density 100) | Sinks below all liquids | `Liquids.ts` |

---

## ⬜ Missing Interactions (Suggestions)

### Priority: High (Logical Gaps)

✅ **All high-priority interactions have been implemented!**

### Priority: Medium (Realism)

| Material A | Material B     | Expected Result    | Reason                        |
| ---------- | -------------- | ------------------ | ----------------------------- |
| Glass      | (temp > 1500°) | → Lava             | Glass melts at high temp      |
| Plasma     | Glass          | → Lava             | Ultra-hot melts glass         |
| Mercury    | Fire           | → Smoke (vaporize) | Mercury vaporizes when heated |
| Mercury    | Plasma         | → Smoke (instant)  | Extreme heat vaporizes        |
| Acid       | Glass          | → dissolves        | Acid etches glass             |
| Acid       | Mercury        | → Smoke (reaction) | Chemical reaction             |

### Priority: Low (Fun Factor)

| Material A | Material B | Expected Result  | Reason               |
| ---------- | ---------- | ---------------- | -------------------- |
| Slime      | Ice        | → Acid (mutated) | Radioactive mutation |
| Cryo       | Slime      | → Ice            | Freeze the slime     |
| Plasma     | Slime      | → Fire + Smoke   | Burn and vaporize    |
| Plasma     | Dust       | → explosion      | Chain reaction       |
| Mercury    | Acid       | → toxic Smoke    | Chemical reaction    |

---

## Temperature Reference

| Material  | Temperature (°C) | Effect         |
| --------- | ---------------- | -------------- |
| Ice       | -50              | Emits cold     |
| Cryo      | -100             | Coldest gas    |
| Water     | 10               | Slight cooling |
| Room Temp | 20               | Default        |
| Fire      | 500              | Hot            |
| Lava      | 1000             | Very hot       |
| Plasma    | 2000             | Extreme        |

### Phase Change Thresholds

| Transition         | Temperature |
| ------------------ | ----------- |
| Water → Ice        | < 0°        |
| Ice → Water        | > 0°        |
| Water → Steam      | > 100°      |
| Steam → Water      | < 100°      |
| Lava → MagmaRock   | < 600°      |
| MagmaRock → Lava   | > 800°      |
| Oil ignites        | > 250°      |
| Coal ignites       | > 250°      |
| Gunpowder explodes | > 150°      |
| C4 explodes        | > 100°      |
| Gas ignites        | > 200°      |
| Dust ignites       | > 150°      |

---

## Density Reference (Liquids)

| Material  | Density | Behavior            |
| --------- | ------- | ------------------- |
| Oil       | 5       | Floats on water     |
| Water     | 10      | Standard            |
| Slime     | 12      | Slightly heavier    |
| Acid      | 15      | Sinks in water      |
| Lava      | 20      | Heavy               |
| MagmaRock | 30      | Sinks in lava       |
| Mercury   | 100     | Heaviest liquid     |
| Solids    | 255     | Cannot be displaced |

---

## File Reference

| File            | Materials                                       | Interactions                        |
| --------------- | ----------------------------------------------- | ----------------------------------- |
| `Liquids.ts`    | Water, Acid, Oil, Slime, Mercury                | Water↔Fire, Acid↔*, Slime mutations |
| `Gases.ts`      | Steam, Smoke, HotSmoke, Dust                    | Dust explosions, HotSmoke↔Water     |
| `Energetics.ts` | Fire, Gunpowder, C4, Ember                      | Fire spread, explosions             |
| `Elements.ts`   | Lava, Ice, Gas, MagmaRock, Cryo, Coal, Firework | Phase changes, ignitions            |
| `Special.ts`    | BlackHole, Plasma                               | Consumption, vaporization           |
| `Solids.ts`     | Stone, Glass                                    | Passive (no interactions)           |
| `Wood.ts`       | Wood, Ember                                     | Burning                             |
| `Sand.ts`       | Sand                                            | Falling only                        |
