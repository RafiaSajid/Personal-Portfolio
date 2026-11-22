import * as THREE from 'three';
import { SpaceScene } from './src/scene/spaceScene.js';
import { LandmarkManager } from './src/scene/landmarks.js';
import { AvatarController } from './src/character/avatarController.js';
import { InputManager } from './src/controls/inputManager.js';
import { AudioManager } from './src/audio/audioManager.js';
import { GroundedChat } from './src/chat/groundedChat.js';
import { UIManager } from './src/ui/uiManager.js';

class PortfolioApp {
  constructor() {
    this.container = document.getElementById('canvas-container') || document.body;
    this.clock = new THREE.Clock();

    this.initRenderer();
    this.initScene();
    this.initModules();
    this.initEvents();

    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.005);

    // Third-person perspective camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      800
    );
  }

  initModules() {
    // 1. Synthesized Audio Engine
    this.audio = new AudioManager();

    // 2. Space Environment & Procedural Starfield
    this.spaceScene = new SpaceScene(this.scene);

    // 3. Third-Person Character & Camera Rig
    this.avatar = new AvatarController(this.scene, this.camera, this.renderer.domElement);

    // 4. Grounded AI Chat Companion
    this.chat = new GroundedChat();

    // 5. Input Manager
    this.input = new InputManager(this.renderer.domElement, () => {
      this.ui.handleInteractAction();
    });

    // Connect camera controls to Input Manager
    this.input.onCameraRotate = (deltaYaw, deltaPitch) => {
      this.avatar.rotateCamera(deltaYaw, deltaPitch);
    };

    this.input.onCameraZoom = (deltaZoom) => {
      this.avatar.zoom(deltaZoom);
    };

    // 6. Interactive 3D Sector Landmarks
    this.landmarks = new LandmarkManager(this.scene);

    // 7. HUD & Modal UI Manager
    this.ui = new UIManager(this.avatar, this.audio, this.chat);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update player locomotion & camera
    this.avatar.update(delta, this.input);

    // Update space environment features
    this.spaceScene.update(delta);

    // Update landmarks animation & check proximity to avatar
    this.landmarks.update(delta, this.avatar.position, (nearbyLandmark) => {
      this.ui.onProximityChanged(nearbyLandmark);
    });

    // Update HUD telemetry
    this.ui.updateHUD(this.avatar.position, this.avatar.orbitAngles.yaw);

    // Render WebGL scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Launch application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});
