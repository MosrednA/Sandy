import { materialRegistry } from './MaterialRegistry';
import { Empty, Stone } from './Solids';
import { Sand } from './Sand';
import { Water } from './Water';
import { Acid, Oil, Slime } from './Liquids';
import { Steam, Smoke, HotSmoke } from './Gases';
import { Fire, Gunpowder, C4 } from './Energetics';
import { Wood, Ember } from './Wood';
import { Lava, Ice, Gas, MagmaRock, Cryo, Coal, Firework } from './Elements';
import { BlackHole } from './Special';

/**
 * Centralized material registration.
 * Call this function in both main.ts and physics.worker.ts to ensure
 * all materials are registered consistently in both contexts.
 */
export function registerAllMaterials() {
    materialRegistry.register(new Empty());
    materialRegistry.register(new Stone());
    materialRegistry.register(new Sand());
    materialRegistry.register(new Water());
    materialRegistry.register(new Acid());
    materialRegistry.register(new Steam()); // ID 7
    materialRegistry.register(new Oil());   // ID 9
    materialRegistry.register(new Slime()); // ID 20
    materialRegistry.register(new Fire());  // ID 10
    materialRegistry.register(new Gunpowder()); // ID 11
    materialRegistry.register(new Wood()); // ID 5
    materialRegistry.register(new Smoke()); // ID 12
    materialRegistry.register(new HotSmoke()); // ID 19
    materialRegistry.register(new Ember()); // ID 13
    materialRegistry.register(new Lava()); // ID 14
    materialRegistry.register(new Ice()); // ID 15
    materialRegistry.register(new Gas()); // ID 17
    materialRegistry.register(new BlackHole()); // ID 18
    materialRegistry.register(new C4()); // ID 21
    materialRegistry.register(new MagmaRock()); // ID 22
    materialRegistry.register(new Cryo()); // ID 23
    materialRegistry.register(new Coal()); // ID 24
    materialRegistry.register(new Firework()); // ID 25
}
