/**
 * Optional Custom Character Configuration
 *
 * Support configurable asset paths without making the scene depend on them.
 * If a character has a wave animation clip, trigger it when the player approaches
 * within a configurable distance, then return to idle if available.
 * Use a cooldown so the wave does not retrigger every frame.
 * If the model or clip is missing, omit it cleanly.
 * Do not imply these characters are collaborators or named real people.
 */

export const customCharactersConfig = [
  {
    id: '3D Cat',
    label: '3D Cat',
    // Configurable GLB model path (e.g. './assets/characters/vr-guide.glb')
    // Defaults to null so scene runs cleanly without requiring models
    modelPath: './assets/characters/cat.glb',
    // Destination or world position
    destination: 'projects',
    position: { x: 104, y: 0, z: -88 },
    scale: 0.6,
    rotationY: Math.PI / 4,
    // Approach trigger distance (meters)
    triggerDistance: 5.0,
    // Cooldown before wave can trigger again (seconds)
    waveCooldown: 8.0,
    // Clip names inside the custom GLB
    clips: {
      idle: 'idle',
      wave: 'idle2'
    }
  },
  {
    id: '3D Character',
    label: '3D Character',
    modelPath: './assets/characters/3d-char.glb',
    destination: 'about',
    position: { x: -6, y: 0, z: 122 },
    scale: 0.6,
    rotationY: -Math.PI / 3,
    triggerDistance: 4.5,
    waveCooldown: 8.0,
    clips: {
      idle: 'idle',
      wave: 'wave'
    }
  }
];
