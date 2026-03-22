const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

// Load .env file into process.env (works without any extra packages)
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val; // don't overwrite real env vars
    }
  }
} catch (_) { /* .env is optional */ }

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ── MIME types ────────────────────────────────────────────
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.xml':  'application/xml',
  '.txt':  'text/plain',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.pdf':   'application/pdf',
};

// ── Serve a file ─────────────────────────────────────────
function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
  });
  fs.createReadStream(filePath).pipe(res);
}

// ── 404 handler ───────────────────────────────────────────
function notFound(res) {
  const custom404 = path.join(__dirname, '404.html');
  if (fs.existsSync(custom404)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(custom404).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — Page Not Found</h1>');
  }
}

// ── GitHub webhook: verify HMAC-SHA256 signature ──────────
function verifyGithubSignature(secret, payload, sigHeader) {
  if (!sigHeader) return !secret; // if no secret set, allow all
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

// ── GitHub webhook handler ────────────────────────────────
function handleWebhook(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const secret    = process.env.WEBHOOK_SECRET || '';
    const sigHeader = req.headers['x-hub-signature-256'] || '';
    const event     = req.headers['x-github-event'] || '';

    // Verify signature
    if (secret && !verifyGithubSignature(secret, body, sigHeader)) {
      console.log('[webhook] Invalid signature — request rejected');
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      return res.end('Unauthorized');
    }

    // Only act on push events to main branch
    if (event !== 'push') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('Event ignored');
    }

    let payload;
    try { payload = JSON.parse(body); } catch (_) { payload = {}; }

    if (payload.ref !== 'refs/heads/main') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('Branch ignored');
    }

    console.log('[webhook] Push to main received — deploying...');

    // Respond immediately so GitHub doesn't time out
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Deploy triggered');

    // Pull latest code, then reload PM2 (if running) or just log
    const deployCmd = [
      'git fetch origin main',
      'git reset --hard origin/main',
      'npm install --production --silent 2>/dev/null || true',
      // Reload PM2 if it's managing this process; fall back gracefully
      'pm2 reload ar-digital --update-env 2>/dev/null || true',
    ].join(' && ');

    exec(deployCmd, { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error('[deploy] Error:', err.message);
        console.error('[deploy] stderr:', stderr);
      } else {
        console.log('[deploy] Success:', stdout.trim());
      }
    });
  });
}

// ── Main request handler ──────────────────────────────────
const server = http.createServer((req, res) => {
  // Strip query string and decode URI
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // ── GitHub webhook endpoint ───────────────────────────
  if (urlPath === '/webhook' && req.method === 'POST') {
    return handleWebhook(req, res);
  }

  // ── Root → index.html ─────────────────────────────────
  if (urlPath === '/') {
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  // Security: block path traversal attempts
  const fsPath = path.normalize(path.join(__dirname, urlPath));
  if (!fsPath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // ── 1. Try exact file (CSS, JS, images, XML, etc.) ───
  fs.stat(fsPath, (err, stat) => {
    if (!err && stat.isFile()) {
      return serveFile(res, fsPath);
    }

    // ── 2. Clean URL: any path without extension → try .html
    //    e.g. /blog → blog.html  |  /about → about.html
    //    Works automatically for any new page you add — no config needed.
    if (!path.extname(urlPath)) {
      const htmlPath = fsPath + '.html';
      fs.stat(htmlPath, (err2, stat2) => {
        if (!err2 && stat2.isFile()) {
          return serveFile(res, htmlPath);
        }
        notFound(res);
      });
    } else {
      notFound(res);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`AR Digital Ad Studio — server running on http://${HOST}:${PORT}`);
  console.log(`Webhook endpoint: POST /webhook`);
});
