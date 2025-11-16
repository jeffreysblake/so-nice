import { PhysicsSimulator } from './src/__tests__/helpers/PhysicsSimulator.ts';
import { CollisionManager } from './src/terrain/CollisionManager.ts';
import { TerrainTiles } from './src/terrain/TerrainTile.ts';

const collisionManager = new CollisionManager({});
const simulator = new PhysicsSimulator(80, 640);
simulator.setCollisionManager(collisionManager);

// Create flat ground
for (let x = 0; x < 50; x++) {
  const tile = TerrainTiles.createTile(TerrainTiles.FLAT);
  collisionManager.setTile(x, 41, tile);
}

console.log('Starting simulation...');
console.log('Initial state:', simulator.getState());

for (let i = 0; i < 25; i++) {
  simulator.update({ left: false, right: true, jump: false, down: false }, 1);
  const state = simulator.getState();
  console.log(`Frame ${i+1}: isGrounded=${state.isGrounded}, groundSpeed=${state.groundSpeed.toFixed(6)}, y=${state.y.toFixed(2)}, yVel=${state.yVelocity.toFixed(4)}`);

  if (i === 20) {
    console.log('Full state at frame 20:', state);
  }
}
