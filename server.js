const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Clean URL Path
  let urlPath = (req.url || '/').split('?')[0];

  // API Subscription Handler
  if (urlPath === '/api/subscribe' || urlPath.startsWith('/api/subscribe')) {
    try {
      const subscribeHandler = require('./api/subscribe');
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
        if (bodyData.length > 1e6) req.destroy();
      });
      req.on('end', async () => {
        try {
          req.body = bodyData ? JSON.parse(bodyData) : {};
        } catch (e) {
          req.body = {};
        }
        await subscribeHandler(req, res);
      });
      return;
    } catch (apiErr) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Serverless API Error' }));
      return;
    }
  }

  // API Prayer Times Handler
  if (urlPath === '/api/prayer-times' || urlPath.startsWith('/api/prayer-times')) {
    try {
      const prayerTimesHandler = require('./api/prayer-times');
      await prayerTimesHandler(req, res);
      return;
    } catch (apiErr) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Serverless API Error' }));
      return;
    }
  }

  // Normalize static root
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  const resolvedPath = path.resolve(ROOT_DIR, '.' + urlPath);

  // Security Check: prevent path traversal outside project root
  if (!resolvedPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Access Denied');
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing to index.html
      const indexPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = (ext === '.html') ? 'no-cache' : 'public, max-age=86400';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    });

    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
  });
}

// Start standalone HTTP server when executed directly (`node server.js`)
if (require.main === module) {
  const server = http.createServer(handler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`RAH E DEEN ISLAM | راہ دین اسلام`);
    console.log(`Server running at: http://localhost:${PORT}/`);
    console.log(`API endpoint ready: http://localhost:${PORT}/api/subscribe`);
    console.log(`==================================================\n`);
  });
}

// Export handler for Vercel (@vercel/node Serverless Function)
module.exports = handler;
