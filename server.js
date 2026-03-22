const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

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
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
  });
  fs.createReadStream(filePath).pipe(res);
}

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

const server = http.createServer((req, res) => {
  // Strip query string and decode
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Root → index.html
  if (urlPath === '/') {
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  const fsPath = path.join(__dirname, urlPath);

  // 1. Try exact file (handles /Style/style.css, /js/main.js, /images/*, etc.)
  fs.stat(fsPath, (err, stat) => {
    if (!err && stat.isFile()) {
      return serveFile(res, fsPath);
    }

    // 2. Clean URL → try appending .html (handles /about, /services, etc.)
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
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
