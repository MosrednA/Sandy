Per-Particle Temperature System
Every particle has temperature. Heat conducts between neighbors. Temperature triggers state changes.

Complete Material Matrix
Heat Sources (Emit Heat)
Material	Base Temp	Notes
Fire	+500°	Decays, emits heat
Ember	+300°	Slow burn
Lava	+1000°	Persistent
Hot Smoke	+150°	Fades quickly
Cold Sources (Absorb Heat)
Material	Base Temp	Notes
Ice	-50°	Stable cold
Cryo	-100°	Strong cooling
Reactive Materials (State Changes)
Material	Cold Effect	Hot Effect
Water	→ Ice (<0°)	→ Steam (>100°)
Ice	-	→ Water (>0°)
Steam	→ Water (<80°)	-
Wood	-	→ Ember (>300°)
Coal	-	→ Ember (>250°)
Oil	-	→ Fire (>200°)
Gunpowder	-	→ Explode (>150°)
C4	-	→ Explode (>100°)
Slime	-	→ Fire (>180°)
MagmaRock	-	→ Lava (>800°)
Lava	→ MagmaRock (<600°)	-
Passive Materials (Conduct Only)
Material	Conductivity	Notes
Stone	0.3	Slow conductor
Sand	0.2	Poor conductor
Smoke	0.05	Insulator
Acid	0.5	Medium
Empty	0.01	Almost none
Wall	0.0	No conduction
Special Materials
Material	Behavior
Black Hole	Absorbs heat (infinite sink)
Firework	Ignites at >100°, creates heat burst
Gas	Explodes faster when hot
Implementation Phases
Phase 1: Grid Temperature
Add temperature: Float32Array to Grid
Add get/set methods
Temperature moves with particles
Phase 2: Heat Sources
Fire/Lava/Ember emit heat to self
Ice/Cryo set cold temperature
Phase 3: Conduction
Each frame: blend temp with neighbors
Weighted by material conductivity
Phase 4: State Changes
Check temperature thresholds
Trigger material transformations
Verification
Lava melts nearby ice at distance
Water boils to steam near fire
Cold cryo zone visible via condensing steam