# Design Decisions

## Agreed direction and constraints

- Preserve the existing native HTML/CSS/JavaScript and Three.js app. Do not scaffold a second app or introduce React, TypeScript, Vite, or a new dependency for the theme feature.
- The home page remains a cinematic space exploration scene: third-person avatar, scattered star clusters, stars, planets, asteroids, and four portfolio landmarks. Keep About and Projects as navigable content pages with persistent navigation.
- Player movement is free-roam within broad world bounds; do not constrain movement to a path. Scatter the home star clusters and landmarks across the space field rather than arranging them in a straight corridor.
- Projects and Skills are destinations in the existing continuous Three.js scene and renderer. Use visible portal structures with a clear opening, allow both walk-through and accessible navigation entry, and include a return route in each region.
- Projects displays are generated only from `portfolioData.projects`. Project details, screenshots/video, and outbound links must come from the record; null media/links stay absent. Skills planets use the existing category/name data and do not add ratings or proficiency claims.
- Keep the Three.js destinations as the primary experience, with accessible HTML selectors alongside them. Mobile retains the touch D-pad and tap-accessible portals/navigation; if WebGL is unavailable, route to the ordinary Projects catalog and Skills section on About.
- Desktop and mobile use the existing responsive navigation and layout. Keep the theme control compact within navigation and keep all pages/panels readable at narrow widths.
- Day/night is one shared theme state (`src/theme/themeManager.js`), initialized from a saved local choice or OS preference, persisted in local storage, and applied to site CSS and the existing Three.js scene without recreating the renderer or reloading the avatar.
- Keep the existing compact glass-pill toggle with its orbital planet motif and draggable lens in the navigation. It uses button switch semantics, keyboard and pointer operation, visible focus, live status, and reduced-motion support. Maintain contrast and scene landmark/path visibility in both palettes.
- Theme changes use an organic ink-spread reveal from the control/interaction point; the theme update runs as the reveal begins so the advancing edge exposes the new palette. Browsers without View Transitions use a short crossfade; reduced-motion visitors receive an instant switch. Do not add a second WebGL renderer.
- Avatar model and clip names are configured in `src/character/avatarConfig.js`; do not assume replacement assets have the current model's scale, orientation, or clip names.
- About includes profile, education, skills, projects, and contact information/form; the home page includes Education and Skills panels. Use only owner-provided/verified biography, credentials, project facts, and links. Do not invent portfolio content.
- Contact fields use shared light/dark surface and text tokens, with a single-column layout on narrow screens. This is presentation only; retain the existing validation, feedback, and `/api/contact` contract.
- Contact delivery remains server-side; provider credentials stay in environment variables. Retain the existing Resend, SendGrid, and webhook integration behavior.

## Implemented in repository

- Shared persisted day/night manager and toggle controls are present on the three HTML pages; `portfolio.js` forwards theme changes to the scene and landmarks.
- The existing glass-pill orbital control is preserved; the theme transition uses the browser View Transition API with an irregular clip-path reveal, then removes the transition layer. A short crossfade is the fallback. Reduced-motion preference skips animated transition.
- Theme palettes define site CSS and scene values; `spaceScene.js` and `landmarks.js` expose scene theme updates.
- Responsive site styling, WebGL-unavailable fallback links, and procedural avatar fallback are present in code/README.
- Contact API keeps its existing Resend, SendGrid, and webhook server-side provider options; credentials remain server-side.

- The Skills destination contains six orbiting skill planets around the controller-shaped center. Projects destination displays are generated from the seven existing project records. The accessible category/project lists select scene objects and expose real details. About also has a record selector backed by existing education, VR project, and Blender skill data. No ratings, biography facts, screenshots, links, or media were invented. Browser review of the portal journeys remains pending.

## Planned or requiring confirmation

- Any further visual polish, contrast adjustments, or mobile behavior changes should be evaluated in the deployed browser before being called verified.
- New biography, skill, education, project, or media content requires owner-provided facts/assets. No invented content should be added.
- Contact and chatbot provider setup are operational configuration tasks, not confirmed working features; see `STATUS.md`.

- UI redesign direction: retain the Three.js space journey, use an editorial archive treatment on About, keep action controls rectangular, and present skill groups as selectable orbiting planets with an equivalent readable text list. No skill ratings or biography claims are added.
