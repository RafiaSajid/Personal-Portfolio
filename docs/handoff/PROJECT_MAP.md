# Project Map

Native HTML, CSS, and JavaScript ES modules with Three.js. The repository root is both the static site root and the Vercel project root; `api/` contains Vercel serverless functions.

## Important files

- `src/scene/worldJourneyManager.js` â€” same-scene Projects/Skills portal travel, return portals, transitions, and project approach detection.

- `index.html`, `about.html`, `projects.html` — home scene, profile/contact page, and project catalog.
- `styles/style.css`, `src/theme/themeManager.js` — shared responsive UI/form styling, persisted day/night state/palettes, and the CSS ink-spread reveal.
- `portfolio.js` — home-page application setup and connection from theme state to the Three.js scene.
- `src/ui/uiManager.js` - scene navigation, education and skills overlays, and the accessible skill-group selector.
- `src/data/portfolioData.js` — structured profile, education, skills, and project content, plus the shared skill-orbit categories.
- `src/scene/spaceScene.js`, `src/scene/landmarks.js` — Three.js environment, path, and interactive landmarks.
- `src/character/avatarConfig.js`, `src/character/avatarController.js`, `assets/Portfolio.glb` — avatar model path, animation setup, loading, and procedural fallback.
- `src/chat/groundedChat.js`, `api/chat.js`, `api/lib/rag.js` — chat UI/API, retrieval, and optional OpenAI/Gemini generation.
- `api/data/knowledgeBase.json`, `scripts/build-rag-index.js` — generated retrieval index and its build script.
- `src/contact/contactManager.js`, `api/contact.js` - browser form and validated server-side delivery handler (Resend, SendGrid, or webhook).
- `local-server.js` — dependency-free local server, including local API routes.
- `package.json`, `vercel.json`, `.gitignore`, `.env.example` — npm scripts, Vercel root configuration, ignored secret files, and placeholder variable names.
- `README.md` — longer setup, deployment, asset, RAG, and contact instructions.

## Commands

```sh
npm install
npm start          # local server at http://localhost:8000 by default
npm run build      # regenerates api/data/knowledgeBase.json
npm run build:rag  # same RAG index generation
```

Deploy through the linked Vercel project or Vercel dashboard. The configured build command is `npm run build`; the documented CLI production command is `vercel --prod` after installing/linking the Vercel CLI. Deployment itself is not verified in this handoff update.

## Feature locations

Current world exploration files: `src/character/avatarConfig.js` provides broad free-roam bounds; `src/scene/spaceScene.js` scatters star clusters and background bodies; `src/scene/landmarks.js` creates the scattered home landmarks, portal arches, Skills orbit, and Projects exhibits; `src/scene/worldJourneyManager.js` handles portal activation and return travel; `src/ui/uiManager.js` provides accessible project/skill selection and project details. The WebGL fallback reaches the Projects catalog and Skills descriptions rendered from structured data in `about.html`. `portfolio.js` contains the Three.js scene/render loop and optional `?debug=1` coordinate display. Theme transition behavior remains in `src/theme/themeManager.js` and `styles/style.css`.

Current visual correction files: `src/theme/themeManager.js` and `styles/style.css` contain theme transition behavior; `src/scene/spaceScene.js` contains star field/path and nebula updates; `src/scene/landmarks.js` contains the orbiting Skills planets and interactions; `src/ui/uiManager.js` contains the accessible category selector and camera focus integration. `portfolio.js` contains the Three.js scene/render loop and optional `?debug=1` coordinate display.

Portfolio content is in `src/data/portfolioData.js`; the main 3D space scene and landmarks are under `src/scene/`. Avatar configuration and controller are under `src/character/`, with the current GLB at `assets/Portfolio.glb`. ASTRA retrieval and provider calls are under `api/` and its JSON index is generated from structured content. Contact UI and delivery are in `src/contact/` and `api/contact.js`. Vercel uses root `vercel.json` and recognizes the root `api/` handlers. The shared theme manager is `src/theme/themeManager.js` and scene theme updates are wired in `portfolio.js`.
