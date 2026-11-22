import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { avatarConfig } from './avatarConfig.js';

export class AvatarController {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Root container for avatar
    this.root = new THREE.Group();
    this.root.position.set(0, 0, 12);
    this.scene.add(this.root);

    // Character state
    this.position = this.root.position;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.targetRotation = 0;
    this.isMoving = false;
    this.isRunning = false;
    this.isAirborne = false;
    this.verticalVelocity = 0;

    // Camera rig settings
    this.cameraOffset = new THREE.Vector3(0, 3.2, 6.5);
    this.cameraLookTarget = new THREE.Vector3(0, 1.4, 0);
    this.cameraCurrentPos = new THREE.Vector3().copy(this.position).add(this.cameraOffset);
    this.cameraTargetPos = new THREE.Vector3();
    this.orbitAngles = { yaw: 0, pitch: 0.25 }; // In radians
    this.zoomDistance = 6.8;
    this.minZoom = 3.0;
    this.maxZoom = 15.0;

    // Animation & Mixer state
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.isCustomModel = false;

    // Procedural model references for locomotion animation
    this.proceduralParts = null;
    this.walkCycleTime = 0;

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

        // Enable shadows and enhance materials
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.root.add(model);
        this.isCustomModel = true;

        // Setup GLTF animation clips
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
          });

          // Play configured idle clip or first available clip
          const idleName = (avatarConfig.animations.idleClipName || '').toLowerCase();
          const walkName = (avatarConfig.animations.walkClipName || '').toLowerCase();

          const idleAction = this.actions[idleName] || Object.values(this.actions)[0];
          if (idleAction) {
            idleAction.play();
            this.currentAction = idleAction;
          }
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load custom avatar model, falling back to procedural avatar:', err);
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

    // Palette: Space Explorer (white, deep gray, cyan neon energy)
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeff,
      roughness: 0.35,
      metalness: 0.25
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2029,
      roughness: 0.6,
      metalness: 0.5
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });

    const goldVisorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff7700,
      emissiveIntensity: 0.4,
      metalness: 0.95,
      roughness: 0.05
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeo, suitMaterial);
    torso.position.y = 1.35;
    group.add(torso);

    // Torso chestplate accent
    const chestPlateGeo = new THREE.BoxGeometry(0.55, 0.5, 0.1);
    const chestPlate = new THREE.Mesh(chestPlateGeo, darkMaterial);
    chestPlate.position.set(0, 1.45, 0.23);
    group.add(chestPlate);

    // Chest reactor light
    const reactorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    reactorGeo.rotateX(Math.PI / 2);
    const reactor = new THREE.Mesh(reactorGeo, glowMaterial);
    reactor.position.set(0, 1.45, 0.28);
    group.add(reactor);

    // 2. Jetpack / Oxygen Backpack
    const packGeo = new THREE.BoxGeometry(0.5, 0.65, 0.25);
    const pack = new THREE.Mesh(packGeo, darkMaterial);
    pack.position.set(0, 1.4, -0.32);
    group.add(pack);

    // Thruster nozzles
    const thrusterGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.2, 12);
    const leftNozzle = new THREE.Mesh(thrusterGeo, darkMaterial);
    leftNozzle.position.set(-0.16, 1.05, -0.32);
    const rightNozzle = new THREE.Mesh(thrusterGeo, darkMaterial);
    rightNozzle.position.set(0.16, 1.05, -0.32);
    group.add(leftNozzle);
    group.add(rightNozzle);

    // Thruster glow cones
    const plumeGeo = new THREE.ConeGeometry(0.09, 0.35, 12);
    plumeGeo.rotateX(Math.PI);
    const leftPlume = new THREE.Mesh(plumeGeo, glowMaterial);
    leftPlume.position.set(-0.16, 0.85, -0.32);
    const rightPlume = new THREE.Mesh(plumeGeo, glowMaterial);
    rightPlume.position.set(0.16, 0.85, -0.32);
    group.add(leftPlume);
    group.add(rightPlume);

    // 3. Helmet & Visor
    const helmetGeo = new THREE.SphereGeometry(0.35, 24, 20);
    const helmet = new THREE.Mesh(helmetGeo, suitMaterial);
    helmet.position.set(0, 2.05, 0);
    group.add(helmet);

    const visorGeo = new THREE.SphereGeometry(0.28, 20, 16, 0, Math.PI);
    const visor = new THREE.Mesh(visorGeo, goldVisorMaterial);
    visor.position.set(0, 2.05, 0.12);
    visor.rotation.y = -Math.PI / 2;
    group.add(visor);

    // 4. Limbs (Pivots for animation)
    // Left Arm
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.46, 1.7, 0);
    const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.65, 12);
    armGeo.translate(0, -0.3, 0);
    const leftArm = new THREE.Mesh(armGeo, suitMaterial);
    leftArmPivot.add(leftArm);
    group.add(leftArmPivot);

    // Right Arm
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.46, 1.7, 0);
    const rightArm = new THREE.Mesh(armGeo, suitMaterial);
    rightArmPivot.add(rightArm);
    group.add(rightArmPivot);

    // Left Leg
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.2, 0.9, 0);
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 12);
    legGeo.translate(0, -0.4, 0);
    const leftLeg = new THREE.Mesh(legGeo, darkMaterial);
    leftLegPivot.add(leftLeg);
    // Boot
    const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.32);
    const leftBoot = new THREE.Mesh(bootGeo, suitMaterial);
    leftBoot.position.set(0, -0.76, 0.05);
    leftLegPivot.add(leftBoot);
    group.add(leftLegPivot);

    // Right Leg
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.2, 0.9, 0);
    const rightLeg = new THREE.Mesh(legGeo, darkMaterial);
    rightLegPivot.add(rightLeg);
    const rightBoot = new THREE.Mesh(bootGeo, suitMaterial);
    rightBoot.position.set(0, -0.76, 0.05);
    rightLegPivot.add(rightBoot);
    group.add(rightLegPivot);

    // Shadow blob projector underneath
    const shadowGeo = new THREE.CircleGeometry(0.6, 24);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    shadowBlob.position.y = 0.02;
    group.add(shadowBlob);

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
      rightPlume,
      shadowBlob
    };
  }

  update(delta, input) {
    this.handleMovement(delta, input);
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
    const moveZ = input.moveVector.y;

    const hasInput = Math.hypot(moveX, moveZ) > 0.05;
    this.isMoving = hasInput;
    this.isRunning = input.isSprinting;

    // Movement speed
    const baseSpeed = this.isRunning
      ? avatarConfig.movement.runSpeed
      : avatarConfig.movement.walkSpeed;

    if (hasInput) {
      // Calculate movement direction relative to camera yaw
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.orbitAngles.yaw
      );
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.orbitAngles.yaw
      );

      this.direction
        .set(0, 0, 0)
        .addScaledVector(right, moveX)
        .addScaledVector(forward, -moveZ)
        .normalize();

      // Desired velocity
      const targetVelocity = this.direction.clone().multiplyScalar(baseSpeed);
      this.velocity.lerp(targetVelocity, avatarConfig.movement.acceleration * delta);

      // Smooth rotation toward movement direction
      const angle = Math.atan2(this.direction.x, this.direction.z);
      const currentRotation = this.root.rotation.y;
      
      // Shortest angle difference
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.root.rotation.y += diff * Math.min(1.0, avatarConfig.movement.rotationSpeed * delta);
    } else {
      // Decelerate
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), avatarConfig.movement.deceleration * delta);
    }

    // Jetpack jump/hover
    if (input.isJumping) {
      this.verticalVelocity = Math.min(this.verticalVelocity + 24 * delta, 8.0);
      this.isAirborne = true;
    } else {
      // Gravity toward space platform level (y = 0)
      if (this.root.position.y > 0) {
        this.verticalVelocity -= 18 * delta;
      } else {
        this.verticalVelocity = 0;
        this.root.position.y = 0;
        this.isAirborne = false;
      }
    }

    // Apply translation
    this.root.position.x += this.velocity.x * delta;
    this.root.position.z += this.velocity.z * delta;
    this.root.position.y = Math.max(0, this.root.position.y + this.verticalVelocity * delta);

    // Boundary constraint: Keep within cosmic arena bounds
    const maxRadius = 130;
    const currentDist = Math.hypot(this.root.position.x, this.root.position.z);
    if (currentDist > maxRadius) {
      const factor = maxRadius / currentDist;
      this.root.position.x *= factor;
      this.root.position.z *= factor;
      this.velocity.multiplyScalar(0.5);
    }
  }

  animateProceduralAvatar(delta) {
    const parts = this.proceduralParts;
    const speed = this.velocity.length();

    if (this.isMoving && !this.isAirborne) {
      // Running / Walking cycle
      const cycleFrequency = this.isRunning ? 14 : 9;
      this.walkCycleTime += delta * cycleFrequency;

      const swingAngle = Math.sin(this.walkCycleTime) * (this.isRunning ? 0.75 : 0.45);

      // Arm & Leg counter-oscillation
      parts.leftLegPivot.rotation.x = swingAngle;
      parts.rightLegPivot.rotation.x = -swingAngle;
      parts.leftArmPivot.rotation.x = -swingAngle * 0.8;
      parts.rightArmPivot.rotation.x = swingAngle * 0.8;

      // Subtle torso vertical bobbing
      const bob = Math.abs(Math.cos(this.walkCycleTime)) * 0.08;
      parts.torso.position.y = 1.35 + bob;
      parts.helmet.position.y = 2.05 + bob;

      // Thrusters subtle idle flame
      const plumeScale = 0.8 + Math.sin(this.walkCycleTime * 2) * 0.2;
      parts.leftPlume.scale.set(plumeScale, plumeScale, plumeScale);
      parts.rightPlume.scale.set(plumeScale, plumeScale, plumeScale);
    } else if (this.isAirborne) {
      // Jetpack flight pose
      parts.leftLegPivot.rotation.x = 0.3;
      parts.rightLegPivot.rotation.x = 0.4;
      parts.leftArmPivot.rotation.x = -0.5;
      parts.rightArmPivot.rotation.x = -0.5;

      // Blazing thrusters
      const boostScale = 1.6 + Math.random() * 0.4;
      parts.leftPlume.scale.set(boostScale, boostScale * 1.5, boostScale);
      parts.rightPlume.scale.set(boostScale, boostScale * 1.5, boostScale);
    } else {
      // Smooth reset to gentle floating/breathing idle
      this.walkCycleTime += delta * 2.0;
      const breathe = Math.sin(this.walkCycleTime) * 0.03;

      parts.leftLegPivot.rotation.x *= 0.85;
      parts.rightLegPivot.rotation.x *= 0.85;
      parts.leftArmPivot.rotation.x *= 0.85;
      parts.rightArmPivot.rotation.x *= 0.85;

      parts.torso.position.y = 1.35 + breathe;
      parts.helmet.position.y = 2.05 + breathe;

      parts.leftPlume.scale.set(0.4, 0.4, 0.4);
      parts.rightPlume.scale.set(0.4, 0.4, 0.4);
    }
  }

  updateGLTFAnimationState() {
    const idleName = (avatarConfig.animations.idleClipName || '').toLowerCase();
    const walkName = (avatarConfig.animations.walkClipName || '').toLowerCase();
    const runName = (avatarConfig.animations.runClipName || '').toLowerCase();

    let targetAction = this.actions[idleName];

    if (this.isMoving) {
      if (this.isRunning && this.actions[runName]) {
        targetAction = this.actions[runName];
      } else if (this.actions[walkName]) {
        targetAction = this.actions[walkName];
      }
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
    // Calculate spherical camera offset around the avatar based on orbit angles
    const pitch = Math.max(-0.25, Math.min(1.2, this.orbitAngles.pitch));
    const yaw = this.orbitAngles.yaw;

    const horizontalDist = this.zoomDistance * Math.cos(pitch);
    const verticalDist = this.zoomDistance * Math.sin(pitch);

    const offsetX = Math.sin(yaw) * horizontalDist;
    const offsetZ = Math.cos(yaw) * horizontalDist;
    const offsetY = Math.max(1.0, verticalDist);

    // Target camera position
    this.cameraTargetPos.set(
      this.root.position.x + offsetX,
      this.root.position.y + offsetY + 1.2,
      this.root.position.z + offsetZ
    );

    // Smoothly interpolate current camera position
    this.cameraCurrentPos.lerp(this.cameraTargetPos, Math.min(1.0, delta * 8.0));
    this.camera.position.copy(this.cameraCurrentPos);

    // Look at character chest/head height
    this.cameraLookTarget.set(
      this.root.position.x,
      this.root.position.y + 1.5,
      this.root.position.z
    );
    this.camera.lookAt(this.cameraLookTarget);
  }

  // Orbit camera drag from mouse or touch
  rotateCamera(deltaYaw, deltaPitch) {
    this.orbitAngles.yaw -= deltaYaw;
    this.orbitAngles.pitch += deltaPitch;
  }

  // Zoom camera
  zoom(deltaZoom) {
    this.zoomDistance = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.zoomDistance + deltaZoom)
    );
  }

  // Teleport / Warp to specific coordinates (used by quick nav or landing)
  warpTo(x, y, z, facingAngle = null) {
    this.root.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    if (facingAngle !== null) {
      this.root.rotation.y = facingAngle;
      this.orbitAngles.yaw = facingAngle;
    }
    // Snap camera closer immediately to prevent awkward lerp across world
    this.cameraCurrentPos.copy(this.root.position).add(this.cameraOffset);
  }
}
