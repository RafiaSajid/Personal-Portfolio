/**
 * Avatar Configuration for Rafia Gull's 3D Portfolio
 *
 * HOW TO ADD YOUR OWN 3D AVATAR:
 * 1. Place your .glb or .gltf avatar file inside the project (e.g., in an `assets/` folder).
 * 2. Set `modelPath` to the relative URL of your file, e.g.:
 *      modelPath: './assets/avatar.glb'
 * 3. Set the animation clip names to match the exact names inside your model:
 *      animationNames: {
 *        idle: 'idle',  // name of your idle animation
 *        walk: 'walk',  // name of your walk animation
 *      }
 * 4. Adjust `scale` and `rotationOffset` if your model exports at a different orientation or unit size.
 *
 * If `modelPath` is null or if loading fails, the system automatically uses a polished
 * procedural space explorer with real-time walking and idle locomotion animations.
 */

export const avatarConfig = {
  // Set to your GLB/glTF path, or null to use the procedural space explorer
  modelPath: './assets/Portfolio.glb',

  // Animation names matching clips inside your GLTF file
  animationNames: {
    idle: "Idle",
    walk: "_walk"
  },

  // Model scale and transform offsets
  scale: 0.6,
  positionOffset: [0, 0, 2],
  rotationOffset: [0, Math.PI, 0], // Rotated to face forward along negative Z

  // Walkable Route Boundary Constraints:
  // Keeps the avatar strictly within the star path corridor so it cannot wander into space or asteroids
  bounds: {
    minX: -4.5,   // Left path boundary
    maxX: 4.5,    // Right path boundary
    minZ: -175.0, // Forward-most limit (beyond Skills landmark)
    maxZ: 8.0     // Backward-most starting dock limit
  },

  // Locomotion tuning
  movement: {
    walkSpeed: 7.5,
    rotationSpeed: 9.0,
    acceleration: 14.0,
    deceleration: 12.0
  }
};
