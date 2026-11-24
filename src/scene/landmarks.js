import * as THREE from 'three';
import { portfolioData, skillOrbitGroups } from '../data/portfolioData.js';

export class LandmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.homeGroup = new THREE.Group();
    this.homeGroup.name = 'Home exploration field';
    this.scene.add(this.homeGroup);
    this.landmarks = [];
    this.destinationLandmarks = [];
    this.raycastTargets = [];
    this.portalTargets = [];
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
      if (data.id === 'about' || data.id === 'projects' || data.id === 'skills') {
        visuals = this.buildPortalLandmark(group, data);
      } else if (data.id === 'education') {
        visuals = this.buildEducationLandmark(group, data);
      }

      // 3. Floating 3D Billboard Label
      const labelSprite = visuals.type === 'portal' ? null : this.createLabelSprite(data.label, data.title, data.color);
      if (labelSprite) {
        labelSprite.position.y = 4.2;
        group.add(labelSprite);
      }

      // 4. Ground beacon pulse ring
      const pulseRing = this.createPulseRing(data.color);
      group.add(pulseRing);

      this.homeGroup.add(group);

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
      if (visuals.type === 'portal') this.portalTargets.push(visuals);
      // Link back to landmarkObj for raycasting click
      (visuals.hitMesh || visuals.core).userData.landmark = landmarkObj;
      visuals.skillPlanets?.forEach((planet, skillGroupIndex) => {
        planet.mesh.userData.landmark = landmarkObj;
        planet.mesh.userData.skillGroupIndex = skillGroupIndex;
        this.raycastTargets.push(planet.mesh);
      });
    });
  }

  buildPortalLandmark(parent, data) {
    const portal = new THREE.Group();
    portal.name = `${data.id} portal`;
    portal.position.y = -1.55;
    portal.rotation.y = data.portalRotation || 0;
    const tint = data.color;
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x243443,
      emissive: tint,
      emissiveIntensity: 0.34,
      metalness: 0.72,
      roughness: 0.32
    });
    const rimMaterial = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.82 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.17, 12, 64), frameMaterial);
    arch.position.y = 2.65;
    portal.add(arch);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(2.14, 0.025, 8, 64), rimMaterial);
    innerRim.position.y = 2.65;
    portal.add(innerRim);

    const columnGeo = new THREE.CylinderGeometry(0.13, 0.18, 5.2, 12);
    [-2.42, 2.42].forEach((x) => {
      const column = new THREE.Mesh(columnGeo, frameMaterial);
      column.position.set(x, 2.6, 0);
      portal.add(column);
    });
    const threshold = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.12, 1.1),
      new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.45, roughness: 0.45 })
    );
    threshold.position.set(0, 0.06, 0.15);
    portal.add(threshold);

    const aperture = this.createPortalAperture(tint);
    aperture.position.set(0, 2.65, -0.18);
    portal.add(aperture);
    const axis = new THREE.Mesh(
      new THREE.TorusGeometry(1.52, 0.018, 6, 56),
      new THREE.MeshBasicMaterial({ color: 0xe8f2f8, transparent: true, opacity: 0.42 })
    );
    axis.position.set(0, 2.65, -0.08);
    axis.scale.set(1, 1.34, 1);
    portal.add(axis);

    const label = this.createSkillLabel(data.title.toUpperCase(), tint);
    label.position.set(0, 6.25, 0);
    label.scale.set(4.8, 0.88, 1);
    portal.add(label);
    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 5.2, 0.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.set(0, 2.65, 0);
    hitMesh.userData.destinationId = data.id;
    portal.add(hitMesh);
    parent.add(portal);
    return { group: portal, core: arch, hitMesh, aperture, openingProgress: null, type: 'portal', destinationId: data.id, rotationSpeed: data.id === 'projects' ? 0.12 : -0.1 };
  }

  createPortalAperture(hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 160, 8, 128, 160, 170);
    gradient.addColorStop(0, 'rgba(16, 35, 52, 0.96)');
    gradient.addColorStop(0.62, 'rgba(8, 21, 35, 0.94)');
    gradient.addColorStop(1, `#${hexColor.toString(16).padStart(6, '0')}55`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 36; i += 1) {
      ctx.fillStyle = `rgba(221, 238, 248, ${0.24 + Math.random() * 0.65})`;
      const size = Math.random() < 0.12 ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 320, size, 0, Math.PI * 2);
      ctx.fill();
    }
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(4.25, 5.1), material);
  }

  addSkillsDestination(position) {
    const data = portfolioData.landmarks.find((landmark) => landmark.id === 'skills');
    const destination = new THREE.Group();
    destination.name = 'Skills orbit environment';
    destination.position.set(position.x, 0, position.z);
    this.scene.add(destination);
    const platform = this.createLandingPlatform(data.color);
    platform.scale.set(6.8, 1, 6.8);
    destination.add(platform);
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(25, 0.035, 8, 112),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.32 })
    );
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = -1.1;
    destination.add(outerRing);
    const visuals = this.buildSkillsLandmark(destination, data);
    const landmark = { data: { ...data, position: { ...position } }, group: destination, visuals, platform, pulseRing: null, activationRadius: 32 };
    this.destinationLandmarks.push(landmark);
    visuals.skillPlanets.forEach((planet, index) => {
      planet.mesh.userData.landmark = landmark;
      planet.mesh.userData.skillGroupIndex = index;
      this.raycastTargets.push(planet.mesh);
    });
    landmark.exitPortal = this.addReturnPortal(destination, data.color);
    return landmark;
  }

  addReturnPortal(parent, color) {
    const root = new THREE.Group();
    root.name = 'Home return portal';
    root.position.set(0, 0, 25);
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.16, 12, 56),
      new THREE.MeshStandardMaterial({ color: 0x233342, emissive: color, emissiveIntensity: 0.26, roughness: 0.38, metalness: 0.7 })
    );
    frame.position.y = 2.55;
    root.add(frame);
    const aperture = this.createPortalAperture(color);
    aperture.position.set(0, 2.55, -0.16);
    root.add(aperture);
    root.userData.aperture = aperture;
    root.userData.openingProgress = null;
    const label = this.createSkillLabel('HOME', color);
    label.position.set(0, 5.8, 0);
    root.add(label);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, 2.55, 0);
    hit.userData.returnHomePortal = true;
    root.add(hit);
    this.raycastTargets.push(hit);
    parent.add(root);
    return root;
  }

  addProjectsDestination(position) {
    const center = new THREE.Group();
    center.name = 'Projects space gallery';
    center.position.set(position.x, 0, position.z);
    this.scene.add(center);
    const data = portfolioData.landmarks.find((landmark) => landmark.id === 'projects');
    const perimeter = new THREE.Mesh(
      new THREE.TorusGeometry(36, 0.035, 8, 128),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.28 })
    );
    perimeter.rotation.x = Math.PI / 2;
    perimeter.position.y = -1.18;
    center.add(perimeter);
    const projects = [...portfolioData.projects].sort((a, b) => (a.order || 99) - (b.order || 99));
    const colors = [0x8fc9e5, 0xe8c77b, 0x77c7b2, 0x91aee7, 0xd28c8c, 0xa3b8c4, 0xd6ad6f];
    const displayMeshes = [];
    const projectDisplays = [];
    projects.forEach((project, index) => {
      const angle = index * 2.399963229728653;
      const radius = 12 + (index % 2) * 5;
      const stand = new THREE.Group();
      stand.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      const tint = colors[index % colors.length];
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.55, 0.72, 20),
        new THREE.MeshStandardMaterial({ color: 0x111d29, emissive: tint, emissiveIntensity: 0.12, roughness: 0.68, metalness: 0.38 })
      );
      pedestal.position.y = -0.78;
      stand.add(pedestal);
      const coreGeo = index % 3 === 0
        ? new THREE.IcosahedronGeometry(1.25, 1)
        : index % 3 === 1 ? new THREE.DodecahedronGeometry(1.15, 0) : new THREE.OctahedronGeometry(1.2, 0);
      const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.34, roughness: 0.4, metalness: 0.26 }));
      core.position.y = 1.15;
      core.userData.projectId = project.id;
      core.userData.destinationId = 'projects';
      stand.add(core);
      const label = this.createProjectLabel(project.title, project.category, tint);
      label.position.set(0, 3.65, 0);
      stand.add(label);
      center.add(stand);
      displayMeshes.push(core);
      projectDisplays.push({ project, mesh: core });
    });
    const exitPortal = this.addReturnPortal(center, data.color);
    exitPortal.position.set(0, 0, 30);
    const landmark = { data: { ...data, position: { ...position } }, group: center, visuals: { type: 'projects-gallery', displayMeshes }, exitPortal, activationRadius: 44, projects, projectDisplays };
    displayMeshes.forEach((mesh) => {
      mesh.userData.landmark = landmark;
      this.raycastTargets.push(mesh);
    });
    return landmark;
  }

  addAboutDestination(position) {
    const station = new THREE.Group();
    station.name = 'About Me Orbital Research Station';
    station.position.set(position.x, 0, position.z);
    this.scene.add(station);

    const data = portfolioData.landmarks.find((landmark) => landmark.id === 'about') || {
      id: 'about',
      title: 'About Me',
      color: 0x8b5cf6
    };

    // 1. Orbital Station Deck Platform
    const platform = this.createLandingPlatform(data.color);
    platform.scale.set(7.5, 1, 7.5);
    station.add(platform);

    // Orbital ring structure encircling station
    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(26, 0.05, 8, 128),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.35 })
    );
    orbitRing.rotation.x = Math.PI / 2;
    orbitRing.position.y = -1.1;
    station.add(orbitRing);

    // Secondary floating structural truss
    const trussRing = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.03, 6, 96),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22 })
    );
    trussRing.rotation.x = Math.PI / 2.2;
    trussRing.position.y = 2.4;
    station.add(trussRing);

    // 2. Three Purposeful 3D Exhibits
    // Exhibit A: Academic Terminal (NED University studies & Gaming/Animation specialization)
    // Exhibit B: VR Simulation Rig (VR Games Hub, target-shooting mechanics, haptics)
    // Exhibit C: Character Animation Kinetic Stand (Blender 3D character animation & modeling)
    const exhibits = [
      {
        id: 'study',
        title: 'Academic Studies Terminal',
        subtitle: 'NED University • Gaming & Animation',
        category: 'ACADEMIC RECORD',
        position: { x: -8.5, y: 0, z: -4 },
        tint: 0x10b981,
        buildMesh: () => {
          const g = new THREE.Group();
          // Pedestal
          const ped = new THREE.Mesh(
            new THREE.CylinderGeometry(1.1, 1.4, 0.7, 16),
            new THREE.MeshStandardMaterial({ color: 0x111e24, roughness: 0.6, metalness: 0.4 })
          );
          ped.position.y = -0.75;
          g.add(ped);
          // Holographic terminal screen / angled console
          const screen = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 1.2, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, emissiveIntensity: 0.85, roughness: 0.2 })
          );
          screen.position.set(0, 1.2, 0);
          screen.rotation.x = -0.25;
          g.add(screen);
          // Floating academic crest / crystal
          const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.1 })
          );
          crystal.position.set(0, 2.3, 0);
          g.add(crystal);
          return { group: g, hit: screen };
        }
      },
      {
        id: 'vr',
        title: 'VR Simulation Rig',
        subtitle: 'VR Games Hub • Haptics & Mechanics',
        category: 'VR GAME WORK',
        position: { x: 0, y: 0, z: -9.5 },
        tint: 0x0ea5e9,
        buildMesh: () => {
          const g = new THREE.Group();
          // Circular simulation pod base
          const ped = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.6, 0.7, 24),
            new THREE.MeshStandardMaterial({ color: 0x0c1b2b, roughness: 0.5, metalness: 0.5 })
          );
          ped.position.y = -0.75;
          g.add(ped);
          // Dual gyroscopic sensor rings
          const r1 = new THREE.Mesh(
            new THREE.TorusGeometry(1.2, 0.06, 8, 36),
            new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.9 })
          );
          r1.position.y = 1.3;
          const r2 = r1.clone();
          r2.rotation.y = Math.PI / 2;
          g.add(r1, r2);
          // Central glowing simulation core
          const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.65, 1),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2, roughness: 0.1, metalness: 0.8 })
          );
          core.position.y = 1.3;
          g.add(core);
          return { group: g, hit: core };
        }
      },
      {
        id: 'animation',
        title: 'Animation Kinetic Stand',
        subtitle: 'Blender 3D Character & Motion',
        category: '3D & MOTION TOOLS',
        position: { x: 8.5, y: 0, z: -4 },
        tint: 0xf59e0b,
        buildMesh: () => {
          const g = new THREE.Group();
          // Pedestal
          const ped = new THREE.Mesh(
            new THREE.CylinderGeometry(1.1, 1.4, 0.7, 16),
            new THREE.MeshStandardMaterial({ color: 0x23180c, roughness: 0.6, metalness: 0.4 })
          );
          ped.position.y = -0.75;
          g.add(ped);
          // Stylized character armature sculpt (proportions)
          const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.9, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.85, roughness: 0.3 })
          );
          torso.position.y = 1.15;
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.95 })
          );
          head.position.y = 1.95;
          g.add(torso, head);
          // Kinetic animation orbit ring
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, 0.04, 6, 32),
            new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 })
          );
          ring.position.y = 1.35;
          ring.rotation.x = Math.PI / 3;
          g.add(ring);
          return { group: g, hit: torso };
        }
      }
    ];

    const exhibitDisplays = [];
    const exhibitMeshes = [];

    exhibits.forEach((exhibit) => {
      const stand = new THREE.Group();
      stand.position.set(exhibit.position.x, 0, exhibit.position.z);
      const built = exhibit.buildMesh();
      stand.add(built.group);

      const label = this.createProjectLabel(exhibit.title, exhibit.category, exhibit.tint);
      label.position.set(0, 3.65, 0);
      stand.add(label);

      built.hit.userData.exhibitId = exhibit.id;
      built.hit.userData.destinationId = 'about';

      station.add(stand);
      exhibitMeshes.push(built.hit);
      exhibitDisplays.push({ exhibit, mesh: built.hit, group: stand });
    });

    // Return Portal back to home star field
    const exitPortal = this.addReturnPortal(station, data.color);
    exitPortal.position.set(0, 0, 24);

    const landmark = {
      data: { ...data, position: { ...position } },
      group: station,
      visuals: { type: 'about-station', displayMeshes: exhibitMeshes },
      exitPortal,
      activationRadius: 40,
      exhibitDisplays
    };

    this.destinationLandmarks.push(landmark);
    exhibitMeshes.forEach((mesh) => {
      mesh.userData.landmark = landmark;
      this.raycastTargets.push(mesh);
    });

    return landmark;
  }

  createProjectLabel(title, category, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(5, 13, 22, 0.86)';
    ctx.fillRect(12, 18, 488, 124);
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.font = '600 22px Segoe UI, sans-serif';
    ctx.fillText(category.toUpperCase(), 30, 55);
    ctx.fillStyle = '#f1f5f8';
    ctx.font = '600 27px Segoe UI, sans-serif';
    ctx.fillText(title, 30, 103, 450);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
    sprite.scale.set(5.1, 1.6, 1);
    return sprite;
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

      if (redrawLabels && item.labelSprite) {
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
    if (redrawLabels) {
      this.destinationLandmarks.forEach((item) => {
        if (item.platform) {
          item.platform.material.color.setHex(theme.platformColor);
          item.platform.material.roughness = theme.platformRoughness;
          item.platform.material.metalness = theme.platformMetalness;
        }
        item.visuals?.skillPlanets?.forEach((planet) => this.redrawSkillLabel(planet.label, theme));
      });
    }
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
    const haloGeo = new THREE.TorusGeometry(10.8, 0.035, 8, 112);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.rotation.z = Math.PI / 8;
    group.add(halo);

    const planetColors = [0x38bdf8, 0xf59e0b, 0x34d399, 0x60a5fa, 0xfb7185, 0xe2e8f0];
    const planetGeo = new THREE.SphereGeometry(0.68, 24, 16);
    const skillPlanets = skillOrbitGroups.map((skillGroup, index) => {
      const color = planetColors[index % planetColors.length];
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, roughness: 0.45, metalness: 0.12 });
      const mesh = new THREE.Mesh(planetGeo, material);
      mesh.userData.skillGroup = skillGroup.label;
      const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.025, 6, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
      );
      ring.rotation.x = Math.PI / 2.5;
      mesh.add(ring);
      const label = this.createSkillLabel(skillGroup.label, color);
      const phase = (index * Math.PI * 2) / skillOrbitGroups.length;
      mesh.position.set(Math.cos(phase) * 10.8, 0, Math.sin(phase) * 10.8);
      label.position.set(mesh.position.x, 0.82, mesh.position.z);
      group.add(mesh, label);
      return { mesh, label, phase, radius: 10.8 };
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
      } else if (v.type === 'portal') {
        v.group.children[1].rotation.z += delta * v.rotationSpeed;
        v.core.material.emissiveIntensity = 0.28 + Math.sin(this.time * 1.7) * 0.08;
        if (v.openingProgress !== null) {
          v.openingProgress = Math.min(1, v.openingProgress + delta * 2.8);
          const swell = Math.sin(v.openingProgress * Math.PI);
          v.aperture.scale.set(1 + swell * 0.09, 1 + swell * 0.09, 1);
          v.aperture.material.opacity = 0.72 + swell * 0.26;
          if (v.openingProgress >= 1) {
            v.openingProgress = null;
            v.aperture.scale.set(1, 1, 1);
            v.aperture.material.opacity = 0.88;
          }
        }
      }
    });

    this.destinationLandmarks.forEach((item) => {
      if (item.visuals.type !== 'skills') return;
      const orbitTime = this.reduceMotion ? 0 : this.time;
      item.visuals.core.rotation.y = Math.sin(orbitTime * 0.35) * 0.12;
      item.visuals.halo.rotation.z = Math.PI / 8 + Math.sin(orbitTime * 0.18) * 0.08;
      item.visuals.skillPlanets.forEach((planet) => {
        const angle = -orbitTime * 0.22 + planet.phase;
        const x = Math.cos(angle) * planet.radius;
        const z = Math.sin(angle) * planet.radius;
        const y = Math.sin(angle * 1.4) * 0.62;
        planet.mesh.position.set(x, y, z);
        if (!this.reduceMotion) planet.mesh.rotation.y += delta * 0.28;
        planet.label.position.set(x, y + 1.2, z);
      });
      const nearest = item.visuals.skillPlanets
        .map((planet, index) => ({ index, distance: planet.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(playerPos) }))
        .sort((a, b) => a.distance - b.distance)[0];
      const approachedIndex = nearest?.distance <= 3.4 ? nearest.index : null;
      if (approachedIndex !== this.approachedSkillGroup) {
        this.approachedSkillGroup = approachedIndex;
        window.dispatchEvent(new CustomEvent('portfolio:skill-approach', { detail: { index: approachedIndex } }));
      }
    });
    this.destinationLandmarks.forEach((item) => {
      const portal = item.exitPortal;
      if (portal?.userData.openingProgress == null) return;
      portal.userData.openingProgress = Math.min(1, portal.userData.openingProgress + delta * 2.8);
      const swell = Math.sin(portal.userData.openingProgress * Math.PI);
      portal.userData.aperture.scale.set(1 + swell * 0.09, 1 + swell * 0.09, 1);
      portal.userData.aperture.material.opacity = 0.72 + swell * 0.26;
      if (portal.userData.openingProgress >= 1) {
        portal.userData.openingProgress = null;
        portal.userData.aperture.scale.set(1, 1, 1);
        portal.userData.aperture.material.opacity = 0.88;
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
    return this.destinationLandmarks.find((landmark) => landmark.data.id === id) || this.landmarks.find(l => l.data.id === id);
  }

  getHomeLandmarkById(id) {
    return this.landmarks.find((landmark) => landmark.data.id === id);
  }

  triggerPortalOpening(destinationId, side = 'home') {
    if (side === 'home') {
      const homePortal = this.getHomeLandmarkById(destinationId)?.visuals;
      if (homePortal?.type === 'portal') homePortal.openingProgress = 0;
      return;
    }
    const destinationPortal = this.getLandmarkById(destinationId)?.exitPortal;
    if (destinationPortal) destinationPortal.userData.openingProgress = 0;
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
