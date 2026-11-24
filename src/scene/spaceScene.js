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
    this.pathGuideMaterials = [];
    this.themePathOpacity = 0.7;
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
    // Low-key illumination keeps the path readable without flattening the sky.
    this.ambientLight = new THREE.AmbientLight(0x0e1428, 1.6);
    this.scene.add(this.ambientLight);

    // Primary distant stellar light
    this.sunLight = new THREE.DirectionalLight(0xdbeafe, 2.0);
    this.sunLight.position.set(40, 60, 30);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    // Cool edge light gives the planets shape without a purple wash.
    this.rimLight = new THREE.DirectionalLight(0x274663, 0.8);
    this.rimLight.position.set(-50, -20, -100);
    this.scene.add(this.rimLight);
  }

  setupStarfield() {
    // A restrained star field with varied color and soft, round points.
    const starCount = 1450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    this.starColorsOriginal = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xe9f2ff),
      new THREE.Color(0x8fc9e5),
      new THREE.Color(0xf2d6a2),
      new THREE.Color(0xc3d7e4)
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 250 + Math.random() * 220;

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

    this.starMaterial = new THREE.PointsMaterial({
      map: this.createGlowParticleTexture(),
      size: 1.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      alphaTest: 0.08,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, this.starMaterial);
    this.scene.add(this.stars);
  }

  setupStarPath() {
    // Scattered star clusters make a discoverable field without prescribing a route.
    const pathGroup = new THREE.Group();
    this.pathGroup = pathGroup;

    // Canvas texture for glowing star particles
    const particleTexture = this.createGlowParticleTexture();

    const clusterMaterial = new THREE.PointsMaterial({
      map: particleTexture,
      size: 0.66,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xd4e9f5,
      opacity: 0.78,
      alphaTest: 0.08
    });

    for (let clusterIndex = 0; clusterIndex < 116; clusterIndex += 1) {
      const count = 5 + Math.floor(Math.random() * 6);
      const positions = new Float32Array(count * 3);
      const centerX = (Math.random() - 0.5) * 340;
      const centerZ = (Math.random() - 0.5) * 340;

      for (let i = 0; i < count; i++) {
        const x = centerX + (Math.random() - 0.5) * 3.6;
        const y = 0.025 + Math.random() * 0.24;
        const z = centerZ + (Math.random() - 0.5) * 3.6;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = clusterMaterial.clone();
      material.color.setHex([0xd4e9f5, 0x78bad7, 0xe8d1a1][Math.floor(Math.random() * 3)]);
      material.size = 0.55 + Math.random() * 0.22;
      const points = new THREE.Points(geo, material);

      pathGroup.add(points);
      this.pathClusters.push({
        points,
        centerX,
        centerZ,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.scene.add(pathGroup);
  }

  createGlowParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.92)');
    grad.addColorStop(0.56, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  setupPlanets() {
    // Three distant bodies provide scale without filling the camera view.
    const planetAGroup = new THREE.Group();
    planetAGroup.position.set(-72, 24, -35);
    const planetAGeo = new THREE.SphereGeometry(8, 32, 32);
    const planetAMat = new THREE.MeshStandardMaterial({
      color: 0x18364a,
      roughness: 0.8,
      metalness: 0.1
    });
    const planetAMesh = new THREE.Mesh(planetAGeo, planetAMat);
    planetAGroup.add(planetAMesh);

    const haloGeo = new THREE.SphereGeometry(8.8, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x3e8195,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    this.themeMaterials = { planetA: planetAMat, planetAHalo: haloMat };
    planetAGroup.add(new THREE.Mesh(haloGeo, haloMat));
    this.scene.add(planetAGroup);
    this.planets.push(planetAGroup);

    const planetBGroup = new THREE.Group();
    planetBGroup.position.set(76, 17, 52);
    const planetBGeo = new THREE.SphereGeometry(6, 32, 32);
    const planetBMat = new THREE.MeshStandardMaterial({
      color: 0x23434e,
      roughness: 0.7,
      metalness: 0.2
    });
    const planetBMesh = new THREE.Mesh(planetBGeo, planetBMat);
    planetBGroup.add(planetBMesh);

    // Ring system
    const ringGeo = new THREE.RingGeometry(8.3, 11.5, 48);
    ringGeo.rotateX(Math.PI / 2.4);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x83bfd2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    this.themeMaterials.planetB = planetBMat;
    this.themeMaterials.planetBRing = ringMat;
    planetBGroup.add(new THREE.Mesh(ringGeo, ringMat));
    this.scene.add(planetBGroup);
    this.planets.push(planetBGroup);

    const planetCGroup = new THREE.Group();
    planetCGroup.position.set(-62, 34, 78);
    const planetCGeo = new THREE.SphereGeometry(9, 32, 32);
    const planetCMat = new THREE.MeshStandardMaterial({
      color: 0x26384b,
      roughness: 0.9,
      metalness: 0.05
    });
    this.themeMaterials.planetC = planetCMat;
    planetCGroup.add(new THREE.Mesh(planetCGeo, planetCMat));
    this.scene.add(planetCGroup);
    this.planets.push(planetCGroup);
  }

  setupAsteroids() {
    // A few small rocks are scattered well outside the landmark clusters.
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x364654,
      roughness: 0.85,
      metalness: 0.2
    });
    this.themeMaterials.asteroid = asteroidMat;

    for (let i = 0; i < 12; i++) {
      const geo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.65, 0);
      const mesh = new THREE.Mesh(geo, asteroidMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = 34 + Math.random() * 58;
      const x = Math.cos(angle) * radius;
      const y = 2 + Math.random() * 9;
      const z = Math.sin(angle) * radius;

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
    // Soft alpha textures preserve depth without visible rectangular plane edges.
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 256;
    textureCanvas.height = 256;
    const ctx = textureCanvas.getContext('2d');
    const cloud = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
    cloud.addColorStop(0, 'rgba(255,255,255,0.75)');
    cloud.addColorStop(0.38, 'rgba(255,255,255,0.36)');
    cloud.addColorStop(0.72, 'rgba(255,255,255,0.1)');
    cloud.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, 256, 256);
    const nebulaTexture = new THREE.CanvasTexture(textureCanvas);
    const nebulaCount = 3;
    for (let i = 0; i < nebulaCount; i++) {
      const geo = new THREE.PlaneGeometry(36, 24);
      const mat = new THREE.MeshBasicMaterial({
        map: nebulaTexture,
        color: i % 2 === 0 ? 0x20445b : 0x2b555a,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        alphaTest: 0.01,
        depthWrite: false
      });
      mat.userData.themeNebulaIndex = i % 2;
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(
        (i - 1) * 19 + (Math.random() - 0.5) * 5,
        8 + Math.random() * 8,
        -44 - i * 52
      );
      plane.rotation.set((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.28, 0);
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

    // 3. Nearby constellations brighten gently around the roaming avatar.
    this.pathClusters.forEach((cluster) => {
      const distance = playerPos
        ? Math.hypot(cluster.centerX - playerPos.x, cluster.centerZ - playerPos.z)
        : Infinity;
      let proximityFactor = 1.0;
      if (distance < 26) proximityFactor = 1.12;

      const pulse = Math.sin(this.time * 3 + cluster.phase) * 0.2 + 0.8;
      cluster.points.material.opacity = Math.min(1.0, this.themePathOpacity * pulse * proximityFactor);
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

  applyTheme(theme) {
    if (!theme) return;
    this.ambientLight.color.setHex(theme.ambientColor);
    this.ambientLight.intensity = theme.ambientIntensity;
    this.sunLight.color.setHex(theme.sunColor);
    this.sunLight.intensity = theme.sunIntensity;
    this.rimLight.color.setHex(theme.rimColor);
    this.rimLight.intensity = theme.rimIntensity;

    if (theme.starColor !== undefined) this.starMaterial.color.setHex(theme.starColor);
    this.starMaterial.opacity = theme.starOpacity;
    this.themePathOpacity = theme.pathOpacity;
    this.pathClusters.forEach(({ points }) => points.material.color.setHex(theme.pathColor));
    this.pathGuideMaterials.forEach((material) => {
      material.color.setHex(theme.guideColor);
      material.opacity = theme.guideOpacity;
    });

    const materials = this.themeMaterials || {};
    if (materials.planetA) materials.planetA.color.setHex(theme.planetA);
    if (materials.planetAHalo) materials.planetAHalo.color.setHex(theme.planetAHalo);
    if (materials.planetB) materials.planetB.color.setHex(theme.planetB);
    if (materials.planetBRing) materials.planetBRing.color.setHex(theme.planetBRing);
    if (materials.planetC) materials.planetC.color.setHex(theme.planetC);
    if (materials.asteroid) materials.asteroid.color.setHex(theme.asteroid);

    this.nebulaPlanes.forEach((plane) => {
      const index = plane.material.userData.themeNebulaIndex || 0;
      plane.material.color.setHex(theme.nebula[index]);
      plane.material.opacity = theme.nebulaOpacity;
    });
  }
}
