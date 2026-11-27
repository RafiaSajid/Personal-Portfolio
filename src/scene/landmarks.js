import * as THREE from 'three';
import { portfolioData, skillOrbitGroups } from '../data/portfolioData.js';
import { createPlanet, makeGlowTexture } from './environments.js';

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
    portal.scale.setScalar(1.45); // larger, easier to spot from the spawn view
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
    platform.scale.set(9.2, 1, 9.2);
    destination.add(platform);
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(31, 0.035, 8, 112),
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
    landmark.exitPortal.position.set(0, 0, 33);
    landmark.spawnZ = 25;
    return landmark;
  }

  addReturnPortal(parent, color) {
    const root = new THREE.Group();
    root.name = 'Home return portal';
    root.position.set(0, 0, 25);
    root.rotation.y = Math.PI; // aperture faces the interior of the destination
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
    center.name = 'Projects mission-archive station';
    center.position.set(position.x, 0, position.z);
    this.scene.add(center);
    const data = portfolioData.landmarks.find((landmark) => landmark.id === 'projects');

    // Station deck: circular gridded floor, glowing rim and light posts.
    const deckCanvas = document.createElement('canvas');
    deckCanvas.width = deckCanvas.height = 512;
    const dctx = deckCanvas.getContext('2d');
    dctx.fillStyle = '#08130f';
    dctx.fillRect(0, 0, 512, 512);
    dctx.strokeStyle = 'rgba(111,209,176,0.3)';
    dctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 32) {
      dctx.beginPath(); dctx.moveTo(i, 0); dctx.lineTo(i, 512); dctx.stroke();
      dctx.beginPath(); dctx.moveTo(0, i); dctx.lineTo(512, i); dctx.stroke();
    }
    const deckTex = new THREE.CanvasTexture(deckCanvas);
    deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
    deckTex.repeat.set(5, 5);
    deckTex.colorSpace = THREE.SRGBColorSpace;
    const deck = new THREE.Mesh(
      new THREE.CircleGeometry(40, 96),
      new THREE.MeshStandardMaterial({ map: deckTex, color: 0xffffff, roughness: 0.55, metalness: 0.55 })
    );
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = -1.18;
    deck.receiveShadow = true;
    center.add(deck);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(40, 0.16, 10, 128),
      new THREE.MeshStandardMaterial({ color: 0x14202c, emissive: data.color, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0.6 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -1.1;
    center.add(rim);
    const postCount = 24;
    const posts = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1b2a38, emissive: data.color, emissiveIntensity: 0.5 }),
      postCount
    );
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < postCount; i += 1) {
      const a = (i / postCount) * Math.PI * 2;
      matrix.makeTranslation(Math.cos(a) * 40, -0.05, Math.sin(a) * 40);
      posts.setMatrixAt(i, matrix);
    }
    center.add(posts);

    const projects = [...portfolioData.projects].sort((a, b) => (a.order || 99) - (b.order || 99));
    const colors = [0x8fc9e5, 0xe8c77b, 0x77c7b2, 0x91aee7, 0xd28c8c, 0xa3b8c4, 0xd6ad6f];
    const displayMeshes = [];
    const projectDisplays = [];
    this.projectExhibits = [];

    // Two concentric arcs; the gap at +z is where the return portal sits.
    const innerCount = Math.min(5, projects.length);
    const rings = [
      { r: 15, items: projects.slice(0, innerCount) },
      { r: 26, items: projects.slice(innerCount) }
    ];
    rings.forEach((ring, ringIndex) => {
      const m = ring.items.length;
      ring.items.forEach((project, i) => {
        const index = projects.indexOf(project);
        const arc = 2 * Math.PI - 1.1;
        const angle = Math.PI / 2 + 0.55 + (m === 1 ? arc / 2 : (i * arc) / (m - 1)) + (ringIndex ? 0.2 : 0);
        const x = Math.cos(angle) * ring.r;
        const z = Math.sin(angle) * ring.r;
        const tint = colors[index % colors.length];
        const stand = new THREE.Group();
        stand.position.set(x, 0, z);
        stand.rotation.y = Math.atan2(-x, -z);
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.9, 0.5, 24),
          new THREE.MeshStandardMaterial({ color: 0x0e1822, emissive: tint, emissiveIntensity: 0.18, roughness: 0.5, metalness: 0.6 })
        );
        pedestal.position.y = -0.9;
        stand.add(pedestal);
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
          new THREE.MeshBasicMaterial({ color: tint })
        );
        stem.position.y = -0.1;
        stand.add(stem);

        const cardTexture = this.createProjectCardTexture(project, tint);
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(4.2, 2.36),
          new THREE.MeshBasicMaterial({ map: cardTexture, toneMapped: false, transparent: true })
        );
        screen.position.y = 2.2;
        screen.userData.projectId = project.id;
        screen.userData.destinationId = 'projects';
        stand.add(screen);
        const frame = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(4.36, 2.52, 0.08)),
          new THREE.LineBasicMaterial({ color: tint })
        );
        frame.position.set(0, 2.2, -0.02);
        stand.add(frame);
        const backGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(5.4, 3.3),
          new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        backGlow.position.set(0, 2.2, -0.08);
        stand.add(backGlow);

        center.add(stand);
        displayMeshes.push(screen);
        projectDisplays.push({ project, mesh: screen });
        const exhibit = { project, screen, stand, cardTexture, tint, video: null, videoTexture: null, thumbLoaded: false };
        exhibit.videoSrc = /\.(mp4|webm)(\?.*)?$/i.test(project.videoUrl || '') ? project.videoUrl : null;
        this.projectExhibits.push(exhibit);
        this.loadProjectThumbnail(exhibit);
      });
    });

    const exitPortal = this.addReturnPortal(center, data.color);
    exitPortal.position.set(0, 0, 41);
    const landmark = { spawnZ: 32, data: { ...data, position: { ...position } }, group: center, visuals: { type: 'projects-gallery', displayMeshes }, exitPortal, activationRadius: 44, projects, projectDisplays };
    displayMeshes.forEach((mesh) => {
      mesh.userData.landmark = landmark;
      this.raycastTargets.push(mesh);
    });
    return landmark;
  }

  drawProjectCard(exhibit, image = null) {
    const { project, tint, cardTexture } = exhibit;
    const canvas = cardTexture.image;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const hex = `#${tint.toString(16).padStart(6, '0')}`;
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0f0b16');
    bg.addColorStop(1, '#1d1424');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (image) {
      const scale = Math.max(w / image.width, h / image.height);
      const iw = image.width * scale, ih = image.height * scale;
      ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
      const fade = ctx.createLinearGradient(0, h * 0.35, 0, h);
      fade.addColorStop(0, 'rgba(4,10,16,0)');
      fade.addColorStop(1, 'rgba(4,10,16,0.92)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.strokeStyle = hex;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);

    // Category chip
    ctx.font = '700 22px "Segoe UI", sans-serif';
    const cat = project.category.toUpperCase();
    const cw = ctx.measureText(cat).width + 32;
    ctx.fillStyle = hex;
    ctx.fillRect(28, 26, cw, 36);
    ctx.fillStyle = '#04101a';
    ctx.fillText(cat, 44, 52);

    // Title (wrapped, max 3 lines)
    ctx.fillStyle = '#f4f8fb';
    ctx.font = '800 44px "Segoe UI", sans-serif';
    const words = project.title.split(' ');
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - 64 && line) { lines.push(line); line = word; } else { line = test; }
    });
    lines.push(line);
    const shown = lines.slice(0, 3);
    const baseY = image ? h - 96 - (shown.length - 1) * 50 : 130;
    shown.forEach((l, i) => ctx.fillText(l, 28, baseY + i * 50, w - 56));

    // Technology tags
    ctx.font = '600 20px "Segoe UI", sans-serif';
    let tx = 28;
    const ty = h - 40;
    (project.technologies || []).slice(0, 5).forEach((tech) => {
      const tw = ctx.measureText(tech).width + 24;
      if (tx + tw > w - 20) return;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(tx, ty - 24, tw, 32);
      ctx.strokeStyle = hex;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx, ty - 24, tw, 32);
      ctx.fillStyle = '#dbe7ef';
      ctx.fillText(tech, tx + 12, ty);
      tx += tw + 10;
    });
    cardTexture.needsUpdate = true;
  }

  createProjectCardTexture(project, tint) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 432;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.drawProjectCard({ project, tint, cardTexture: texture });
    return texture;
  }

  loadProjectThumbnail(exhibit) {
    const src = exhibit.project.thumbnail;
    if (!src) return;
    const img = new Image();
    img.onload = () => { exhibit.thumbLoaded = true; this.drawProjectCard(exhibit, img); };
    img.onerror = () => { /* missing image: keep the generated card */ };
    img.src = src;
  }

  /** Play project videos only while the player is near and the station is active. */
  updateProjectMedia(playerPos) {
    const exhibits = this.projectExhibits;
    if (!exhibits?.length) return;
    const area = this.destinationLandmarks.find((l) => l.data.id === 'projects');
    const active = Boolean(area?.group.visible);
    exhibits.forEach((ex) => {
      if (!ex.videoSrc) return;
      const near = active && ex.stand.getWorldPosition(this._tmpVec || (this._tmpVec = new THREE.Vector3())).distanceTo(playerPos) < 16;
      if (near) {
        if (!ex.video) {
          const v = document.createElement('video');
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
          v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
          v.src = ex.videoSrc;
          ex.video = v;
          ex.videoTexture = new THREE.VideoTexture(v);
          ex.videoTexture.colorSpace = THREE.SRGBColorSpace;
        }
        if (ex.video.paused) ex.video.play().catch(() => {});
        if (ex.video.readyState >= 2 && ex.screen.material.map !== ex.videoTexture) {
          ex.screen.material.map = ex.videoTexture;
          ex.screen.material.needsUpdate = true;
        }
      } else if (ex.video) {
        this.releaseExhibitVideo(ex);
      }
    });
  }

  releaseExhibitVideo(ex) {
    ex.video.pause();
    ex.video.removeAttribute('src');
    ex.video.load();
    ex.videoTexture?.dispose();
    ex.screen.material.map = ex.cardTexture;
    ex.screen.material.needsUpdate = true;
    ex.video = null;
    ex.videoTexture = null;
  }

  addAboutDestination(position) {
    const station = new THREE.Group();
    station.name = 'About Me Orbital Research Station';
    station.position.set(position.x, 0, position.z);
    this.scene.add(station);

    const data = portfolioData.landmarks.find((landmark) => landmark.id === 'about') || {
      id: 'about',
      title: 'About Me',
      color: 0xd06aa8
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
      new THREE.MeshBasicMaterial({ color: 0xf2b45a, transparent: true, opacity: 0.22 })
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
        tint: 0x6fd1b0,
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
            new THREE.MeshStandardMaterial({ color: 0x6fd1b0, emissive: 0x0284c7, emissiveIntensity: 0.9 })
          );
          r1.position.y = 1.3;
          const r2 = r1.clone();
          r2.rotation.y = Math.PI / 2;
          g.add(r1, r2);
          // Central glowing simulation core
          const core = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.65, 1),
            new THREE.MeshStandardMaterial({ color: 0xf2b45a, emissive: 0x0284c7, emissiveIntensity: 1.2, roughness: 0.1, metalness: 0.8 })
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
      spawnZ: 15,
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
      color: 0xd06aa8,
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
      color: 0x6fd1b0,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer square ring
    const ringGeo = new THREE.TorusGeometry(2.5, 0.09, 4, 4);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf2b45a });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Floating project holo-cubes
    const cubes = [];
    for (let i = 0; i < 4; i++) {
      const cubeGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0xf2b45a,
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
    // A small solar system: a lit star at the centre and one planet per skill
    // category on its own inclined orbit (tilt group -> spinning pivot -> body).
    const group = new THREE.Group();
    group.position.y = 2.4;
    const glow = makeGlowTexture();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb347 })
    );
    group.add(core);
    const coronaA = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff9a2e, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    coronaA.scale.setScalar(13);
    const coronaB = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffe2a0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    coronaB.scale.setScalar(7.5);
    group.add(coronaA, coronaB);
    const starLight = new THREE.PointLight(0xffc680, 3.2, 0, 0);
    group.add(starLight);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(31, 0.02, 6, 160),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.12 })
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const planetDefs = [
      { r: 1.3, orbit: 8.5, incl: 0.05, ring: null, atmo: 0x6fb7ff, pal: { c1: 0x1d5fa8, c2: 0x2e9d6b, c3: 0xe8e2c8, rim: 0x7cc4ff }, bands: 4, seed: 3 },
      { r: 1.95, orbit: 13, incl: -0.08, ring: { color: 0xf0d6a8, inner: 1.5, outer: 2.2, tilt: 0.45 }, atmo: 0xffb36b, pal: { c1: 0xc4783a, c2: 0xf0c987, c3: 0x8a4b22, rim: 0xffc38a }, bands: 9, seed: 7 },
      { r: 1.45, orbit: 17.5, incl: 0.1, ring: null, atmo: 0x9fe8ff, pal: { c1: 0x3a8fb0, c2: 0xd8f6ff, c3: 0x7fd6e8, rim: 0xbff2ff }, bands: 5, seed: 11, ice: 1 },
      { r: 1.15, orbit: 22, incl: -0.06, ring: null, atmo: 0x7affd0, pal: { c1: 0x2a6a4b, c2: 0x7ad39a, c3: 0x1a3a2a, rim: 0x7affd0 }, bands: 3, seed: 17 },
      { r: 1.6, orbit: 26.5, incl: 0.09, ring: null, atmo: 0xff9a7a, pal: { c1: 0xb5483a, c2: 0xe08a64, c3: 0x6e2a22, rim: 0xffa58a }, bands: 6, seed: 23 },
      { r: 1.75, orbit: 30.5, incl: -0.04, ring: { color: 0xe6d9ae, inner: 1.4, outer: 2.0, tilt: 0.3 }, atmo: 0xf2e6bd, pal: { c1: 0xd9c89a, c2: 0xf2e6bd, c3: 0xa8935c, rim: 0xfff0c8 }, bands: 7, seed: 29 }
    ];
    const labelColors = [0xf2b45a, 0xf59e0b, 0x34d399, 0xe0709a, 0xfb7185, 0xe2e8f0];

    const skillPlanets = skillOrbitGroups.map((skillGroup, index) => {
      const def = planetDefs[index % planetDefs.length];
      const color = labelColors[index % labelColors.length];
      const tilt = new THREE.Group();
      tilt.rotation.x = def.incl;
      tilt.rotation.z = def.incl * 0.6;
      group.add(tilt);

      // Orbit path
      const pts = [];
      for (let i = 0; i <= 160; i += 1) {
        const a = (i / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * def.orbit, 0, Math.sin(a) * def.orbit));
      }
      const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 })
      );
      tilt.add(orbitLine);

      const pivot = new THREE.Group();
      tilt.add(pivot);
      const body = new THREE.Group();
      body.position.set(def.orbit, 0, 0);
      pivot.add(body);

      const planet = createPlanet({ radius: def.r, palette: def.pal, atmosphere: def.atmo, ring: def.ring, seed: def.seed, bands: def.bands, ice: def.ice || 0 });
      const mesh = planet.body;
      mesh.userData.skillGroup = skillGroup.label;
      body.add(planet.group);

      const label = this.createSkillLabel(skillGroup.label, color);
      label.position.set(0, def.r + 1.5, 0);
      body.add(label);

      // One small moon per skill name (names themselves appear in the selector/details).
      const moons = skillGroup.names.map((_, moonIndex) => {
        const moonPivot = new THREE.Group();
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 12, 10),
          new THREE.MeshStandardMaterial({ color: 0xd9e2ea, emissive: color, emissiveIntensity: 0.25, roughness: 0.8 })
        );
        const moonRadius = def.r + 0.9 + moonIndex * 0.38;
        moon.position.set(moonRadius, 0, 0);
        moonPivot.add(moon);
        moonPivot.rotation.x = 0.35 * (moonIndex % 2 ? 1 : -1);
        moonPivot.rotation.y = (moonIndex * Math.PI * 2) / skillGroup.names.length;
        body.add(moonPivot);
        return { pivot: moonPivot, speed: 0.9 - moonIndex * 0.15 };
      });

      const phase = (index * Math.PI * 2) / skillOrbitGroups.length;
      const speed = 0.42 / Math.pow(def.orbit / 8.5, 1.5);
      return { mesh, planet, label, phase, radius: def.orbit, pivot, body, moons, speed, approachRadius: def.r + 3.4 };
    });

    const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), new THREE.MeshBasicMaterial({ visible: false }));
    group.add(hitMesh);

    parent.add(group);
    return { group, core, coronaA, coronaB, skillPlanets, halo, hitMesh, type: 'skills' };
  }

  updateSkillsOrbit(v, delta, playerPos) {
    const orbitTime = this.reduceMotion ? 0 : this.time;
    const starWorld = this._starWorld || (this._starWorld = new THREE.Vector3());
    const planetWorld = this._planetWorld || (this._planetWorld = new THREE.Vector3());
    const dir = this._lightDir || (this._lightDir = new THREE.Vector3());
    v.core.getWorldPosition(starWorld);
    v.core.rotation.y += this.reduceMotion ? 0 : delta * 0.05;
    const pulse = 1 + Math.sin(orbitTime * 1.6) * 0.04;
    v.coronaA.scale.setScalar(13 * pulse);
    v.coronaB.scale.setScalar(7.5 / pulse);

    let nearestIndex = null;
    let nearestDistance = Infinity;
    v.skillPlanets.forEach((p, index) => {
      p.pivot.rotation.y = -orbitTime * p.speed + p.phase;
      if (!this.reduceMotion) p.mesh.rotation.y += delta * 0.3;
      p.moons.forEach((m) => { m.pivot.rotation.y = orbitTime * m.speed * 1.6; });
      p.mesh.getWorldPosition(planetWorld);
      dir.copy(starWorld).sub(planetWorld).normalize();
      p.mesh.material.uniforms.uLightDir.value.copy(dir);
      const distance = planetWorld.distanceTo(playerPos) - p.approachRadius;
      if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = index; }
    });
    const approachedIndex = nearestDistance <= 0 ? nearestIndex : null;
    if (approachedIndex !== this.approachedSkillGroup) {
      this.approachedSkillGroup = approachedIndex;
      window.dispatchEvent(new CustomEvent('portfolio:skill-approach', { detail: { index: approachedIndex } }));
    }
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
      if (item.visuals.type !== 'skills' || !item.group.visible) return;
      this.updateSkillsOrbit(item.visuals, delta, playerPos);
    });
    this.updateProjectMedia(playerPos);
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
      planet.planet.group.scale.setScalar(selected ? 1.18 : 1);
      planet.mesh.material.uniforms.uBoost.value = selected ? 1 : 0;
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
