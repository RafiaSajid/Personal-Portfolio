import * as THREE from 'three';
import { portfolioData, skillOrbitGroups } from '../data/portfolioData.js';

export class LandmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.landmarks = [];
    this.raycastTargets = [];
    this.activeLandmark = null;
    this.approachedSkillGroup = null;
    this.time = 0;
    this.reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
    this.reduceMotion = Boolean(this.reduceMotionQuery?.matches);
    this.reduceMotionQuery?.addEventListener?.('change', (event) => {
      this.reduceMotion = event.matches;
    });
    window.addEventListener('portfolio:skill-select', (event) => {
      this.selectSkillGroup(event.detail?.index ?? 0);
    });

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
        platform,
        labelSprite,
        pulseRing,
        activationRadius: 9.5
      };

      this.landmarks.push(landmarkObj);
      this.raycastTargets.push(visuals.hitMesh || visuals.core);
      // Link back to landmarkObj for raycasting click
      (visuals.hitMesh || visuals.core).userData.landmark = landmarkObj;
      visuals.skillPlanets?.forEach((planet, skillGroupIndex) => {
        planet.mesh.userData.landmark = landmarkObj;
        planet.mesh.userData.skillGroupIndex = skillGroupIndex;
        this.raycastTargets.push(planet.mesh);
      });
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
    ctx.fillStyle = window.portfolioTheme?.palette?.three?.labelBackground || 'rgba(6, 11, 26, 0.9)';
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
    ctx.fillStyle = window.portfolioTheme?.palette?.three?.labelText || '#ffffff';
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
    sprite.userData.label = { code, title, color: hexColor };
    return sprite;
  }

  createSkillLabel(title, hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const color = `#${hexColor.toString(16).padStart(6, '0')}`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = window.portfolioTheme?.palette?.three?.labelText || '#ffffff';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), 256, 48, 470);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(3.15, 0.6, 1);
    sprite.userData.skillLabel = { title, color: hexColor };
    return sprite;
  }

  redrawSkillLabel(sprite, theme) {
    const label = sprite.userData.skillLabel;
    if (!label) return;
    const texture = sprite.material.map;
    const ctx = texture.image.getContext('2d');
    const color = `#${label.color.toString(16).padStart(6, '0')}`;
    ctx.clearRect(0, 0, 512, 96);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = theme.labelText;
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.title.toUpperCase(), 256, 48, 470);
    texture.needsUpdate = true;
  }

  applyTheme(theme) {
    if (!theme) return;
    this.themePulseOpacity = theme.pulseOpacity;
    this.themeActivePulseOpacity = theme.activePulseOpacity;
    const labelAppearance = `${theme.labelBackground}|${theme.labelText}`;
    const redrawLabels = labelAppearance !== this.labelAppearance;
    this.landmarks.forEach((item) => {
      item.platform.material.color.setHex(theme.platformColor);
      item.platform.material.roughness = theme.platformRoughness;
      item.platform.material.metalness = theme.platformMetalness;

      if (redrawLabels) {
        const texture = item.labelSprite.material.map;
        const ctx = texture.image.getContext('2d');
        ctx.clearRect(0, 0, 512, 160);
        ctx.fillStyle = theme.labelBackground;
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 128, 24);
        ctx.fill();
        const label = item.labelSprite.userData.label;
        const colorStr = '#' + label.color.toString(16).padStart(6, '0');
        ctx.lineWidth = 5;
        ctx.strokeStyle = colorStr;
        ctx.stroke();
        ctx.fillStyle = colorStr;
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillText(`\u2605 ${label.code}`, 42, 54);
        ctx.fillStyle = theme.labelText;
        ctx.font = 'bold 38px "Segoe UI", sans-serif';
        ctx.fillText(label.title, 42, 108);
        texture.needsUpdate = true;
        item.visuals?.skillPlanets?.forEach((planet) => this.redrawSkillLabel(planet.label, theme));
      }
    });
    this.labelAppearance = labelAppearance;
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

    // A compact controller-shaped core with six labeled planets in the existing scene.
    const coreGeo = new THREE.BoxGeometry(1.28, 0.46, 0.58);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x20364b,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.65,
      roughness: 0.4,
      metalness: 0.35
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const gripGeo = new THREE.SphereGeometry(0.32, 16, 12);
    [-1, 1].forEach((side) => {
      const grip = new THREE.Mesh(gripGeo, coreMat);
      grip.position.set(side * 0.48, -0.22, 0.03);
      grip.scale.set(0.8, 1.2, 0.85);
      group.add(grip);
    });
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const faceButtonGeo = new THREE.SphereGeometry(0.075, 12, 8);
    [[0.34, 0.1], [0.5, 0], [0.34, -0.1], [0.18, 0]].forEach(([x, y]) => {
      const faceButton = new THREE.Mesh(faceButtonGeo, buttonMat);
      faceButton.position.set(x, y, 0.33);
      group.add(faceButton);
    });
    const dpadGeo = new THREE.BoxGeometry(0.08, 0.26, 0.06);
    const dpadVertical = new THREE.Mesh(dpadGeo, buttonMat);
    dpadVertical.position.set(-0.35, 0.03, 0.32);
    const dpadHorizontal = new THREE.Mesh(dpadGeo, buttonMat);
    dpadHorizontal.rotation.z = Math.PI / 2;
    dpadHorizontal.position.copy(dpadVertical.position);
    group.add(dpadVertical, dpadHorizontal);

    // Tilted orbit path and data-driven category planets.
    const haloGeo = new THREE.TorusGeometry(4.25, 0.025, 8, 96);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.rotation.z = Math.PI / 8;
    group.add(halo);

    const planetColors = [0x38bdf8, 0xf59e0b, 0x34d399, 0x60a5fa, 0xfb7185, 0xe2e8f0];
    const planetGeo = new THREE.SphereGeometry(0.43, 24, 16);
    const skillPlanets = skillOrbitGroups.map((skillGroup, index) => {
      const color = planetColors[index % planetColors.length];
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, roughness: 0.45, metalness: 0.12 });
      const mesh = new THREE.Mesh(planetGeo, material);
      mesh.userData.skillGroup = skillGroup.label;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.018, 6, 36),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
      );
      ring.rotation.x = Math.PI / 2.5;
      mesh.add(ring);
      const label = this.createSkillLabel(skillGroup.label, color);
      const phase = (index * Math.PI * 2) / skillOrbitGroups.length;
      mesh.position.set(Math.cos(phase) * 4.25, 0, Math.sin(phase) * 4.25);
      label.position.set(mesh.position.x, 0.82, mesh.position.z);
      group.add(mesh, label);
      return { mesh, label, phase, radius: 4.25 };
    });

    const hitGeo = new THREE.SphereGeometry(0.92, 16, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    group.add(hitMesh);

    parent.add(group);
    return { group, core, skillPlanets, halo, hitMesh, type: 'skills' };
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
        item.pulseRing.material.opacity = isNear
          ? (this.themeActivePulseOpacity ?? 0.75)
          : (this.themePulseOpacity ?? 0.35);
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
        const orbitTime = this.reduceMotion ? 0 : this.time;
        v.core.rotation.y = Math.sin(orbitTime * 0.35) * 0.12;
        v.halo.rotation.z = Math.PI / 8 + Math.sin(orbitTime * 0.18) * 0.08;
        v.skillPlanets.forEach((planet) => {
          const angle = -orbitTime * 0.22 + planet.phase;
          const x = Math.cos(angle) * planet.radius;
          const z = Math.sin(angle) * planet.radius;
          const y = Math.sin(angle * 1.4) * 0.42;
          planet.mesh.position.set(x, y, z);
          if (!this.reduceMotion) planet.mesh.rotation.y += delta * 0.28;
          planet.label.position.set(x, y + 0.82, z);
        });
        let nearestIndex = null;
        let nearestDistance = Infinity;
        v.skillPlanets.forEach((planet, index) => {
          const worldPosition = planet.mesh.getWorldPosition(new THREE.Vector3());
          const distance = worldPosition.distanceTo(playerPos);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        const approachedIndex = nearestDistance <= 2.4 ? nearestIndex : null;
        if (approachedIndex !== this.approachedSkillGroup) {
          this.approachedSkillGroup = approachedIndex;
          window.dispatchEvent(new CustomEvent('portfolio:skill-approach', { detail: { index: approachedIndex } }));
        }
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

  selectSkillGroup(index) {
    const skills = this.getLandmarkById('skills')?.visuals?.skillPlanets;
    if (!skills?.length) return;
    const selectedIndex = Math.max(0, Math.min(skills.length - 1, Number(index) || 0));
    skills.forEach((planet, planetIndex) => {
      const selected = planetIndex === selectedIndex;
      planet.mesh.scale.setScalar(selected ? 1.22 : 1);
      planet.mesh.material.emissiveIntensity = selected ? 1.05 : 0.42;
      planet.mesh.userData.selected = selected;
    });
    const focus = new THREE.Vector3();
    skills[selectedIndex].mesh.getWorldPosition(focus);
    focus.y += 0.5;
    window.dispatchEvent(new CustomEvent('portfolio:skill-focus', { detail: { x: focus.x, y: focus.y, z: focus.z } }));
  }

  getRaycastTargets() {
    return this.raycastTargets;
  }
}
