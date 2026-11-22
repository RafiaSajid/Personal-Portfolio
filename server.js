/**
 * Local Development Server
 * Serves static portfolio files and routes `/api/chat` and `/api/contact`
 *
 * Usage: node server.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load a local .env file without a runtime dependency. Existing shell variables
// take precedence, matching the behavior of common dotenv loaders.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[match[1]] = value;
  }
}

// Import handlers after local environment variables are loaded.
const [{ default: chatHandler }, { default: contactHandler }] = await Promise.all([
  import('./api/chat.js'),
  import('./api/contact.js')
]);

const PORT = parseInt(process.env.PORT || '8000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // 1. API Routes (/api/chat and /api/contact)
  if (pathname === '/api/chat' || pathname === '/api/contact') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      if (bodyData.length > 1e6) {
        req.destroy(); // Protect against payload flood
      }
    });

    req.on('end', async () => {
      let parsedBody = {};
      try {
        if (bodyData) parsedBody = JSON.parse(bodyData);
      } catch (e) {
        parsedBody = bodyData;
      }
      req.body = parsedBody;

      res.status = function(code) {
        this.statusCode = code;
        return this;
      };

      res.json = function(data) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
        return this;
      };

      try {
        if (pathname === '/api/chat') {
          await chatHandler(req, res);
        } else if (pathname === '/api/contact') {
          await contactHandler(req, res);
        }
      } catch (err) {
        console.error(`Unhandled server error in ${pathname}:`, err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      }
    });

    return;
  }

  // 2. Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Check clean URLs fallback (e.g. /about -> /about.html)
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<h1>404 Not Found</h1><p>Cannot find ${pathname}</p>`);
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Running locally at: http://localhost:${PORT}`);
  console.log(`[Server] API chat route: http://localhost:${PORT}/api/chat`);
  console.log(`[Server] API contact route: http://localhost:${PORT}/api/contact`);
});
