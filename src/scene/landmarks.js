import * as THREE from 'three';
import { portfolioData } from '../data/portfolioData.js';

export class LandmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.landmarks = [];
    this.raycastTargets = [];
    this.activeLandmark = null;
    this.time = 0;

    this.init();
  }

  init() {
    portfolioData.landmarks.forEach((data) => {
      const group = new THREE.Group();
      group.position.set(data.position.x, data.position.y, data.position.z);
      group.userData = { ...data };

      // 1. Landing Platform beneath landmark
      const platform = this.createLandingPlatform(data.color);
      group.add(platform);

      // 2. Specialized Distinct Landmark Star Structure
      let visuals = null;
      if (data.id === 'about') {
        visuals = this.buildAboutLandmark(group, data);
      } else if (data.id === 'projects') {
        visuals = this.buildProjectsLandmark(group, data);
      } else if (data.id === 'education') {
        visuals = this.buildEducationLandmark(group, data);
      } else if (data.id === 'skills') {
        visuals = this.buildSkillsLandmark(group, data);
      }

      // 3. Floating 3D Billboard Label
      const labelSprite = this.createLabelSprite(data.label, data.title, data.color);
      labelSprite.position.y = 4.2;
      group.add(labelSprite);

      // 4. Ground beacon pulse ring
      const pulseRing = this.createPulseRing(data.color);
      group.add(pulseRing);

      this.scene.add(group);

      const landmarkObj = {
        data,
        group,
        visuals,
        labelSprite,
        pulseRing,
        activationRadius: 9.5
      };

      this.landmarks.push(landmarkObj);
      this.raycastTargets.push(visuals.hitMesh || visuals.core);
      // Link back to landmarkObj for raycasting click
      (visuals.hitMesh || visuals.core).userData.landmark = landmarkObj;
    });
  }

  createLandingPlatform(hexColor) {
    const geo = new THREE.CylinderGeometry(3.2, 3.8, 0.25, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x090e1f,
      roughness: 0.6,
      metalness: 0.4
    });
    const platform = new THREE.Mesh(geo, mat);
    platform.position.y = -1.35;
    platform.receiveShadow = true;

    // Glowing border rim
    const rimGeo = new THREE.RingGeometry(3.2, 3.45, 32);
    rimGeo.rotateX(-Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({
      color: hexColor,
      side: THREE.DoubleSide
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.13;
    platform.add(rim);

    return platform;
  }

  createPulseRing(hexColor) {
    const geo = new THREE.RingGeometry(4.0, 4.25, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.y = -1.2;
    return ring;
  }

  createLabelSprite(code, title, hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    // High contrast backdrop pill
    ctx.fillStyle = 'rgba(6, 11, 26, 0.88)';
    ctx.roundRect(16, 16, 480, 128, 24);
    ctx.fill();

    const colorStr = '#' + hexColor.toString(16).padStart(6, '0');
    ctx.lineWidth = 5;
    ctx.strokeStyle = colorStr;
    ctx.stroke();

    // Landmark code tag
    ctx.fillStyle = colorStr;
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(`★ ${code}`, 42, 54);

    // Main landmark title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Segoe UI", sans-serif';
    ctx.fillText(title, 42, 108);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.2, 1.9, 1);
    return sprite;
  }

  // Landmark 1: ABOUT ME (Violet Gyroscopic Star)
  buildAboutLandmark(parent, data) {
    const group = new THREE.Group();

    // Central core icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.3, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x7c3aed,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Gyroscopic Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.2, 0.08, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    group.add(ring1);

    // Gyroscopic Ring 2
    const ring2 = new THREE.Mesh(ring1Geo, ringMat);
    ring2.rotation.x = Math.PI / 2.5;
    group.add(ring2);

    // Orbiting satellite orbs
    const satellites = [];
    for (let i = 0; i < 3; i++) {
      const satGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const satMat = new THREE.MeshStandardMaterial({
        color: 0xd8b4fe,
        emissive: 0xa855f7,
        emissiveIntensity: 0.8
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      group.add(sat);
      satellites.push(sat);
    }

    // Invisible hit mesh for easy mouse clicking
    const hitGeo = new THREE.SphereGeometry(2.6, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    parent.add(group);
    return { group, core, ring1, ring2, satellites, hitMesh, type: 'about' };
  }

  // Landmark 2: PROJECTS (Sky Blue Crystalline Gate)
  buildProjectsLandmark(parent, data) {
    const group = new THREE.Group();

    // Octahedral crystalline core
    const coreGeo = new THREE.OctahedronGeometry(1.5, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer square ring
    const ringGeo = new THREE.TorusGeometry(2.5, 0.09, 4, 4);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Floating project holo-cubes
    const cubes = [];
    for (let i = 0; i < 4; i++) {
      const cubeGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
        wireframe: true
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      group.add(cube);
      cubes.push(cube);
    }

    const hitGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    parent.add(group);
    return { group, core, ring, cubes, hitMesh, type: 'projects' };
  }

  // Landmark 3: EDUCATION (Emerald Green Spire of Knowledge)
  buildEducationLandmark(parent, data) {
    const group = new THREE.Group();

    // Central prism pillar
    const coreGeo = new THREE.CylinderGeometry(0.4, 0.9, 2.4, 6);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.1,
      roughness: 0.3,
      metalness: 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Crown floating diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.7, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.3
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 1.8;
    group.add(diamond);

    // Ascending helical rings
    const rings = [];
    for (let i = 0; i < 2; i++) {
      const rGeo = new THREE.TorusGeometry(1.6 + i * 0.5, 0.06, 12, 36);
      const rMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const r = new THREE.Mesh(rGeo, rMat);
      r.position.y = (i - 0.5) * 0.8;
      group.add(r);
      rings.push(r);
    }

    const hitGeo = new THREE.SphereGeometry(2.6, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    parent.add(group);
    return { group, core, diamond, rings, hitMesh, type: 'education' };
  }

  // Landmark 4: SKILLS (Amber Gold Solar Prism)
  buildSkillsLandmark(parent, data) {
    const group = new THREE.Group();

    // Radiant core dodecahedron
    const coreGeo = new THREE.DodecahedronGeometry(1.4, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.3,
      roughness: 0.2,
      metalness: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Orbiting energy shards (representing different skill domains)
    const shards = [];
    for (let i = 0; i < 4; i++) {
      const shardGeo = new THREE.TetrahedronGeometry(0.4, 0);
      const shardMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      group.add(shard);
      shards.push(shard);
    }

    // Outer tilted pulse halo
    const haloGeo = new THREE.TorusGeometry(2.4, 0.07, 16, 48);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 3;
    group.add(halo);

    const hitGeo = new THREE.SphereGeometry(2.7, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    parent.add(group);
    return { group, core, shards, halo, hitMesh, type: 'skills' };
  }

  update(delta, playerPos, onProximityChanged) {
    this.time += delta;

    let closest = null;
    let closestDist = Infinity;

    this.landmarks.forEach((item) => {
      const dx = playerPos.x - item.data.position.x;
      const dz = playerPos.z - item.data.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < closestDist) {
        closestDist = dist;
        if (dist <= item.activationRadius) {
          closest = item;
        }
      }

      // Animate floating billboard sprite
      if (item.labelSprite) {
        item.labelSprite.position.y = 4.2 + Math.sin(this.time * 2 + item.data.position.z) * 0.15;
      }

      // Pulse ground ring
      if (item.pulseRing) {
        const isNear = dist <= item.activationRadius;
        item.pulseRing.material.opacity = isNear ? 0.75 : 0.35;
        item.pulseRing.scale.setScalar(1.0 + Math.sin(this.time * 2.5 + item.data.position.z) * 0.08);
      }

      // Specialized Landmark Animations
      const v = item.visuals;
      if (!v) return;

      if (v.type === 'about') {
        v.core.rotation.y += delta * 0.6;
        v.core.rotation.x += delta * 0.3;
        v.ring1.rotation.x += delta * 0.8;
        v.ring1.rotation.y += delta * 0.5;
        v.ring2.rotation.y += delta * 0.7;
        v.satellites.forEach((sat, idx) => {
          const angle = this.time * 1.5 + (idx * Math.PI * 2) / 3;
          sat.position.set(Math.cos(angle) * 2.5, Math.sin(angle * 1.5) * 0.6, Math.sin(angle) * 2.5);
        });
      } else if (v.type === 'projects') {
        v.core.rotation.y += delta * 0.8;
        v.ring.rotation.z += delta * 0.5;
        v.cubes.forEach((cube, idx) => {
          const angle = this.time * 1.2 + (idx * Math.PI * 2) / 4;
          cube.position.set(Math.cos(angle) * 2.3, Math.sin(this.time * 3 + idx) * 0.4, Math.sin(angle) * 2.3);
          cube.rotation.x += delta * 1.2;
          cube.rotation.y += delta * 1.5;
        });
      } else if (v.type === 'education') {
        v.core.rotation.y += delta * 0.5;
        v.diamond.rotation.y += delta * 1.2;
        v.diamond.position.y = 1.8 + Math.sin(this.time * 3) * 0.15;
        v.rings.forEach((r, idx) => {
          r.rotation.z += delta * (idx === 0 ? 0.7 : -0.7);
        });
      } else if (v.type === 'skills') {
        v.core.rotation.y += delta * 0.9;
        v.core.rotation.z += delta * 0.4;
        v.halo.rotation.z += delta * 0.6;
        v.shards.forEach((shard, idx) => {
          const angle = -this.time * 1.4 + (idx * Math.PI * 2) / 4;
          shard.position.set(Math.cos(angle) * 2.4, Math.sin(this.time * 2.5 + idx) * 0.5, Math.sin(angle) * 2.4);
          shard.rotation.x += delta * 1.5;
          shard.rotation.y += delta * 1.8;
        });
      }
    });

    if (closest !== this.activeLandmark) {
      this.activeLandmark = closest;
      if (onProximityChanged) {
        onProximityChanged(this.activeLandmark ? this.activeLandmark.data : null);
      }
    }
  }

  getLandmarkById(id) {
    return this.landmarks.find(l => l.data.id === id);
  }

  getRaycastTargets() {
    return this.raycastTargets;
  }
}
