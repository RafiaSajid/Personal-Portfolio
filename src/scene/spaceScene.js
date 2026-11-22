import * as THREE from 'three';

export class SpaceScene {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.spaceDust = null;
    this.planet = null;
    this.rings = null;
    this.pulseRings = [];

    this.init();
  }

  init() {
    this.setupLighting();
    this.setupStarfield();
    this.setupSpaceDust();
    this.setupDistantPlanet();
    this.setupCentralPlaza();
  }

  setupLighting() {
    // Ambient cosmic base
    const ambientLight = new THREE.AmbientLight(0x1a2035, 1.8);
    this.scene.add(ambientLight);

    // Primary distant stellar light (soft blue-white)
    const sunLight = new THREE.DirectionalLight(0xddeeff, 2.2);
    sunLight.position.set(50, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    const d = 50;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Secondary colored cosmic rim light (violet / cyan)
    const rimLight = new THREE.DirectionalLight(0x7c3aed, 1.2);
    rimLight.position.set(-60, -30, -50);
    this.scene.add(rimLight);
  }

  setupStarfield() {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xa5f3fc),
      new THREE.Color(0xc4b5fd),
      new THREE.Color(0xfef08a),
      new THREE.Color(0x67e8f9)
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute stars on a large outer sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 250 + Math.random() * 250;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.stars = new THREE.Points(geometry, starMaterial);
    this.scene.add(this.stars);
  }

  setupSpaceDust() {
    // Floating cosmic embers near the playfield to convey motion parallax
    const dustCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = Math.random() * 25 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const dustMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.6,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.spaceDust = new THREE.Points(geometry, dustMaterial);
    this.scene.add(this.spaceDust);
  }

  setupDistantPlanet() {
    // Beautiful distant ringed exoplanet
    const planetGroup = new THREE.Group();
    planetGroup.position.set(-120, 45, -160);

    const planetGeo = new THREE.SphereGeometry(24, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x4338ca,
      emissive: 0x1e1b4b,
      roughness: 0.7,
      metalness: 0.1
    });
    this.planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(this.planet);

    // Planet rings
    const ringGeo = new THREE.RingGeometry(30, 48, 64);
    ringGeo.rotateX(Math.PI / 2.3);
    ringGeo.rotateZ(0.2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    this.rings = new THREE.Mesh(ringGeo, ringMat);
    planetGroup.add(this.rings);

    // Subtle atmospheric glow halo
    const glowGeo = new THREE.SphereGeometry(25.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const planetGlow = new THREE.Mesh(glowGeo, glowMat);
    planetGroup.add(planetGlow);

    this.scene.add(planetGroup);
  }

  setupCentralPlaza() {
    // Futuristic cybernetic spawn plaza
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(0, 0, 12);

    // Central circular platform
    const platformGeo = new THREE.CylinderGeometry(8.5, 9.5, 0.6, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.3;
    platform.receiveShadow = true;
    plazaGroup.add(platform);

    // Outer luminous ring
    const ringGeo = new THREE.RingGeometry(8.5, 8.8, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide
    });
    const outerRing = new THREE.Mesh(ringGeo, ringMat);
    outerRing.position.y = 0.02;
    plazaGroup.add(outerRing);

    // Inner holographic coordinate grid
    const grid = new THREE.GridHelper(14, 14, 0x00ffff, 0x1e293b);
    grid.position.y = 0.03;
    plazaGroup.add(grid);

    // Pulsing energy beacon ring on floor
    const pulseGeo = new THREE.RingGeometry(1.5, 2.0, 32);
    pulseGeo.rotateX(-Math.PI / 2);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
    pulseRing.position.y = 0.04;
    plazaGroup.add(pulseRing);
    this.pulseRings.push(pulseRing);

    // Floating welcome beacon diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.8, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    this.centralDiamond = new THREE.Mesh(diamondGeo, diamondMat);
    this.centralDiamond.position.y = 3.2;
    plazaGroup.add(this.centralDiamond);

    this.scene.add(plazaGroup);
  }

  update(delta) {
    // Subtle star rotation
    if (this.stars) {
      this.stars.rotation.y += delta * 0.003;
    }

    // Exoplanet rotation
    if (this.planet) {
      this.planet.rotation.y += delta * 0.015;
    }

    // Central beacon animation
    if (this.centralDiamond) {
      this.centralDiamond.rotation.y += delta * 0.8;
      this.centralDiamond.rotation.x += delta * 0.4;
      this.centralDiamond.position.y = 3.2 + Math.sin(Date.now() * 0.002) * 0.25;
    }

    // Pulse rings expansion
    this.pulseRings.forEach((ring) => {
      ring.scale.x += delta * 0.6;
      ring.scale.y += delta * 0.6;
      if (ring.scale.x > 3.0) {
        ring.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Space dust gentle drift
    if (this.spaceDust) {
      const positions = this.spaceDust.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * 0.4;
        if (positions[i] > 20) {
          positions[i] = -5;
        }
      }
      this.spaceDust.geometry.attributes.position.needsUpdate = true;
    }
  }
}
