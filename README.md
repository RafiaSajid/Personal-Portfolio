# Rafia Gull - 3D Interactive Space Journey Portfolio

A real-time, third-person 3D space journey portfolio built for **Rafia Gull**, an aspiring game developer and Computer Science student specializing in **Gaming and Animation**.

Built using **HTML5, CSS3, JavaScript (ES6+), and Three.js** with zero heavyweight frameworks, optimized for instant loading and static deployment on **Vercel**.

---

## 🚀 Features

- **Real-Time 3D Space Experience**: Explore deep space with dynamic starfields, planetary rings, cosmic dust, and orbital platforms.
- **Third-Person Character Controller**:
  - Smooth WASD / Arrow directional movement relative to the camera heading.
  - Orbit camera with mouse drag and zoom wheel.
  - Jetpack hover (`Space`) and thruster boost / sprint (`Shift`).
  - Mobile & tablet virtual touch joystick and touch swipe camera rotation.
  - Procedural space explorer avatar with walking and hover locomotion.
  - Drop-in support for custom GLTF/GLB avatar models with idle/walk animations.
- **Interactive Orbital Sector Landmarks**:
  - **Arrival Platform**: Starting coordinates and navigational beacon.
  - **Command Hub (About Me)**: Bio, degree focus, specialization in Gaming and Animation, and mission statement.
  - **The Orbital Hangar (Projects)**: Filterable project showcase, technology tags, technical details, and link buttons.
  - **Cyber Laboratory (Skills Matrix)**: Tech competencies in C++, C#, Unity, Unreal, Three.js, 3D math, and animation pipelines.
  - **Deep Space Relay (Contact)**: Direct transmission dispatch form, email copy, and social links.
  - **HUD Quick-Warp**: Instant teleportation to any sector with one click.
- **Grounded AI Companion ("ASTRA")**:
  - Sci-fi companion droid grounded strictly on verified portfolio data.
  - Answers questions about Rafia's game dev background, tech stack, and projects without hallucinating.
  - Suggested question chips for instant interaction.
- **Synthesized Web Audio**:
  - Atmospheric synth drone and UI interaction chimes generated via the Web Audio API without external audio file dependencies.
  - Muted by default with a one-click audio toggle.

---

## 🛠️ How to Run Locally

Because the project uses standard ES modules with Three.js import maps, run a lightweight local static server:

### Option 1: Python (Built-in)
```bash
# In the project directory:
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Node.js / npx
```bash
npx serve .
```

### Option 3: VS Code
Open the repository in VS Code and click **"Go Live"** using the **Live Server** extension.

---

## 🌐 Deploying to Vercel

The project includes a ready-to-use `vercel.json` and uses zero build steps:
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository `Personal-Portfolio`.
4. Leave Build & Output settings as default (static site) and click **Deploy**.

---

## 🎮 How to Customize Content

### 1. Updating Projects, Skills, and Contact Info
All content is centralized in [`src/data/portfolioData.js`](file:///d:/Github/Personal-Portfolio/src/data/portfolioData.js):
- Add new game projects to `portfolioData.projects`.
- Add or edit skills in `portfolioData.skills`.
- Update your actual email, GitHub URL, and LinkedIn URL in `portfolioData.profile.contact`.

### 2. Adding Your Custom 3D Avatar
When your custom 3D avatar (.glb or .gltf) with idle and walk animations is ready:
1. Place your model file in `assets/avatar.glb`.
2. Open [`src/character/avatarConfig.js`](file:///d:/Github/Personal-Portfolio/src/character/avatarConfig.js).
3. Set:
   ```javascript
   export const avatarConfig = {
     modelPath: './assets/avatar.glb', // path to your GLTF file
     scale: 1.0,
     positionOffset: [0, 0, 0],
     rotationOffset: [0, Math.PI, 0],
     animations: {
       idleClipName: 'idle', // your animation clip name
       walkClipName: 'walk', // your animation clip name
       runClipName: 'run',
     }
   };
   ```
The engine will automatically load your model and fade between your custom animations based on movement speed.

---

## 📂 Project Architecture

```
Personal-Portfolio/
├── index.html                 # Main HTML entry point & HUD UI elements
├── portfolio.js               # Application coordinator & Three.js render loop
├── vercel.json                # Vercel deployment configuration
├── styles/
│   └── style.css              # Glassmorphism sci-fi HUD & modal styling
├── src/
│   ├── data/
│   │   └── portfolioData.js   # Centralized data-driven projects & profile
│   ├── character/
│   │   ├── avatarConfig.js    # Avatar drop-in configuration for custom GLTF
│   │   └── avatarController.js# Character locomotion & third-person camera rig
│   ├── scene/
│   │   ├── spaceScene.js      # Starfield, lighting, distant planet, cosmic dust
│   │   └── landmarks.js       # 3D interactive stations & holographic banners
│   ├── controls/
│   │   └── inputManager.js    # WASD, camera drag, touch joystick
│   ├── ui/
│   │   └── uiManager.js       # Modals, HUD telemetry, and warp navigation
│   ├── chat/
│   │   └── groundedChat.js    # Grounded AI assistant (ASTRA)
│   └── audio/
│       └── audioManager.js    # Web Audio API procedural sound synthesizer
└── README.md
```
