import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';

//initial browser dimensions settings
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

//camera
const fov = 100;
const aspect = w / h;
const near = 0.1;
const far = 10;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
//scene
const scene = new THREE.Scene();
scene.add(camera);
//controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.003;

scene.background = new THREE.Color(0x87ceeb);

//light
const atmLight = new THREE.AmbientLight(0xccccff, 1);
scene.add(atmLight);

function animate(t = 0) {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}
animate();