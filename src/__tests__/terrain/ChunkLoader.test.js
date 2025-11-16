import { describe, it, expect, beforeAll } from 'vitest';
import { ChunkLoader } from '../../terrain/ChunkLoader';
import { EnigmaDecompressor } from '../../utils/EnigmaDecompressor';
import { readFileSync } from 'fs';
import { join } from 'path';
describe('ChunkLoader', () => {
    let chunkLoader;
    let chunksData;
    let collisionIndexData;
    beforeAll(() => {
        // Load the actual GHZ chunk files from filesystem
        const publicDir = join(process.cwd(), 'public');
        const chunksPath = join(publicDir, 'assets/maps/ghz-chunks.eni');
        const collisionIndexPath = join(publicDir, 'assets/maps/ghz-collision-index.bin');
        chunksData = readFileSync(chunksPath).buffer;
        collisionIndexData = readFileSync(collisionIndexPath).buffer;
        chunkLoader = new ChunkLoader();
        chunkLoader.loadFromBuffers(chunksData, collisionIndexData);
    });
    it('should load chunk data successfully', () => {
        expect(chunkLoader.isLoaded()).toBe(true);
    });
    it('should have loaded chunks', () => {
        const chunkCount = chunkLoader.getChunkCount();
        expect(chunkCount).toBeGreaterThan(0);
        console.log(`✓ Loaded ${chunkCount} chunks`);
    });
    it('should be able to get a chunk by index', () => {
        const chunk = chunkLoader.getChunk(0);
        expect(chunk).toBeDefined();
        expect(chunk?.tiles).toBeDefined();
        expect(chunk?.tiles.length).toBe(4); // Each chunk has 4 tiles
    });
    it('should have valid tile references in chunks', () => {
        const chunk = chunkLoader.getChunk(0);
        expect(chunk).toBeDefined();
        const firstTile = chunk.tiles[0];
        expect(firstTile.tileIndex).toBeGreaterThanOrEqual(0);
        expect(firstTile.tileIndex).toBeLessThan(2048); // 11-bit tile index
        expect(firstTile.palette).toBeGreaterThanOrEqual(0);
        expect(firstTile.palette).toBeLessThanOrEqual(3);
        expect(typeof firstTile.flipX).toBe('boolean');
        expect(typeof firstTile.flipY).toBe('boolean');
        expect(typeof firstTile.priority).toBe('boolean');
    });
    it('should be able to get collision index for chunks', () => {
        const collisionIndex = chunkLoader.getCollisionIndex(0);
        expect(collisionIndex).toBeGreaterThanOrEqual(0);
        expect(collisionIndex).toBeLessThanOrEqual(255);
    });
    it('should return 0xFF for invalid chunk indices', () => {
        const invalidIndex = chunkLoader.getCollisionIndex(9999); // Way beyond 8192 entries
        expect(invalidIndex).toBe(0xFF);
    });
    it('should decompress chunks using Enigma algorithm', () => {
        const decompressor = new EnigmaDecompressor(chunksData);
        const decompressed = decompressor.decompress(0);
        expect(decompressed.length).toBeGreaterThan(0);
        console.log(`✓ Decompressed ${decompressed.length} tile references`);
    });
    it('should parse tile words correctly', () => {
        const chunk = chunkLoader.getChunk(1);
        expect(chunk).toBeDefined();
        // Log chunk details for verification
        console.log('Chunk 1 tiles:', chunk.tiles.map(t => ({
            index: t.tileIndex,
            flipX: t.flipX,
            flipY: t.flipY,
            palette: t.palette
        })));
    });
});
