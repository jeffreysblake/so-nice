import { describe, it, expect, beforeEach } from 'vitest';
import { TerrainManager } from '../../terrain/TerrainManager';
describe('TerrainManager - Gap Detection', () => {
    let scene;
    let terrainManager;
    beforeEach(() => {
        // Create a minimal mock scene
        scene = {
            add: {
                graphics: () => ({
                    setDepth: () => { },
                    clear: () => { },
                    fillStyle: () => { },
                    fillRect: () => { },
                    lineStyle: () => { },
                    strokeRect: () => { },
                }),
            },
        };
        terrainManager = new TerrainManager(scene);
        terrainManager.buildGreenHillZone();
    });
    it('should have no gaps in terrain from x=0 to x=310', () => {
        const collisionManager = terrainManager.getCollisionManager();
        const gaps = [];
        const groundLevel = 41;
        const searchRange = 10; // Check 10 tiles above and below ground level
        // Check each X position from 0 to 310
        for (let x = 0; x <= 310; x++) {
            let foundTile = false;
            // Search for a tile in a reasonable Y range around ground level
            for (let y = groundLevel - searchRange; y <= groundLevel + searchRange; y++) {
                const tile = collisionManager.getTile(x, y);
                if (tile) {
                    foundTile = true;
                    break;
                }
            }
            if (!foundTile) {
                gaps.push(x);
            }
        }
        if (gaps.length > 0) {
            // Group consecutive gaps into ranges for easier reading
            const gapRanges = [];
            let rangeStart = gaps[0];
            let rangeEnd = gaps[0];
            for (let i = 1; i < gaps.length; i++) {
                if (gaps[i] === rangeEnd + 1) {
                    rangeEnd = gaps[i];
                }
                else {
                    gapRanges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
                    rangeStart = gaps[i];
                    rangeEnd = gaps[i];
                }
            }
            gapRanges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
            expect.fail(`Found ${gaps.length} gaps in terrain at X positions: ${gapRanges.join(', ')}`);
        }
        expect(gaps).toHaveLength(0);
    });
    it('should have continuous terrain for the first 100 tiles', () => {
        const collisionManager = terrainManager.getCollisionManager();
        const groundLevel = 41;
        for (let x = 0; x < 100; x++) {
            let foundTile = false;
            // Check a range of Y positions
            for (let y = groundLevel - 10; y <= groundLevel + 10; y++) {
                if (collisionManager.getTile(x, y)) {
                    foundTile = true;
                    break;
                }
            }
            expect(foundTile, `No tile found at X=${x}`).toBe(true);
        }
    });
    it('should properly connect buildFlatSection and buildGentleHill', () => {
        const collisionManager = terrainManager.getCollisionManager();
        const groundLevel = 41;
        // Section 1 ends at tile 29 (buildFlatSection(0, 30, groundLevel))
        // Section 2 starts at tile 30 (buildGentleHill(30, 42, groundLevel, 2))
        // Check tiles 28, 29, 30, 31 for continuity
        for (let x = 28; x <= 31; x++) {
            let foundTile = false;
            for (let y = groundLevel - 5; y <= groundLevel + 5; y++) {
                if (collisionManager.getTile(x, y)) {
                    foundTile = true;
                    break;
                }
            }
            expect(foundTile, `Gap at X=${x} (transition between sections)`).toBe(true);
        }
    });
});
