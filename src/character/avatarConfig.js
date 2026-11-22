/**
 * Avatar Configuration
 *
 * Rafia: When you are ready to use your custom 3D avatar:
 * 1. Place your .glb or .gltf file inside an assets folder (e.g. `./assets/avatar.glb`).
 * 2. Set `modelPath` to the relative path of your file.
 * 3. Set `idleClipName` and `walkClipName` to match the exact names of your animations inside the model.
 *
 * If `modelPath` is null or cannot be loaded, the system automatically uses a sleek
 * procedural space traveler avatar with smooth idle floating and walking locomotion.
 */

export const avatarConfig = {
  // Set to relative URL string (e.g. './assets/rafia_avatar.glb') or null for procedural avatar
  modelPath: null,

  // Desired avatar scale and position adjustments
  scale: 1.0,
  positionOffset: [0, 0, 0],
  rotationOffset: [0, Math.PI, 0], // Radians (Y-axis)

  // Animation names embedded in your GLTF/GLB file
  animations: {
    idleClipName: "idle",
    walkClipName: "walk",
    runClipName: "run", // optional
  },

  // Locomotion tuning
  movement: {
    walkSpeed: 9.0,
    runSpeed: 16.0,
    rotationSpeed: 10.0,
    acceleration: 15.0,
    deceleration: 12.0
  }
};
