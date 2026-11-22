import * as THREE from 'three';
import { portfolioData } from '../data/portfolioData.js';

export class LandmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.landmarks = [];
    this.interactiveObjects = [];
    this.activeLandmark = null;

    this.init();
  }

  init() {
    portfolioData.landmarks.forEach((data) => {
      if (data.id === 'spawn') return; // Spawn is handled by central plaza

      const group = new THREE.Group();
      group.position.set(data.position.x, data.position.y, data.position.z);
      group.userData = { ...data };

      // Build specialized visual geometry based on landmark type
      let visualComponents = null;
      if (data.type === 'station') {
        visualComponents = this.buildCommandHub(group, data);
      } else if (data.type === 'hangar') {
        visualComponents = this.buildOrbitalHangar(group, data);
      } else if (data.type === 'laboratory') {
        visualComponents = this.buildCyberLaboratory(group, data);
      } else if (data.type === 'relay') {
        visualComponents = this.buildDeepSpaceRelay(group, data);
      }

      // Add floating holographic text banner
      const banner = this.createHoloBanner(data.title, data.code, data.color);
      banner.position.y = 6.2;
      group.add(banner);

      // Add base glow beacon circle on platform floor
      const beaconFloor = this.createBeaconFloor(data.color);
      group.add(beaconFloor);

      // Proximity detection ring
      const proxRing = this.createProximityRing(data.color);
      group.add(proxRing);

      this.scene.add(group);

      this.landmarks.push({
        data,
        group,
        banner,
        beaconFloor,
        proxRing,
        visuals: visualComponents,
        activationRadius: 9.5
      });

      this.interactiveObjects.push(group);
    });
  }

  createHoloBanner(title, code, hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // Canvas background badge
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.roundRect(10, 10, 492, 140, 20);
    ctx.fill();

    // Glowing border
    const colorStr = '#' + hexColor.toString(16).padStart(6, '0');
    ctx.lineWidth = 6;
    ctx.strokeStyle = colorStr;
    ctx.stroke();

    // Code tag badge
    ctx.fillStyle = colorStr;
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(`[ ${code} ]`, 36, 52);

    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(title, 36, 105);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.5, 2.0, 1);
    return sprite;
  }

  createBeaconFloor(hexColor) {
    const geo = new THREE.CylinderGeometry(5.5, 6.2, 0.4, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.5,
      metalness: 0.8
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -0.2;
    mesh.receiveShadow = true;

    // Glowing rim
    const rimGeo = new THREE.RingGeometry(5.5, 5.8, 32);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      side: THREE.DoubleSide
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.02;
    mesh.add(rim);

    return mesh;
  }

  createProximityRing(hexColor) {
    const geo = new THREE.RingGeometry(8.5, 8.7, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.y = 0.05;
    return ring;
  }

  buildCommandHub(parent, data) {
    // Gyroscopic planetary observatory with spinning gimbal rings
    const hub = new THREE.Group();

    // Central glowing core orb
    const coreGeo = new THREE.SphereGeometry(1.4, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 2.8;
    hub.add(core);

    // Gimbal Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.3, 0.08, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.3
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.position.y = 2.8;
    hub.add(ring1);

    // Gimbal Ring 2
    const ring2Geo = new THREE.TorusGeometry(2.9, 0.08, 16, 48);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat);
    ring2.position.y = 2.8;
    ring2.rotation.x = Math.PI / 3;
    hub.add(ring2);

    // Three support spires
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const spireGeo = new THREE.CylinderGeometry(0.12, 0.25, 3.8, 12);
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.7,
        roughness: 0.4
      });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(Math.cos(angle) * 3.6, 1.9, Math.sin(angle) * 3.6);
      spire.rotation.z = Math.cos(angle) * -0.15;
      spire.rotation.x = Math.sin(angle) * 0.15;
      hub.add(spire);
    }

    parent.add(hub);
    return { hub, core, ring1, ring2 };
  }

  buildOrbitalHangar(parent, data) {
    // Futuristic hangar gate with holographic game project display screens
    const hangar = new THREE.Group();

    // Archway portal pylons
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3
    });
    const pylonGeo = new THREE.BoxGeometry(0.8, 5.0, 1.2);

    const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
    leftPylon.position.set(-3.5, 2.5, 0);
    hangar.add(leftPylon);

    const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
    rightPylon.position.set(3.5, 2.5, 0);
    hangar.add(rightPylon);

    // Arch header
    const archGeo = new THREE.BoxGeometry(7.8, 0.8, 1.2);
    const arch = new THREE.Mesh(archGeo, pylonMat);
    arch.position.set(0, 5.0, 0);
    hangar.add(arch);

    // Energy portal field (semi-transparent glowing plane)
    const portalGeo = new THREE.PlaneGeometry(6.2, 4.4);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 2.4, 0);
    hangar.add(portal);

    // Floating Project Hologram cubes
    const holoCubes = [];
    for (let i = 0; i < 3; i++) {
      const cubeGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
        wireframe: true
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set((i - 1) * 2.2, 2.4, 1.8);
      hangar.add(cube);
      holoCubes.push(cube);
    }

    parent.add(hangar);
    return { hangar, portal, holoCubes };
  }

  buildCyberLaboratory(parent, data) {
    // Quantum crystal matrix with floating shards & glowing conduits
    const lab = new THREE.Group();

    // Central levitating crystal
    const crystalGeo = new THREE.OctahedronGeometry(1.6, 1);
    crystalGeo.scale(0.8, 1.8, 0.8);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: false
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3.0;
    lab.add(crystal);

    // Orbiting mini crystals
    const shards = [];
    for (let i = 0; i < 5; i++) {
      const shardGeo = new THREE.OctahedronGeometry(0.35, 0);
      const shardMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.6
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      lab.add(shard);
      shards.push(shard);
    }

    parent.add(lab);
    return { lab, crystal, shards };
  }

  buildDeepSpaceRelay(parent, data) {
    // Parabolic communications antenna dish & telemetry rings
    const relay = new THREE.Group();

    // Base pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.9, 2.5, 16);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 1.25;
    relay.add(pedestal);

    // Parabolic dish
    const dishGeo = new THREE.SphereGeometry(2.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.8);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2,
      side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 3.0;
    dish.rotation.x = -Math.PI / 3.5;
    relay.add(dish);

    // Transmitter feed horn needle
    const needleGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.8, 8);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.9
    });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.set(0, 3.4, 0.8);
    needle.rotation.x = -Math.PI / 3.5;
    relay.add(needle);

    // Glowing signal broadcast beacon
    const beaconLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
    beaconLight.position.set(0, 3.8, 1.2);
    relay.add(beaconLight);

    parent.add(relay);
    return { relay, dish, beaconLight };
  }

  update(delta, playerPosition, onProximityChanged) {
    let closestLandmark = null;
    let closestDist = Infinity;

    this.landmarks.forEach((item) => {
      // Calculate distance to player
      const dx = playerPosition.x - item.data.position.x;
      const dz = playerPosition.z - item.data.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < closestDist) {
        closestDist = dist;
        if (dist <= item.activationRadius) {
          closestLandmark = item;
        }
      }

      // Proximity ring feedback
      if (item.proxRing) {
        const isNear = dist <= item.activationRadius;
        item.proxRing.material.opacity = isNear ? 0.8 : 0.25;
        if (isNear) {
          item.proxRing.rotation.z += delta * 1.5;
        }
      }

      // Floating banner subtle breathing & always faces camera
      if (item.banner) {
        item.banner.position.y = 6.2 + Math.sin(Date.now() * 0.002 + item.data.position.x) * 0.2;
      }

      // Animate unique landmark visual parts
      const visuals = item.visuals;
      if (!visuals) return;

      if (item.data.type === 'station') {
        visuals.ring1.rotation.x += delta * 0.8;
        visuals.ring1.rotation.y += delta * 0.5;
        visuals.ring2.rotation.y += delta * 0.9;
        visuals.ring2.rotation.z += delta * 0.6;
        visuals.core.rotation.y += delta * 0.3;
      } else if (item.data.type === 'hangar') {
        visuals.portal.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.15;
        visuals.holoCubes.forEach((cube, idx) => {
          cube.rotation.x += delta * (0.8 + idx * 0.2);
          cube.rotation.y += delta * (0.6 + idx * 0.3);
          cube.position.y = 2.4 + Math.sin(Date.now() * 0.0025 + idx) * 0.25;
        });
      } else if (item.data.type === 'laboratory') {
        visuals.crystal.rotation.y += delta * 0.7;
        visuals.crystal.position.y = 3.0 + Math.sin(Date.now() * 0.002) * 0.2;
        visuals.shards.forEach((shard, idx) => {
          const shardAngle = Date.now() * 0.0015 * (idx % 2 === 0 ? 1 : -1) + (idx * Math.PI * 2) / 5;
          const shardRadius = 2.5 + Math.sin(Date.now() * 0.002 + idx) * 0.3;
          shard.position.set(
            Math.cos(shardAngle) * shardRadius,
            2.8 + Math.sin(Date.now() * 0.003 + idx) * 0.5,
            Math.sin(shardAngle) * shardRadius
          );
          shard.rotation.x += delta * 1.2;
          shard.rotation.y += delta * 1.5;
        });
      } else if (item.data.type === 'relay') {
        visuals.dish.rotation.z += delta * 0.2;
        if (visuals.beaconLight) {
          visuals.beaconLight.intensity = 1.5 + Math.sin(Date.now() * 0.008) * 1.0;
        }
      }
    });

    // Check proximity change
    if (closestLandmark !== this.activeLandmark) {
      this.activeLandmark = closestLandmark;
      if (onProximityChanged) {
        onProximityChanged(this.activeLandmark ? this.activeLandmark.data : null);
      }
    }
  }
}
