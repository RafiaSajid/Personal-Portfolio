# Rafia Gull Portfolio

Interactive Three.js portfolio with About and Projects pages, a procedural/GLB avatar, and the ASTRA portfolio question-answering assistant. It uses native HTML, CSS, and JavaScript modules. The `api/` directory contains Vercel serverless handlers for chat and contact; `local-server.js` provides a dependency-free local server for the same routes.

## Requirements

- Node.js 20 or newer
- npm
- A modern browser with WebGL for the 3D scene (the About and Projects pages remain usable without WebGL)

## Install and run locally

```sh
npm install
cp .env.example .env
npm start
```

On Windows PowerShell, copy the example with `Copy-Item .env.example .env`. Edit `.env` to add credentials and your confirmed contact recipient. The local server reads `.env`; environment variables already set in the shell take precedence. Open `http://localhost:8000`. Direct page routes work at `/`, `/about` (or `/about.html`), and `/projects` (or `/projects.html`). The form is at `/about#contact-section`.

No third-party package installation is needed by the app itself. `npm install` is harmless when there are no dependencies and creates the usual local npm metadata.

## Build and deploy on Vercel

The Vercel project uses the repository root. The build command is `npm run build`, which rebuilds `api/data/knowledgeBase.json` from the structured portfolio data. Vercel serves the root HTML files as static pages, recognizes `api/chat.js` and `api/contact.js` as serverless functions, and `cleanUrls` allows both extensionless and `.html` page URLs. No custom API rewrite is needed.

1. Push the repository to GitHub and import it in Vercel.
2. Keep the root directory as `.` and set the build command to `npm run build`. There is no separate output directory to configure.
3. Add the server-side environment variables listed below in Vercel Project Settings for each intended environment.
4. Deploy, then open `/`, `/about`, `/projects`, and submit a contact form after configuring a real recipient and provider.

The committed `assets/Portfolio.glb` is about 1.8 MB and is served as a static asset, which is within Vercel's static asset limits. Add project images and videos under `assets/` and reference them with relative paths in the data. Keep large media reasonably compressed; use an external video host for large/streaming videos rather than committing very large video files to Git. There are currently no video files in the repository.

The main page detects WebGL support and shows a fallback with links to the About and Projects pages if WebGL is unavailable. The 3D scene cannot render in that case, but the content pages do not depend on WebGL.

## Environment variables

Copy `.env.example` to `.env` for local use, or add variables in Vercel settings. Never commit `.env` or real credentials. The repository ignores `.env*` files while allowing the placeholder-only `.env.example`.

| Variable | Purpose |
| --- | --- |
| `CONTACT_RECIPIENT_EMAIL` | Confirmed destination for contact submissions. `abc@gmail.com` is a placeholder and the API rejects it. |
| `RESEND_API_KEY` | Resend server-side API key (recommended provider). |
| `RESEND_FROM_EMAIL` | Sender identity accepted by Resend; use a verified domain in production. |
| `SENDGRID_API_KEY` | Optional SendGrid server-side API key. |
| `SENDGRID_FROM_EMAIL` | Optional verified SendGrid sender address. |
| `CONTACT_WEBHOOK_URL` | Optional server-side contact delivery webhook, used after email providers if configured. |
| `CONTACT_RATE_LIMIT` | Contact requests allowed per IP per 10 minutes (default `5`). |
| `OPENAI_API_KEY` | Optional key for grounded ASTRA answer generation. |
| `OPENAI_MODEL` | OpenAI model (default `gpt-4o-mini`). |
| `GEMINI_API_KEY` | Optional alternative key for Gemini answer generation. |
| `GEMINI_MODEL` | Gemini model (default `gemini-3.8-flash`). |
| `RATE_LIMIT_MAX_PER_MINUTE` | ASTRA requests allowed per IP per minute (default `15`). |
| `MAX_QUERY_LENGTH` | Maximum ASTRA question length (default `500`). |
| `PORT` | Local development server port (default `8000`). |

Example values are in `.env.example`; replace placeholders before expecting external service behavior. Contact submissions are not reported as delivered unless a configured provider accepts them. Without a confirmed recipient and working provider, the endpoint returns a configuration or delivery error and the browser preserves the entered fields. The IP rate limiter uses in-memory state, so on Vercel it is best-effort per warm function instance rather than a shared, durable limit.

ASTRA always retrieves from the generated portfolio index. With a configured OpenAI or Gemini key it can generate a grounded answer from retrieved records. Without an LLM key, it returns the retrieved portfolio excerpts; that fallback is not a generated answer. No live deployment or external provider configuration is included in this repository.

## Configure the GLB avatar

The project currently points to `./assets/Portfolio.glb` in `src/character/avatarConfig.js`. To use another model, place the `.glb` or `.gltf` file under `assets/`, set `modelPath` to its relative URL, and update `scale`, `positionOffset`, and `rotationOffset` for the model's units and facing direction. Set `modelPath: null` to use the procedural explorer.

Set `animationNames.idle` and `animationNames.walk` to the exact names of the corresponding clips embedded in the model. The current names are `Idle` and `_walk`; update them if the replacement model uses different names. If a model fails to load, the controller falls back to the procedural avatar.

## Add a project and media

Add a record to the `projects` array in `src/data/portfolioData.js`. Use a unique URL-safe `id`, then provide the title, category, technologies, summary, and details. Set `thumbnail` and `videoUrl` to relative asset URLs (or a suitable hosted URL); set either to `null` when no media exists. The Projects catalog and RAG source content are generated from this structured data. Keep links accurate and only add media you have permission to publish.

After changing profile, education, skills, certifications, or projects, refresh the chatbot index:

```sh
npm run build:rag
```

This writes `api/data/knowledgeBase.json`; `npm run build` runs the same script for Vercel deployments. Review generated content before deploying, especially if you add private or unverified information. A valid provider key is required for LLM-generated answers; the local retrieval fallback can be used without one.

## Configure contact delivery

The form is on the About page and posts to `/api/contact`. The browser and server validate name (2-100 characters), email (valid format, up to 150 characters), subject (2-150 characters), and message (10-3,000 characters). A hidden honeypot catches simple bots and the endpoint applies an in-memory per-IP limit.

To enable real delivery:

1. Confirm the actual recipient address and set `CONTACT_RECIPIENT_EMAIL` in `.env` or Vercel settings. The placeholder `abc@gmail.com` is deliberately refused.
2. Configure either `RESEND_API_KEY` and a permitted `RESEND_FROM_EMAIL`, or `SENDGRID_API_KEY` and a verified `SENDGRID_FROM_EMAIL`. A server-side `CONTACT_WEBHOOK_URL` is also supported.
3. Submit a real test after deployment and confirm receipt at the destination. A successful HTTP response from a provider is the only success condition shown by the form.

Credentials are read only by the server handlers. The application does not log API keys or message bodies. Provider setup, recipient confirmation, and delivery have not been completed or verified by this repository change.
