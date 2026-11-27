import * as THREE from 'three';
import { SpaceScene } from './src/scene/spaceScene.js';
import { LandmarkManager } from './src/scene/landmarks.js';
import { WorldJourneyManager } from './src/scene/worldJourneyManager.js';
import { EnvironmentManager } from './src/scene/environments.js';
import { ShipController } from './src/vehicle/shipController.js';
import { AvatarController } from './src/character/avatarController.js';
import { CustomNPCManager } from './src/character/npcManager.js';
import { InputManager } from './src/controls/inputManager.js';
import { AudioManager } from './src/audio/audioManager.js';
import { GroundedChat } from './src/chat/groundedChat.js';
import { UIManager } from './src/ui/uiManager.js';

const THEME_COLOR_KEYS = new Set([
  'background', 'fog', 'ambientColor', 'sunColor', 'rimColor', 'starColor', 'pathColor', 'guideColor',
  'platformColor', 'planetA', 'planetAHalo', 'planetB', 'planetBRing', 'planetC', 'asteroid'
]);

class PortfolioApp {
  constructor() {
    const debugScene = new URLSearchParams(window.location.search).get('debug') === '1';
    document.documentElement.classList.toggle('debug-scene', debugScene);
    this.container = document.getElementById('canvas-wrap') || document.body;
    this.clock = new THREE.Clock();

    // Verify WebGL availability
    if (!this.checkWebGL()) {
      this.handleWebGLUnavailable();
      return;
    }

    this.initRenderer();
    this.initScene();
    this.initModules();
    this.connectTheme();
    this.initRaycasting();
    this.initEvents();

    // Remove loading screen when ready
    setTimeout(() => {
      this.ui.setLoading(false);
    }, 450);

    this.animate();
  }

  checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  handleWebGLUnavailable() {
    const fallback = document.getElementById('webgl-fallback');
    if (fallback) fallback.classList.add('visible');
    const loading = document.getElementById('loading-screen');
    if (loading) loading.classList.add('hidden');
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Limit pixel ratio to max 2 for GPU efficiency
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020510);
    this.scene.fog = new THREE.FogExp2(0x020510, 0.005);

    // Third-person perspective camera looking down the star path
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1800
    );
  }

  initModules() {
    // 1. Procedural Web Audio Engine
    this.audio = new AudioManager();

    // 2. Space Environment & Star Path
    this.spaceScene = new SpaceScene(this.scene);

    // 3. Avatar Controller (procedural / custom GLTF)
    this.avatar = new AvatarController(this.scene, this.camera, this.renderer.domElement);

    // 4. Grounded AI Chat Assistant (ASTRA)
    this.chat = new GroundedChat();

    // 5. Input Manager (WASD, Arrows, touch D-Pad, mouse drag)
    this.input = new InputManager(this.renderer.domElement, {
      onInteract: () => { if (this.ship?.handleInteract()) return; this.ui.handleInteract(); },
      onCameraRotate: (deltaYaw, deltaPitch) => this.avatar.rotateCamera(deltaYaw, deltaPitch),
      onCameraZoom: (deltaZoom) => this.avatar.zoomCamera(deltaZoom)
    });

    // 6. Interactive 3D Star Landmarks
    this.landmarks = new LandmarkManager(this.scene);

    // 7. Optional Custom Characters / NPCs
    this.npcManager = new CustomNPCManager(this.scene);

    // 8. In-world Projects, Skills, and About Me environments, using the same scene/renderer.
    this.worldJourneys = new WorldJourneyManager(this.scene, this.avatar, this.landmarks);

    // 8b. Per-portal environments (own sky, planets, lighting) on the same renderer.
    this.environments = new EnvironmentManager({
      scene: this.scene,
      spaceScene: this.spaceScene,
      landmarks: this.landmarks,
      worldJourneys: this.worldJourneys,
      avatar: this.avatar,
      refreshTheme: () => { if (this.activeSceneTheme) this.applySceneTheme(this.activeSceneTheme); }
    });
    this.environments.setThemeName(this.themeName);

    // 8c. Rideable starship parked beside the explorer.
    this.ship = new ShipController({ scene: this.scene, camera: this.camera, avatar: this.avatar, input: this.input });
    // The intro card is only for the first moment at home: gone once anyone moves, never shown in other areas.
    this.hideIntro = () => document.getElementById('home-intro')?.classList.add('hidden');
    window.addEventListener('portfolio:destination-change', (event) => {
      if ((event.detail?.destination || 'home') !== 'home') this.hideIntro();
    });

    // 9. HUD & Navigation UI Manager
    this.ui = new UIManager(this.avatar, this.audio, this.chat, this.worldJourneys);
  }

  connectTheme() {
    this.themeManager = window.portfolioTheme;
    if (!this.themeManager) return;

    this.unsubscribeTheme = this.themeManager.subscribe((_name, palette) => {
      this.themeName = _name;
      this.environments?.setThemeName(_name);
      const target = this.cloneTheme(palette.three);
      if (!this.activeSceneTheme || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.applySceneTheme(target);
        this.activeSceneTheme = target;
        this.themeTransition = null;
        return;
      }

      this.themeTransition = {
        from: this.cloneTheme(this.activeSceneTheme),
        to: target,
        startedAt: performance.now(),
        duration: 260
      };
    });
  }

  cloneTheme(theme) {
    return Object.fromEntries(Object.entries(theme).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ]));
  }

  applySceneTheme(theme) {
    this.scene.background.setHex(theme.background);
    if (this.scene.fog) {
      this.scene.fog.color.setHex(theme.fog);
      this.scene.fog.density = theme.fogDensity;
    }
    this.spaceScene.applyTheme(theme);
    this.landmarks.applyTheme(theme);
    this.environments?.applyOverlay();
  }

  updateThemeTransition() {
    if (!this.themeTransition) return;
    const transition = this.themeTransition;
    const rawProgress = Math.min(1, (performance.now() - transition.startedAt) / transition.duration);
    const progress = 1 - Math.pow(1 - rawProgress, 3);
    const interpolated = {};

    Object.keys(transition.to).forEach((key) => {
      const from = transition.from[key];
      const to = transition.to[key];
      if (Array.isArray(to)) {
        interpolated[key] = to.map((color, index) => new THREE.Color(from[index]).lerp(new THREE.Color(color), progress).getHex());
      } else if (THEME_COLOR_KEYS.has(key)) {
        interpolated[key] = new THREE.Color(from).lerp(new THREE.Color(to), progress).getHex();
      } else if (typeof to === 'number') {
        interpolated[key] = from + (to - from) * progress;
      } else {
        interpolated[key] = to;
      }
    });

    this.applySceneTheme(interpolated);
    this.activeSceneTheme = interpolated;
    if (rawProgress >= 1) this.themeTransition = null;
  }

  initRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Click on 3D landmarks directly with mouse/pointer
    this.renderer.domElement.addEventListener('click', (e) => {
      // Don't trigger click if user was dragging camera
      if (this.input.isDraggingCamera) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const targets = this.worldJourneys.getRaycastTargets();
      const treeVisible = (obj) => { for (let o = obj; o; o = o.parent) if (!o.visible) return false; return true; };
      const intersects = this.raycaster.intersectObjects(targets, true).filter((hit) => treeVisible(hit.object));

      if (intersects.length > 0) {
        const selected = intersects[0].object;
        if (selected.userData?.returnHomePortal) {
          this.worldJourneys.returnHome();
          return;
        }
        if (selected.userData?.projectId) {
          this.ui.openProjectDetails(selected.userData.projectId);
          return;
        }
        if (selected.userData?.destinationId) {
          this.worldJourneys.enter(selected.userData.destinationId);
          return;
        }
        // Find ancestor with landmark data
        let obj = selected;
        while (obj && !obj.userData?.landmark) {
          obj = obj.parent;
        }

        if (obj && obj.userData?.landmark) {
          const landmarkData = obj.userData.landmark.data;
          if (Number.isInteger(obj.userData.skillGroupIndex) && this.worldJourneys.destination === 'skills') {
            window.dispatchEvent(new CustomEvent('portfolio:skill-select', { detail: { index: obj.userData.skillGroupIndex } }));
          } else {
            this.ui.navigateToSection(landmarkData.id, obj.userData.skillGroupIndex ?? null);
          }
        }
      }
    });
  }

  initEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.updateThemeTransition();

    // 1. Update avatar locomotion and third-person camera
    if (this.ship?.boarded) {
      this.ship.update(delta);
    } else {
      this.avatar.update(delta, this.input);
      this.ship?.update(delta);
    }
    if (this.avatar.isMoving || this.avatar.activeTransition || this.ship?.boarded) this.hideIntro?.();

    // 2. Update space environment & star path reveal ahead of player
    this.spaceScene.update(delta, this.avatar.position);
    this.environments?.update(delta, this.avatar.position);

    // 3. Update landmarks and check proximity to avatar
    this.landmarks.update(delta, this.avatar.position, (nearby) => {
      this.ui.onProximityChanged(nearby);
    });
    this.worldJourneys.update();
    this.npcManager?.update(delta, this.avatar.position);

    // 4. Update HUD coordinates
    this.ui.updateHUD(this.avatar.position, this.avatar.orbitAngles.yaw);

    // 5. Render Three.js scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});
