import { Grid } from '../core/Grid';
import { Material } from './Material';
import { materialRegistry } from './MaterialRegistry';

export abstract class Liquid extends Material {
    // Default density for water-like liquids
    density: number = 10;
    dispersion: number = 5;

    // Probability to flow horizontally (Viscosity control)
    // 0.1 = thick sludge, 1.0 = water
    flowRate: number = 1.0;

    update(grid: Grid, x: number, y: number): boolean {
        // Gravity
        let velocity = grid.getVelocity(x, y);
        velocity += 0.5; // Gravity acceleration
        if (velocity > 8) velocity = 8; // Terminal velocity

        // 1. Viscosity Check (Horizontal Flow limitation) - PRE-CHECK
        // If we are viscous (flowRate < 1), we can decide early if we want to skip horizontal logic
        // But we must do gravity first.

        // Fast Random for Viscosity:
        // Use large primes to avoid diagonal moiré patterns
        const fastRand = (x * 12347 + y * 42347 + grid.frameCount * 73241) & 127;
        const flowThreshold = this.flowRate * 128;
        const canFlow = fastRand < flowThreshold;

        // Optimization: if velocity is high, we are falling, so we ignore viscosity checks until impact.
        // If on ground (velocity 0), we check viscosity.

        const steps = Math.floor(velocity);

        let moved = false;
        let currentX = x;
        let currentY = y;
        let hitGround = false;

        // --- VERTICAL FALL ---
        const checkSteps = Math.max(1, steps);

        // Inline lookups for common cases
        // Check immediate bottom first (Optimistic)
        const bottomY = currentY + 1;
        if (bottomY < grid.height) {
            const below = grid.get(currentX, bottomY);
            if (below === 0) {
                // Fast path fall
                if (checkSteps === 1) { // Common case
                    grid.move(currentX, currentY, currentX, bottomY);
                    grid.setVelocity(currentX, bottomY, velocity);
                    return true;
                }
                // Else fall through loop below
            } else if (below === this.id) {
                // Hit same liquid, likely stacking. 
                // We can skip density check for self!
                velocity = 0;
                hitGround = true;
                grid.setVelocity(currentX, currentY, 0); // Stop
                // Continue to horizontal flow
            }
        }

        // Full gravity loop if not handled above
        if (!hitGround && (checkSteps > 1 || grid.get(currentX, bottomY) !== 0)) {
            for (let i = 0; i < checkSteps; i++) {
                const nextY = currentY + 1;

                if (nextY >= grid.height) {
                    hitGround = true;
                    velocity = 0;
                    break;
                }

                const below = grid.get(currentX, nextY);

                if (below === 0) {
                    // Empty space
                    if (steps > 0 || i === 0) {
                        grid.move(currentX, currentY, currentX, nextY);
                        moved = true;
                        currentY = nextY;
                    } else {
                        break;
                    }
                } else {
                    // Collision
                    if (below === this.id) {
                        // Optimisation: Don't check density against self
                        velocity = 0;
                        hitGround = true;
                        break;
                    }

                    const other = materialRegistry.get(below);
                    if (other && (other.density !== undefined)) {
                        if (other.density < this.density) {
                            grid.swap(currentX, currentY, currentX, nextY);
                            moved = true;
                            currentY = nextY;
                            velocity *= 0.8;
                            continue;
                        }
                    }

                    velocity = 0;
                    hitGround = true;
                    break;
                }
            }
        }

        if (!hitGround) {
            grid.setVelocity(currentX, currentY, velocity);
            return moved;
        } else {
            grid.setVelocity(currentX, currentY, 0);
        }

        // --- HORIZONTAL FLOW ---

        // early exit if viscous and "unlucky" frame
        if (!canFlow) return moved;

        // 2. Check Pressure (Only if active or crowded)
        // Check above. If Empty, we are NOT pressurized.
        const aboveID = grid.get(currentX, currentY - 1);
        let isPressurized = false;

        if (aboveID !== 0) {
            if (aboveID === this.id) {
                isPressurized = true;
            } else {
                const aboveMat = materialRegistry.get(aboveID);
                if (aboveMat && (aboveMat.density || 0) >= this.density) {
                    isPressurized = true;
                }
            }
        }

        // Better random direction based on high-frequency noise
        // This avoids diagonal banding
        const dirRand = (x * 4523 + y * 8321 + grid.frameCount * 5123);
        let dir = (dirRand & 1) === 0 ? 1 : -1;

        // Cheap random drift: use last bit of X
        // if ((x & 1) === 0) dir = -dir; // Simple spatial jitter
        // Actually (x+y+frame) & 4 could be a flip
        // if (((x + currentY + grid.frameCount) & 3) === 0) dir = -dir;

        // VISCOSITY LOGIC:
        // Slide (Slope): max(flowRate, 0.5) -> Allows thick liquids to slide down slopes
        // Spread (Flat): flowRate -> Controls horizontal speed
        const slideThreshold = Math.max(this.flowRate, 0.5) * 128;
        const canSlide = fastRand < slideThreshold;

        // Try Main Direction
        if (this.tryFlow(grid, currentX, currentY, dir, isPressurized, canFlow, canSlide)) return true;
        // Try Opposite Direction
        if (this.tryFlow(grid, currentX, currentY, -dir, isPressurized, canFlow, canSlide)) return true;

        return moved;
    }

    private tryFlow(grid: Grid, x: number, y: number, dir: number, pressurized: boolean, canSpread: boolean, canSlide: boolean): boolean {
        // Standard Flow: Down-Diagonal -> Side
        // Pressurized Flow: Down-Diagonal -> Side -> Up-Diagonal

        const dx = dir;
        const targetX = x + dx;

        // Bounds Check
        if (targetX < 0 || targetX >= grid.width) return false;

        // 1. Check Down-Diagonal (Slope)
        if (canSlide) {
            const dyDown = y + 1;
            if (dyDown < grid.height) {
                const runningInto = grid.get(targetX, dyDown);
                if (runningInto === 0) {
                    grid.move(x, y, targetX, dyDown);
                    return true;
                } else {
                    // Displace lighter liquid down-diagonal
                    const other = materialRegistry.get(runningInto);
                    if (other && other.density !== undefined && other.density < this.density) {
                        grid.swap(x, y, targetX, dyDown);
                        return true;
                    }
                }
            }
        }

        // Horizontal and Up-Diagonal require normal Flow/Spread capability
        if (!canSpread) return false;

        // 2. Check Side (Dispersion)
        // Check neighbors for dispersion range
        for (let i = 1; i <= this.dispersion; i++) {
            const tx = x + (dir * i);
            if (tx < 0 || tx >= grid.width) break;

            const content = grid.get(tx, y);
            if (content === 255) break; // Wall

            if (content === 0) {
                grid.move(x, y, tx, y);
                return true;
            } else if (content === this.id) {
                continue; // Slide through self
            } else {
                // Displace lighter liquid sideways
                const other = materialRegistry.get(content);
                if (other && other.density !== undefined && other.density < this.density) {
                    grid.swap(x, y, tx, y);
                    return true;
                }
                break; // Hit something else
            }
        }

        // 3. Check Up-Diagonal (Pressure Equalization)
        // Only if pressurized!
        if (pressurized) {
            // Look for space diagonally up
            const dyUp = y - 1;
            if (dyUp >= 0) {
                const runningInto = grid.get(targetX, dyUp);
                if (runningInto === 0) {
                    // Found a pocket above-side! Squeeze up!
                    grid.move(x, y, targetX, dyUp);
                    return true;
                } else {
                    // Displace lighter stuff upwards? (e.g. Oil floating up through Water)
                    // If we are Water and Oil is above-side, we should swap?
                    // No, if we are heavier, we go DOWN.
                    // But if we are Heavier (Water) and Lighter (Oil) is blocking our UP path?
                    // Actually, if we are pressurized, we push UP.
                    // If Oil is there, we push it out of the way.
                    const other = materialRegistry.get(runningInto);
                    if (other && other.density !== undefined && other.density < this.density) {
                        grid.swap(x, y, targetX, dyUp);
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
