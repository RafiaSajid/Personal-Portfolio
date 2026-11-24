import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { customCharactersConfig } from './customCharactersConfig.js';

/**
 * CustomNPCManager
 * Handles optional custom characters in the 3D scene.
 * Loads GLB models gracefully. If model file or animation clip is missing,
 * cleanly omits without breaking scene execution.
 * When player is within triggerDistance, triggers wave animation once,
 * then smoothly returns to idle with cooldown protection.
 */
export class CustomNPCManager {
  constructor(scene) {
    this.scene = scene;
    this.characters = [];
    this.loader = new GLTFLoader();
    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    customCharactersConfig.forEach((cfg) => {
      // If no model path configured, cleanly omit without throwing
      if (!cfg.modelPath || typeof cfg.modelPath !== 'string') {
        return;
      }
      this.loadCharacter(cfg);
    });
  }

  loadCharacter(cfg) {
    this.loader.load(
      cfg.modelPath,
      (gltf) => {
        try {
          const root = gltf.scene;
          root.name = `npc-${cfg.id}`;
          root.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
          root.scale.setScalar(cfg.scale || 1.0);
          if (cfg.rotationY) root.rotation.y = cfg.rotationY;

          let mixer = null;
          let idleAction = null;
          let waveAction = null;

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(root);
            const idleClip = THREE.AnimationClip.findByName(gltf.animations, cfg.clips?.idle || 'idle')
              || gltf.animations[0];
            const waveClip = THREE.AnimationClip.findByName(gltf.animations, cfg.clips?.wave || 'wave');

            if (idleClip) {
              idleAction = mixer.clipAction(idleClip);
              idleAction.setLoop(THREE.LoopRepeat);
              idleAction.play();
            }

            if (waveClip) {
              waveAction = mixer.clipAction(waveClip);
              waveAction.setLoop(THREE.LoopOnce);
              waveAction.clampWhenFinished = true;
            }
          }

          this.scene.add(root);

          const characterObj = {
            config: cfg,
            root,
            mixer,
            idleAction,
            waveAction,
            isWaving: false,
            lastWaveTime: -999
          };

          if (mixer && waveAction) {
            mixer.addEventListener('finished', (e) => {
              if (e.action === waveAction) {
                characterObj.isWaving = false;
                if (idleAction) {
                  idleAction.reset().fadeIn(0.3).play();
                }
              }
            });
          }

          this.characters.push(characterObj);
        } catch (err) {
          console.warn(`[CustomNPCManager] Failed to setup character ${cfg.id}:`, err);
        }
      },
      undefined,
      (err) => {
        // Missing asset is completely normal - omit cleanly without breaking
        console.info(`[CustomNPCManager] Custom model for ${cfg.id} omitted:`, err?.message || err);
      }
    );
  }

  update(delta, playerPos) {
    if (!this.characters.length || !playerPos) return;

    const now = performance.now() / 1000;

    this.characters.forEach((char) => {
      if (char.mixer) {
        char.mixer.update(delta);
      }

      if (!char.waveAction) return;

      const dist = Math.hypot(
        playerPos.x - char.root.position.x,
        playerPos.z - char.root.position.z
      );

      const triggerDist = char.config.triggerDistance || 4.5;
      const cooldown = char.config.waveCooldown || 8.0;

      if (dist <= triggerDist && !char.isWaving && (now - char.lastWaveTime >= cooldown)) {
        char.isWaving = true;
        char.lastWaveTime = now;

        if (char.idleAction) {
          char.idleAction.fadeOut(0.2);
        }
        char.waveAction.reset().fadeIn(0.2).play();
      }
    });
  }
}
