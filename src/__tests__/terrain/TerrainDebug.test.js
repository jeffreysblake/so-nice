import { describe, it, expect, beforeEach } from 'vitest';
import { TerrainManager } from '../../terrain/TerrainManager';
import { readFileSync } from 'fs';
import { resolve } from 'path';
describe('TerrainManager - Debug Tile Positions', () => {
    let scene;
    let terrainManager;
    beforeEach(() => {
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
        // Load collision data
        const basePath = resolve(process.cwd(), 'public/assets/collision');
        const normalData = readFileSync(resolve(basePath, 'collision-array-normal.bin'));
        const rotatedData = readFileSync(resolve(basePath, 'collision-array-rotated.bin'));
        const angleData = readFileSync(resolve(basePath, 'angle-map.bin'));
        terrainManager.getCollisionDataLoader().loadFromBuffers(normalData.buffer.slice(normalData.byteOffset, normalData.byteOffset + normalData.byteLength), rotatedData.buffer.slice(rotatedData.byteOffset, rotatedData.byteOffset + rotatedData.byteLength), angleData.buffer.slice(angleData.byteOffset, angleData.byteOffset + angleData.byteLength));
        terrainManager.buildGreenHillZone();
    });
    it('should show tile positions for first 50 X positions', () => {
        const collisionManager = terrainManager.getCollisionManager();
        const groundLevel = 41;
        const report = [];
        for (let x = 0; x < 50; x++) {
            const tilesAtX = [];
            // Check all Y positions from 30 to 52
            for (let y = 30; y <= 52; y++) {
                if (collisionManager.getTile(x, y)) {
                    tilesAtX.push(y);
                }
            }
            if (tilesAtX.length === 0) {
                report.push(`X=${x}: NO TILES FOUND`);
            }
            else {
                report.push(`X=${x}: tiles at Y=${tilesAtX.join(',')}`);
            }
        }
        console.log('\n=== TILE POSITIONS FOR X=0 TO X=49 ===');
        console.log(report.join('\n'));
        console.log('===================================\n');
        // This test always passes - it's just for diagnostic output
        expect(true).toBe(true);
    });
});
