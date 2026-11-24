# Project Status

Updated 2026-11-24. This file distinguishes repository inspection from production reports supplied by the owner.

Visual verification notes below may refer to earlier code and are superseded by the latest dated implementation section. The current browser host is unavailable under its URL policy, so no visual review is claimed for this implementation.

## Verified in the repository

- Before this theme task, the worktree was on `main` with only the existing untracked `docs/handoff/` directory; there was no implementation diff.
- The site has home, About, and Projects pages; shared navigation includes a day/night toggle. Theme preference uses local storage and defaults to the operating-system preference when no saved choice exists. Three.js theme updates are connected in `portfolio.js`.
- The original glass-pill orbital toggle is retained. Current transition behavior is documented under “Focused visual correction status” below; earlier browser-review notes in this file are stale and should not be relied on.
- Local browser review completed in Edge at 1440×1000 and a true 390×844 mobile viewport. The mobile 68px glass control and menu button fit, and the home page loaded one Three.js canvas with its WebGL fallback hidden. Pointer switching displayed the full-screen ink bloom; the palette and saved choice updated immediately. Space-key switching updated `aria-checked` and the live status; with reduced motion emulated, it switched without an ink element. Pointer dragging also changed the theme and saved the new choice.
- First-visit behavior was checked with an emulated light OS preference and no saved local choice; the page initialized light and did not create a saved choice until the visitor switched it.
- The local light-theme home scene was reviewed after adjusting intro text, path, and stars for contrast. Projects cards and the contact form were also opened at 390px; both pages fit the viewport, and the contact inputs now fill their mobile form column.
- `api/`, `src/chat/`, and `src/contact/` were not changed by the theme update; their API contracts and behavior were left intact.
- `assets/Portfolio.glb` exists (about 1.84 MB). The README documents `Idle` and `_walk` clips and a procedural fallback if model loading fails.
- Root `api/chat.js` and `api/contact.js` are present. The retrieval index is checked in at `api/data/knowledgeBase.json`, and `npm run build` invokes the RAG index builder.
- Contact code validates fields on the client and server, has a honeypot and per-instance in-memory rate limit, and supports Resend, SendGrid, or a webhook. It rejects missing/invalid recipient configuration and the placeholder `abc@gmail.com`; the UI keeps entered values when delivery fails. Production delivery is not independently verified.
- `src/data/portfolioData.js` also currently lists `abc@gmail.com` as the displayed profile email; confirm and replace it with the owner's real public contact address when supplied.
- `vercel.json` sets root static output and `cleanUrls`; `.gitignore` ignores `.env*` while allowing `.env.example`. The example contains placeholders only.

## Reported by owner; not independently verified

- The portfolio is reported deployed at `https://hyh-portfolio.vercel.app`.
- ASTRA now displays "AI model unavailable. Displaying verified portfolio excerpts retrieved by vector search." The owner reports the Gemini/chat request returns HTTP 502; matching Vercel logs were not available.
- The owner now reports Resend contact delivery works. Earlier, the browser reported `POST /api/contact` returning HTTP 502 and `GET /favicon.ico` returning 404; no current live form invocation or mailbox receipt was independently checked here.
- The owner reports the OpenAI account/key has no credits. No Vercel deployment, environment settings, function logs, provider dashboard, or live form submission could be inspected here. The root cause of the 502 and whether Gemini is configured in the deployed environment remain unknown. The owner now reports a 502 response on the Gemini/chat path; no matching Vercel function invocation logs were available.

## Contact form: current state and exact next steps

Resend is the configured contact route per the owner report; the latest live delivery was not independently confirmed in this workspace. A 502 means the handler did not receive an accepted delivery response from its configured delivery path; the precise reason must be read from the matching Vercel function invocation.

1. In Vercel Project Settings -> Environment Variables, check Production `CONTACT_RECIPIENT_EMAIL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`. Use the confirmed recipient, not `abc@gmail.com`. Do not expose values.
2. Confirm the sender is permitted by the Resend account/domain. The sample sender is not proof that production delivery is enabled.
3. Open Vercel Function Logs for the exact `POST /api/contact` request and inspect provider/status errors without exposing credentials or message contents. A separate key test is not the same request.
4. Submit a test and confirm receipt at the intended mailbox. Until endpoint success and mailbox receipt are observed, delivery remains unverified.

## Chat/RAG: current state and exact next steps

The app can return vector-retrieved portfolio excerpts without an LLM; that response means no configured LLM returned a usable answer. The code supports `OPENAI_API_KEY`/`OPENAI_MODEL` and `GEMINI_API_KEY`/optional `GEMINI_MODEL`, tries OpenAI first when configured, then Gemini, then local retrieval fallback. Gemini code defaults to `gemini-3.8-flash`, so the model variable is optional.

1. Check that the chosen key exists in Vercel Production environment scope and is attached to the latest deployment; never disclose its value.
2. If using Gemini, confirm `GEMINI_API_KEY` is set for Vercel Production and inspect `api/chat` function logs for provider status/body. `GEMINI_MODEL` is optional; code defaults to `gemini-3.8-flash`. The owner reports an HTTP 502 for chat, but no matching Vercel invocation logs were available. The local provider fallback normally returns HTTP 200 when an LLM call fails; a deployed 502 needs its function/runtime logs diagnosed.
3. Redeploy after any environment change and test a portfolio-grounded question on the deployed site. Confirm the response/provider status in the UI and logs before claiming generated answers work.

## Environment names and remaining setup

Names present in `.env.example`: `CONTACT_RECIPIENT_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `CONTACT_WEBHOOK_URL`, `CONTACT_RATE_LIMIT`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `RATE_LIMIT_MAX_PER_MINUTE`, `MAX_QUERY_LENGTH`, `PORT`. Values are intentionally omitted.

Production still requires owner-managed Vercel environment confirmation, a usable LLM provider key/quota for generated ASTRA answers, and any owner-supplied project media. No videos are currently listed in the repository. Build and local page routing were verified here; live deployment and provider responses were not.


## Focused visual correction status — 2026-11-23

Current code now uses the existing View Transition API for an irregular ink reveal: the old view remains visible and the new theme updates under the advancing reveal. Browsers without that API use a short crossfade; reduced-motion preference switches immediately. This is verified by code inspection, not browser interaction. The renderer still receives theme updates through the existing shared theme manager.

The prior home-scene pass reduced star count/glow, varied star colors, reduced celestial scale, softened nebula textures, and hid coordinates except with `?debug=1`. The latest pass supersedes the prior path layout: movement bounds are broad free-roam bounds and star clusters are scattered across the world. The latest Projects/Skills portal implementation is described below; all visual behavior remains browser-unverified.

Files changed for this correction: `styles/style.css`, `src/theme/themeManager.js`, `portfolio.js`, `src/scene/spaceScene.js`, `src/scene/landmarks.js`, `src/character/avatarController.js`, `src/ui/uiManager.js`, `index.html`; see Git diff for the complete working-tree state. Prior About/UI changes remain present. No contact or chat API files were changed in this pass.

Verification performed for the current portal implementation: `npm run build` succeeded, changed JavaScript passed `node --check`, and local GET requests to `/`, `/about`, and `/projects` returned HTTP 200. The build regenerated `api/data/knowledgeBase.json`; that generated timestamp-only change was reverted. `git diff --check` reported no whitespace errors. The CUA browser-tab host reported browser access unavailable; native Firefox control then stopped because browser URL policy enforcement is unsupported. Do not claim current visual or interaction checks passed.

Contact and chat status remain as reported above: owner reports Resend is working and Gemini chat shows 502, neither live provider behavior was verified in this pass. Review Vercel function logs for the specific failed chat request; retain existing API contracts. Avoid claiming deployment, mail delivery, or generated Gemini answers are verified.

## About Station, Custom Characters, Perspective Grid & Animated Footer — 2026-11-24

### 1. Camera Zoom Clipping Guard
- Clamped minimum zoom in `src/character/avatarController.js` to `minZoom = 4.0`.
- Added strict collision radius guard: camera target position is clamped so it never penetrates within 3.8 units of the avatar center, preventing camera clipping inside the explorer head or torso.

### 2. Walkable About Me Orbital Research Station
- Added `addAboutDestination({ x: 0, z: 120 })` to `src/scene/landmarks.js` and registered in `src/scene/worldJourneyManager.js`.
- Features a full walkable orbital research deck platform, structural orbital perimeter ring, and three purposeful 3D exhibits based strictly on factual resume records:
  1. *Academic Studies Terminal*: NED University Bachelor of Science in Computer Science, Gaming and Animation specialization, emerald holographic screen and academic crest.
  2. *VR Simulation Rig*: VR Games Hub project, haptic feedback, shooting mechanics, simulation core and gyroscopic sensor rings.
  3. *Animation Kinetic Stand*: Blender character modeling, rigging, walk cycle animation, stylized character armature sculpt and kinetic orbit ring.
- Approaching an exhibit within 5.5m or clicking it reveals a detailed story view in the UI and smoothly focuses the camera on the exhibit object (`avatar.focusCameraOn`).
- Full text remains accessible outside the canvas in `about.html` and in the side overlay drawer.

### 3. Optional Custom Characters (NPCs)
- Created `src/character/customCharactersConfig.js` and `src/character/npcManager.js`.
- Configurable asset paths (`modelPath: null` by default) allow supplying GLB characters without breaking or halting the scene if files or animation clips are missing.
- When an approaching player comes within `triggerDistance` (e.g. 4.5–5.0m), triggers the `wave` animation clip once, blends smoothly back to `idle`, and enforces a configurable cooldown (e.g. 8.0s).
- Characters are purely functional environmental guides and are not represented as collaborators or real people.

### 4. Perspective Grid for Contact Section
- Implemented `src/contact/perspectiveGrid.js` adapting the Vengeance perspective-grid concept in pure CSS and vanilla JavaScript (no React dependency).
- Applied as a subtle background to `.contact-card-container` on `about.html`.
- Nearby grid cells and intersection nodes dynamically brighten in response to pointer/mouse position within a localized radius (~140px), without a full-screen wash.
- Supports touch interaction with a momentary highlight on tap/touch.
- Respects `prefers-reduced-motion` by disabling animation loops and rendering a static, muted grid.
- All form inputs, labels, and text remain fully legible and high-contrast against the background.

### 5. Animated Space-Themed Footer
- Added `<footer id="site-footer">` across `index.html`, `about.html`, and `projects.html`.
- Features an orbital transit line with an animated cosmic particle (`animation: footerOrbitTrack 14s linear infinite`), site navigation links, contact link, and interactive legal buttons.
- Created `src/ui/footerManager.js` managing accessible modal dialogs for **Privacy Policy** and **Terms of Use** (accessible via keyboard, escape listener, and modal focus management).
- Disables particle animation when `prefers-reduced-motion: reduce` is detected.
- Uses clean, modestly rounded rectangular controls without purple default gradients, pill shapes, or pixel art.

### 6. Verification Status
- JavaScript syntax check verified via `node --check` across all modified/new files.
- RAG index generation verified via `node scripts/build-rag-index.js` (15 chunks generated successfully).
- Working tree state verified via `git status -s`.
- Visual rendering and browser interaction remain unverified in an automated browser due to local sandbox browser tool limitations; implemented according to explicit technical constraints and specifications.

