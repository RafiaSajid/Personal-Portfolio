import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { avatarConfig } from './avatarConfig.js';

export class AvatarController {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Avatar Root Container
    this.root = new THREE.Group();
    this.root.position.set(0, 0, 4); // Begin in the home exploration field
    this.scene.add(this.root);

    // Locomotion state
    this.position = this.root.position;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.isMoving = false;
    this.walkCycleTime = 0;

    // Smooth transition / travel state (for landmark auto-walk)
    this.activeTransition = null;

    // Camera Rig Settings
    // Behind and slightly above, looking along negative Z path ahead
    this.cameraOffset = new THREE.Vector3(0, 3.2, 6.2);
    this.cameraCurrentPos = new THREE.Vector3().copy(this.position).add(this.cameraOffset);
    this.cameraLookTarget = new THREE.Vector3();
    this.cameraFocusTarget = null;
    this.orbitAngles = { yaw: 0, pitch: 0.18 };
    this.zoomDistance = 6.2;
    // Guard against camera clipping inside avatar mesh (minimum safe distance is 4.0)
    this.minZoom = 4.0;
    this.maxZoom = 12.0;

    // Reduced motion flag
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // GLTF state
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.isCustomModel = false;
    this.proceduralParts = null;

    this.init();
  }

  init() {
    if (avatarConfig.modelPath) {
      this.loadCustomModel(avatarConfig.modelPath);
    } else {
      this.buildProceduralAvatar();
    }
  }

  loadCustomModel(url) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        this.clearExistingAvatar();
        const model = gltf.scene;

        model.scale.setScalar(avatarConfig.scale);
        model.position.set(...avatarConfig.positionOffset);
        model.rotation.set(...avatarConfig.rotationOffset);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.root.add(model);
        this.isCustomModel = true;

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
          });

          const idleName = (avatarConfig.animationNames.idle || 'idle').toLowerCase();
          const idleAction = this.actions[idleName] || Object.values(this.actions)[0];
          if (idleAction) {
            idleAction.play();
            this.currentAction = idleAction;
          }
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load custom avatar, using procedural explorer:', err);
        this.buildProceduralAvatar();
      }
    );
  }

  clearExistingAvatar() {
    while (this.root.children.length > 0) {
      const obj = this.root.children[0];
      this.root.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    this.proceduralParts = null;
  }

  buildProceduralAvatar() {
    this.clearExistingAvatar();
    this.isCustomModel = false;

    const group = new THREE.Group();

    // Stylized space explorer suited for deep space
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.25
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.95
    });

    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.8
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.35;
    group.add(torso);

    // Torso chest plate
    const chestGeo = new THREE.BoxGeometry(0.5, 0.45, 0.1);
    const chest = new THREE.Mesh(chestGeo, darkMat);
    chest.position.set(0, 1.45, 0.23);
    group.add(chest);

    // 2. Backpack Thruster
    const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.24);
    const pack = new THREE.Mesh(packGeo, darkMat);
    pack.position.set(0, 1.4, -0.32);
    group.add(pack);

    // Plumes
    const plumeGeo = new THREE.ConeGeometry(0.08, 0.28, 8);
    plumeGeo.rotateX(Math.PI);
    const leftPlume = new THREE.Mesh(plumeGeo, thrusterMat);
    leftPlume.position.set(-0.15, 0.95, -0.32);
    const rightPlume = new THREE.Mesh(plumeGeo, thrusterMat);
    rightPlume.position.set(0.15, 0.95, -0.32);
    group.add(leftPlume);
    group.add(rightPlume);

    // 3. Helmet & Visor
    const helmetGeo = new THREE.SphereGeometry(0.36, 20, 20);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.set(0, 2.05, 0);
    group.add(helmet);

    const visorGeo = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.05, 0.12);
    visor.rotation.y = -Math.PI / 2;
    group.add(visor);

    // 4. Limbs (Pivots for walk animation)
    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 12);
    armGeo.translate(0, -0.3, 0);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.46, 1.7, 0);
    leftArmPivot.add(new THREE.Mesh(armGeo, suitMat));
    group.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.46, 1.7, 0);
    rightArmPivot.add(new THREE.Mesh(armGeo, suitMat));
    group.add(rightArmPivot);

    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.75, 12);
    legGeo.translate(0, -0.38, 0);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.2, 0.9, 0);
    leftLegPivot.add(new THREE.Mesh(legGeo, darkMat));
    group.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.2, 0.9, 0);
    rightLegPivot.add(new THREE.Mesh(legGeo, darkMat));
    group.add(rightLegPivot);

    // Subtle floor shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.55, 20);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    group.add(shadow);

    // Clearly mark this fallback so it cannot be mistaken for the supplied avatar.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 72;
    const context = tempCanvas.getContext('2d');
    context.fillStyle = 'rgba(7, 15, 24, 0.84)';
    context.fillRect(2, 6, 316, 60);
    context.strokeStyle = '#d7ad66';
    context.lineWidth = 2;
    context.strokeRect(2, 6, 316, 60);
    context.fillStyle = '#f0d9ad';
    context.font = '600 26px Segoe UI, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('TEMPORARY AVATAR', 160, 36);
    const tempLabel = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(tempCanvas),
      transparent: true,
      depthWrite: false
    }));
    tempLabel.position.set(0, 2.85, 0);
    tempLabel.scale.set(1.7, 0.38, 1);
    group.add(tempLabel);

    this.root.add(group);

    this.proceduralParts = {
      group,
      torso,
      helmet,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      leftPlume,
      rightPlume
    };
  }

  update(delta, input) {
    if (this.activeTransition) {
      this.updateTransition(delta);
    } else {
      this.handleMovement(delta, input);
    }

    this.updateCamera(delta);

    if (this.isCustomModel && this.mixer) {
      this.mixer.update(delta);
      this.updateGLTFAnimationState();
    } else if (this.proceduralParts) {
      this.animateProceduralAvatar(delta);
    }
  }

  handleMovement(delta, input) {
    const moveX = input.moveVector.x;
    const moveZ = input.moveVector.y; // Forward is +1, backward is -1

    const hasInput = Math.hypot(moveX, moveZ) > 0.05;
    this.isMoving = hasInput;

    const baseSpeed = input.isSprinting
      ? avatarConfig.movement.walkSpeed * 1.5
      : avatarConfig.movement.walkSpeed;

    if (hasInput) {
      // Input movement direction:
      // Forward (W) moves along negative Z (forward into the deep space path)
      // Strafe (A/D) moves along X
      this.direction.set(moveX, 0, -moveZ).normalize();

      const targetVelocity = this.direction.clone().multiplyScalar(baseSpeed);
      this.velocity.lerp(targetVelocity, avatarConfig.movement.acceleration * delta);

      // Smooth rotation toward movement heading
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      const currentAngle = this.root.rotation.y;
      let diff = targetAngle - currentAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.root.rotation.y += diff * Math.min(1.0, avatarConfig.movement.rotationSpeed * delta);
    } else {
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), avatarConfig.movement.deceleration * delta);
    }

    // Apply movement translation
    this.root.position.x += this.velocity.x * delta;
    this.root.position.z += this.velocity.z * delta;

    // Broad bounds keep the avatar in the shared portfolio world while allowing free roaming.
    const bounds = avatarConfig.bounds;
    this.root.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.root.position.x));
    this.root.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.root.position.z));
    this.root.position.y = 0; // Grounded to star path
  }

  animateProceduralAvatar(delta) {
    const parts = this.proceduralParts;
    if (!parts) return;

    if (this.isMoving) {
      this.walkCycleTime += delta * 10;
      const swing = Math.sin(this.walkCycleTime) * 0.45;

      parts.leftLegPivot.rotation.x = swing;
      parts.rightLegPivot.rotation.x = -swing;
      parts.leftArmPivot.rotation.x = -swing * 0.8;
      parts.rightArmPivot.rotation.x = swing * 0.8;

      const bob = Math.abs(Math.cos(this.walkCycleTime)) * 0.06;
      parts.torso.position.y = 1.35 + bob;
      parts.helmet.position.y = 2.05 + bob;

      parts.leftPlume.scale.set(0.9, 1.2, 0.9);
      parts.rightPlume.scale.set(0.9, 1.2, 0.9);
    } else {
      // Idle state
      this.walkCycleTime += delta * 2;
      const breathe = Math.sin(this.walkCycleTime) * 0.02;

      parts.leftLegPivot.rotation.x *= 0.85;
      parts.rightLegPivot.rotation.x *= 0.85;
      parts.leftArmPivot.rotation.x *= 0.85;
      parts.rightArmPivot.rotation.x *= 0.85;

      parts.torso.position.y = 1.35 + breathe;
      parts.helmet.position.y = 2.05 + breathe;

      parts.leftPlume.scale.set(0.3, 0.3, 0.3);
      parts.rightPlume.scale.set(0.3, 0.3, 0.3);
    }
  }

  updateGLTFAnimationState() {
    const idleName = (avatarConfig.animationNames.idle || 'idle').toLowerCase();
    const walkName = (avatarConfig.animationNames.walk || 'walk').toLowerCase();

    let targetAction = this.actions[idleName];
    if (this.isMoving && this.actions[walkName]) {
      targetAction = this.actions[walkName];
    }

    if (targetAction && targetAction !== this.currentAction) {
      if (this.currentAction) {
        this.currentAction.fadeOut(0.2);
      }
      targetAction.reset().fadeIn(0.2).play();
      this.currentAction = targetAction;
    }
  }

  updateCamera(delta) {
    // Camera is behind and slightly above character, looking forward down the path
    const pitch = Math.max(-0.2, Math.min(0.8, this.orbitAngles.pitch));
    const yaw = this.orbitAngles.yaw;

    // Enforce minZoom clamp strictly
    const currentZoom = Math.max(this.minZoom, this.zoomDistance);
    const hDist = currentZoom * Math.cos(pitch);
    const vDist = currentZoom * Math.sin(pitch);

    const offsetX = Math.sin(yaw) * hDist;
    const offsetZ = Math.cos(yaw) * hDist;
    const offsetY = Math.max(1.5, vDist);

    const targetPos = new THREE.Vector3(
      this.root.position.x + offsetX,
      this.root.position.y + offsetY + 1.2,
      this.root.position.z + offsetZ
    );

    // Collision & clipping safety guard: ensure camera position never comes closer
    // than 3.5 units to avatar center (prevents camera clipping inside head/torso)
    const avatarCenter = new THREE.Vector3(this.root.position.x, this.root.position.y + 1.3, this.root.position.z);
    const camDir = new THREE.Vector3().subVectors(targetPos, avatarCenter);
    if (camDir.length() < 3.8) {
      camDir.normalize().multiplyScalar(3.8);
      targetPos.copy(avatarCenter).add(camDir);
    }

    // Lerp factor (higher factor if reduced motion preferred)
    const factor = this.reducedMotion ? 1.0 : Math.min(1.0, delta * 7.0);
    this.cameraCurrentPos.lerp(targetPos, factor);
    this.camera.position.copy(this.cameraCurrentPos);

    if (this.cameraFocusTarget) {
      this.cameraLookTarget.lerp(this.cameraFocusTarget, factor);
    } else {
      this.cameraLookTarget.set(
        this.root.position.x,
        this.root.position.y + 1.4,
        this.root.position.z - 2.0 // Look slightly ahead down the path
      );
    }
    this.camera.lookAt(this.cameraLookTarget);
  }

  focusCameraOn(x, y, z) {
    this.cameraFocusTarget = new THREE.Vector3(x, y, z);
  }

  clearCameraFocus() {
    this.cameraFocusTarget = null;
  }

  rotateCamera(deltaYaw, deltaPitch) {
    this.orbitAngles.yaw -= deltaYaw;
    this.orbitAngles.pitch += deltaPitch;
  }

  zoomCamera(deltaZoom) {
    this.zoomDistance = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.zoomDistance + deltaZoom)
    );
  }

  // Smooth transit to landmark with skip/cancel capability
  transitionTo(targetX, targetZ, duration = 1.6, onComplete = null) {
    if (this.reducedMotion) {
      // Instant snap if user prefers reduced motion
      this.warpTo(targetX, 0, targetZ);
      if (onComplete) onComplete();
      return;
    }

    this.activeTransition = {
      startX: this.root.position.x,
      startZ: this.root.position.z,
      targetX,
      targetZ,
      elapsed: 0,
      duration,
      onComplete
    };
    this.isMoving = true;
  }

  cancelTransition() {
    if (this.activeTransition) {
      const target = this.activeTransition;
      this.activeTransition = null;
      this.isMoving = false;
      this.warpTo(target.targetX, 0, target.targetZ);
      if (target.onComplete) target.onComplete();
    }
  }

  updateTransition(delta) {
    if (!this.activeTransition) return;

    const t = this.activeTransition;
    t.elapsed += delta;
    const progress = Math.min(1.0, t.elapsed / t.duration);
    // Smooth ease-in-out curve
    const ease = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    this.root.position.x = t.startX + (t.targetX - t.startX) * ease;
    this.root.position.z = t.startZ + (t.targetZ - t.startZ) * ease;

    // Face travel direction
    const dx = t.targetX - t.startX;
    const dz = t.targetZ - t.startZ;
    if (Math.hypot(dx, dz) > 0.1) {
      this.root.rotation.y = Math.atan2(dx, dz);
    }

    if (progress >= 1.0) {
      this.activeTransition = null;
      this.isMoving = false;
      this.root.position.set(t.targetX, 0, t.targetZ);
      if (t.onComplete) t.onComplete();
    }
  }

  warpTo(x, y, z, facingAngle = Math.PI) {
    this.root.position.set(x, y, z);
    this.root.rotation.y = facingAngle;
    this.velocity.set(0, 0, 0);
    this.orbitAngles.yaw = 0;
    this.cameraCurrentPos.copy(this.root.position).add(this.cameraOffset);
  }
}
