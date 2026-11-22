import * as THREE from 'three';

export class SpaceScene {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.starColorsOriginal = null;
    this.pathClusters = [];
    this.planets = [];
    this.asteroids = [];
    this.nebulaPlanes = [];
    this.time = 0;

    this.init();
  }

  init() {
    this.setupLighting();
    this.setupStarfield();
    this.setupStarPath();
    this.setupPlanets();
    this.setupAsteroids();
    this.setupNebulae();
  }

  setupLighting() {
    // Deep cosmic ambient light
    const ambientLight = new THREE.AmbientLight(0x0e1428, 1.6);
    this.scene.add(ambientLight);

    // Primary distant stellar light
    const sunLight = new THREE.DirectionalLight(0xdbeafe, 2.0);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    // Subtle violet rim light from deep space
    const rimLight = new THREE.DirectionalLight(0x7c3aed, 1.2);
    rimLight.position.set(-50, -20, -100);
    this.scene.add(rimLight);
  }

  setupStarfield() {
    // 2500 distant background stars with subtle twinkle colors
    const starCount = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    this.starColorsOriginal = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xa855f7),
      new THREE.Color(0xfef08a),
      new THREE.Color(0x67e8f9)
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 220 + Math.random() * 200;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      this.starColorsOriginal[i * 3] = color.r;
      this.starColorsOriginal[i * 3 + 1] = color.g;
      this.starColorsOriginal[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.stars = new THREE.Points(geometry, starMaterial);
    this.scene.add(this.stars);
  }

  setupStarPath() {
    // A navigable forward path made of visible glowing star clusters
    // Extends from z = 12 down to z = -180 along the primary trajectory
    const pathGroup = new THREE.Group();
    this.pathGroup = pathGroup;

    // Canvas texture for glowing star particles
    const particleTexture = this.createGlowParticleTexture();

    const clusterMaterial = new THREE.PointsMaterial({
      map: particleTexture,
      size: 1.4,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x38bdf8,
      opacity: 0.85
    });

    // Create clusters spaced every 3.5 units along the path
    for (let z = 12; z >= -180; z -= 3.5) {
      const count = 10;
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        // Path width: lateral spread between -3.8 and +3.8
        const x = (Math.random() - 0.5) * 7.5;
        // Floor level with gentle undulation
        const y = -0.05 + Math.random() * 0.15;
        const zOffset = (Math.random() - 0.5) * 2.8;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z + zOffset;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geo, clusterMaterial.clone());

      pathGroup.add(points);
      this.pathClusters.push({
        points,
        baseZ: z,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Glowing edge guide lines (subtle luminous path boundaries)
    const lineGeo = new THREE.BufferGeometry();
    const linePointsLeft = [];
    const linePointsRight = [];
    for (let z = 12; z >= -180; z -= 2) {
      linePointsLeft.push(new THREE.Vector3(-4.2, 0.02, z));
      linePointsRight.push(new THREE.Vector3(4.2, 0.02, z));
    }
    const leftLineGeo = new THREE.BufferGeometry().setFromPoints(linePointsLeft);
    const rightLineGeo = new THREE.BufferGeometry().setFromPoints(linePointsRight);

    const guideLineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35
    });

    const leftLine = new THREE.Line(leftLineGeo, guideLineMat);
    const rightLine = new THREE.Line(rightLineGeo, guideLineMat);
    pathGroup.add(leftLine);
    pathGroup.add(rightLine);

    this.scene.add(pathGroup);
  }

  createGlowParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
    grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  setupPlanets() {
    // 3 distant celestial bodies placed intentionally to provide depth and atmosphere
    // 1. Planet A: Indigo gas giant to the left
    const planetAGroup = new THREE.Group();
    planetAGroup.position.set(-95, 38, -90);
    const planetAGeo = new THREE.SphereGeometry(18, 32, 32);
    const planetAMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.8,
      metalness: 0.1
    });
    const planetAMesh = new THREE.Mesh(planetAGeo, planetAMat);
    planetAGroup.add(planetAMesh);

    // Violet atmospheric halo
    const haloGeo = new THREE.SphereGeometry(19.5, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    planetAGroup.add(new THREE.Mesh(haloGeo, haloMat));
    this.scene.add(planetAGroup);
    this.planets.push(planetAGroup);

    // 2. Planet B: Cyan exoplanet with rings to the right
    const planetBGroup = new THREE.Group();
    planetBGroup.position.set(100, 24, -130);
    const planetBGeo = new THREE.SphereGeometry(14, 32, 32);
    const planetBMat = new THREE.MeshStandardMaterial({
      color: 0x164e63,
      roughness: 0.7,
      metalness: 0.2
    });
    const planetBMesh = new THREE.Mesh(planetBGeo, planetBMat);
    planetBGroup.add(planetBMesh);

    // Ring system
    const ringGeo = new THREE.RingGeometry(18, 28, 48);
    ringGeo.rotateX(Math.PI / 2.4);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    planetBGroup.add(new THREE.Mesh(ringGeo, ringMat));
    this.scene.add(planetBGroup);
    this.planets.push(planetBGroup);

    // 3. Planet C: Deep dark sphere far in front
    const planetCGroup = new THREE.Group();
    planetCGroup.position.set(-30, 50, -220);
    const planetCGeo = new THREE.SphereGeometry(22, 32, 32);
    const planetCMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.9,
      metalness: 0.05
    });
    planetCGroup.add(new THREE.Mesh(planetCGeo, planetCMat));
    this.scene.add(planetCGroup);
    this.planets.push(planetCGroup);
  }

  setupAsteroids() {
    // 24 low-poly rocky asteroids scattered strictly to the sides of the path (±14 to ±40)
    // Never placed in the walkable path corridor
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.2
    });

    for (let i = 0; i < 24; i++) {
      const geo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.4, 0);
      const mesh = new THREE.Mesh(geo, asteroidMat);

      // Side: alternating left and right
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (12 + Math.random() * 26);
      const y = -1 + Math.random() * 8;
      const z = 10 - i * 8 + (Math.random() - 0.5) * 4;

      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.set(
        0.8 + Math.random() * 0.5,
        0.7 + Math.random() * 0.6,
        0.8 + Math.random() * 0.5
      );

      this.scene.add(mesh);
      this.asteroids.push({
        mesh,
        rotSpeedX: (Math.random() - 0.5) * 0.2,
        rotSpeedY: (Math.random() - 0.5) * 0.2
      });
    }
  }

  setupNebulae() {
    // Subtle cosmic dust clouds giving atmospheric depth
    const nebulaCount = 5;
    for (let i = 0; i < nebulaCount; i++) {
      const geo = new THREE.PlaneGeometry(60, 40);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x312e81 : 0x0c4a6e,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(
        (Math.random() - 0.5) * 50,
        10 + Math.random() * 20,
        -30 - i * 35
      );
      plane.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, 0);
      this.scene.add(plane);
      this.nebulaPlanes.push(plane);
    }
  }

  update(delta, playerPos) {
    this.time += delta;

    // 1. Subtle starfield rotation
    if (this.stars) {
      this.stars.rotation.y += delta * 0.002;
    }

    // 2. Twinkle subset of stars for high performance
    if (this.stars && this.starColorsOriginal) {
      const colors = this.stars.geometry.attributes.color.array;
      const count = colors.length / 3;
      // Update every 12th star
      for (let i = 0; i < count; i += 12) {
        const factor = 0.65 + 0.35 * Math.sin(this.time * 2.5 + i);
        colors[i * 3] = this.starColorsOriginal[i * 3] * factor;
        colors[i * 3 + 1] = this.starColorsOriginal[i * 3 + 1] * factor;
        colors[i * 3 + 2] = this.starColorsOriginal[i * 3 + 2] * factor;
      }
      this.stars.geometry.attributes.color.needsUpdate = true;
    }

    // 3. Star path pulsation and forward reveal ahead of player
    const playerZ = playerPos ? playerPos.z : 0;
    this.pathClusters.forEach((cluster) => {
      // Distance from player along Z
      const distFromPlayer = cluster.baseZ - playerZ;
      // Clusters within visible range ahead of player glow brighter
      let proximityFactor = 1.0;
      if (distFromPlayer < 5 && distFromPlayer > -35) {
        proximityFactor = 1.35;
      }

      const pulse = Math.sin(this.time * 3 + cluster.phase) * 0.2 + 0.8;
      cluster.points.material.opacity = Math.min(1.0, 0.7 * pulse * proximityFactor);
    });

    // 4. Distant celestial body rotations
    this.planets.forEach((p, idx) => {
      p.rotation.y += delta * (0.015 + idx * 0.005);
    });

    // 5. Asteroids slow tumble
    this.asteroids.forEach((a) => {
      a.mesh.rotation.x += a.rotSpeedX * delta;
      a.mesh.rotation.y += a.rotSpeedY * delta;
    });
  }
}
