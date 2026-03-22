const http       = require('http');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');
const { exec }   = require('child_process');
const nodemailer = require('nodemailer');

// ── Load .env ──────────────────────────────────────────────
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (_) { /* .env is optional */ }

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ── SMTP transporter (SSL on port 465) ────────────────────
const smtpTransport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'ardigitaladstudio.in',
  port:   Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'contact@ardigitaladstudio.in',
    pass: process.env.SMTP_PASS || '',
  },
  tls: { rejectUnauthorized: false },
});

// ── Email template: OWNER NOTIFICATION ────────────────────
function ownerEmailHTML({ name, email, phone, service, message, submittedAt }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>New Lead — AR Digital Ad Studio</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#FF6B35 0%,#e05520 100%);padding:32px 40px;text-align:center;">
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
          AR <span style="opacity:0.85;">Digital</span> Ad Studio
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">ardigitaladstudio.in</div>
      </td></tr>

      <!-- Alert badge -->
      <tr><td style="padding:28px 40px 0;text-align:center;">
        <div style="display:inline-block;background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.3);color:#FF6B35;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 18px;border-radius:100px;">
          🔔 New Lead Received
        </div>
      </td></tr>

      <!-- Title -->
      <tr><td style="padding:20px 40px 8px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">
          You have a new enquiry!
        </h1>
        <p style="margin:8px 0 0;font-size:14px;color:#888;">Submitted on ${submittedAt}</p>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:24px 40px 0;">
        <div style="height:1px;background:#2a2a2a;"></div>
      </td></tr>

      <!-- Lead Data Table -->
      <tr><td style="padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ['👤 Full Name',    name    || '—'],
            ['📧 Email',        email   || '—'],
            ['📞 Phone',        phone   || 'Not provided'],
            ['🎯 Service',      service || 'Not specified'],
          ].map(([label, value]) => `
          <tr>
            <td style="padding:12px 16px;background:#222;border-radius:8px;margin-bottom:8px;display:block;">
              <div style="font-size:11px;color:#FF6B35;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${label}</div>
              <div style="font-size:15px;color:#fff;font-weight:600;">${value}</div>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          `).join('')}

          <!-- Message -->
          <tr>
            <td style="padding:16px;background:#222;border-radius:8px;border-left:3px solid #FF6B35;">
              <div style="font-size:11px;color:#FF6B35;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">💬 Message</div>
              <div style="font-size:14px;color:#ccc;line-height:1.7;">${(message || 'No message provided').replace(/\n/g, '<br>')}</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- CTA Buttons -->
      <tr><td style="padding:8px 40px 32px;text-align:center;">
        <a href="mailto:${email}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:6px;">
          Reply by Email
        </a>
        ${phone ? `<a href="tel:${phone.replace(/\s/g,'')}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:6px;">
          Call Now
        </a>` : ''}
        ${phone ? `<a href="https://wa.me/${phone.replace(/[\s\+\-]/g,'')}" style="display:inline-block;background:#1a1a1a;border:1px solid #333;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;margin:6px;">
          WhatsApp
        </a>` : ''}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#111;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
        <p style="margin:0;font-size:12px;color:#555;">This is an automated notification from your website contact form.</p>
        <p style="margin:6px 0 0;font-size:12px;color:#555;">© 2026 AR Digital Ad Studio &bull; ardigitaladstudio.in</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Email template: USER CONFIRMATION ─────────────────────
function userEmailHTML({ name, service }) {
  const serviceDisplay = service || 'Digital Marketing';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Thank You — AR Digital Ad Studio</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#FF6B35 0%,#e05520 100%);padding:40px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
          AR <span style="opacity:0.85;">Digital</span> Ad Studio
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Pilibhit's #1 Digital Marketing Agency</div>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:40px 40px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#fff;line-height:1.3;">
          Thank You, ${name}!
        </h1>
        <p style="margin:0;font-size:15px;color:#888;line-height:1.6;">
          We've received your enquiry about <strong style="color:#FF6B35;">${serviceDisplay}</strong>.<br>
          Our team will get back to you within <strong style="color:#fff;">24 hours</strong>.
        </p>
      </td></tr>

      <!-- What to expect -->
      <tr><td style="padding:0 40px 32px;">
        <div style="background:#222;border-radius:12px;padding:28px;">
          <div style="font-size:13px;font-weight:700;color:#FF6B35;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;">What Happens Next?</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ['01', 'Review',     'We review your enquiry and prepare a tailored strategy for your business.'],
              ['02', 'Discovery Call', "We'll call you within 24 hours for a free, no-obligation consultation."],
              ['03', 'Custom Proposal', 'We send you a detailed proposal with pricing and a clear growth plan.'],
            ].map(([num, title, desc]) => `
            <tr>
              <td width="40" valign="top" style="padding-bottom:20px;">
                <div style="width:32px;height:32px;background:#FF6B35;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;text-align:center;line-height:32px;">${num}</div>
              </td>
              <td style="padding:4px 0 20px 14px;">
                <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;">${title}</div>
                <div style="font-size:13px;color:#888;line-height:1.6;">${desc}</div>
              </td>
            </tr>
            `).join('')}
          </table>
        </div>
      </td></tr>

      <!-- Contact info -->
      <tr><td style="padding:0 40px 32px;">
        <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;">
          <p style="margin:0 0 12px;font-size:13px;color:#888;">Need to reach us sooner? We're always available:</p>
          <div style="margin-bottom:8px;">
            <a href="tel:+919259291668" style="color:#FF6B35;text-decoration:none;font-weight:700;font-size:15px;">📞 +91 92592 91668</a>
          </div>
          <div style="margin-bottom:8px;">
            <a href="https://wa.me/919259291668" style="color:#25D366;text-decoration:none;font-weight:700;font-size:15px;">💬 WhatsApp Us Now</a>
          </div>
          <div>
            <a href="mailto:contact@ardigitaladstudio.in" style="color:#888;text-decoration:none;font-size:14px;">📧 contact@ardigitaladstudio.in</a>
          </div>
        </div>
      </td></tr>

      <!-- Services quick links -->
      <tr><td style="padding:0 40px 32px;text-align:center;">
        <p style="margin:0 0 16px;font-size:13px;color:#666;">While you wait, explore what we do:</p>
        <div>
          ${['SEO Services','Google Ads','Social Media','Web Development'].map(s =>
            `<a href="https://ardigitaladstudio.in/services" style="display:inline-block;background:#222;border:1px solid #333;color:#ccc;text-decoration:none;padding:8px 16px;border-radius:100px;font-size:12px;margin:4px;">${s}</a>`
          ).join('')}
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#111;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
        <div style="margin-bottom:12px;">
          <a href="https://www.facebook.com/ardigitaladstudio" style="color:#555;text-decoration:none;margin:0 8px;font-size:13px;">Facebook</a>
          <a href="https://www.instagram.com/ardigitaladstudio" style="color:#555;text-decoration:none;margin:0 8px;font-size:13px;">Instagram</a>
          <a href="https://www.linkedin.com/company/ardigitaladstudio" style="color:#555;text-decoration:none;margin:0 8px;font-size:13px;">LinkedIn</a>
        </div>
        <p style="margin:0;font-size:12px;color:#444;">© 2026 AR Digital Ad Studio &bull; Pilibhit, Uttar Pradesh, India</p>
        <p style="margin:4px 0 0;font-size:11px;color:#333;">You received this email because you submitted a contact form on ardigitaladstudio.in</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Contact form handler ───────────────────────────────────
function handleContact(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    let data;
    try { data = JSON.parse(body); } catch (_) {
      res.writeHead(400);
      return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
    }

    const { name, email, phone, service, message } = data;

    if (!name || !email) {
      res.writeHead(400);
      return res.end(JSON.stringify({ ok: false, error: 'Name and email are required.' }));
    }

    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const ownerEmail  = process.env.SMTP_USER || 'contact@ardigitaladstudio.in';
    const fromAddress = `"AR Digital Ad Studio" <${ownerEmail}>`;

    try {
      // 1. Notify the owner
      await smtpTransport.sendMail({
        from:    fromAddress,
        to:      ownerEmail,
        replyTo: email,
        subject: `🔔 New Lead: ${name} — ${service || 'General Enquiry'} | AR Digital Ad Studio`,
        html:    ownerEmailHTML({ name, email, phone, service, message, submittedAt }),
      });

      // 2. Confirm to the user
      await smtpTransport.sendMail({
        from:    fromAddress,
        to:      email,
        subject: `We received your enquiry — AR Digital Ad Studio`,
        html:    userEmailHTML({ name, service }),
      });

      console.log(`[contact] ✓ Emails sent for ${name} <${email}>`);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, message: 'Emails sent successfully.' }));
    } catch (err) {
      console.error('[contact] Email error:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: 'Failed to send email. Please try calling us directly.' }));
    }
  });
}

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

// ── Serve a file ──────────────────────────────────────────
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

// ── GitHub webhook signature verify ───────────────────────
function verifyGithubSignature(secret, payload, sigHeader) {
  if (!sigHeader) return !secret;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected));
  } catch (_) { return false; }
}

// ── GitHub webhook handler ────────────────────────────────
function handleWebhook(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const secret    = process.env.WEBHOOK_SECRET || '';
    const sigHeader = req.headers['x-hub-signature-256'] || '';
    const event     = req.headers['x-github-event'] || '';

    if (secret && !verifyGithubSignature(secret, body, sigHeader)) {
      console.log('[webhook] Invalid signature — request rejected');
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      return res.end('Unauthorized');
    }

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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'deploy triggered', time: new Date().toISOString() }));

    const appDir = __dirname;
    const steps = [
      `git config --global --add safe.directory ${appDir}`,
      'git fetch origin main',
      'git reset --hard origin/main',
      'npm install --production --silent 2>/dev/null || true',
      'mkdir -p tmp && touch tmp/restart.txt',
    ].join(' && ');

    exec(steps, { cwd: appDir, env: { ...process.env, HOME: process.env.HOME || '/home/gmnfnice' } }, (err, stdout, stderr) => {
      if (err) {
        console.error('[deploy] Failed:', err.message);
        if (stderr) console.error('[deploy] stderr:', stderr.trim());
      } else {
        console.log('[deploy] ✓ Deployed successfully');
        if (stdout.trim()) console.log('[deploy]', stdout.trim());
      }
    });
  });
}

// ── Main request handler ───────────────────────────────────
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // ── Contact form API ─────────────────────────────────
  if (urlPath === '/api/contact' && req.method === 'POST') {
    return handleContact(req, res);
  }
  // Handle OPTIONS preflight
  if (urlPath === '/api/contact' && req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // ── GitHub webhook ────────────────────────────────────
  if (urlPath === '/webhook' && req.method === 'POST') {
    return handleWebhook(req, res);
  }

  // ── 301 redirects ─────────────────────────────────────
  if (urlPath === '/best-digital-marketing-agency-in-pilibhit') {
    res.writeHead(301, { Location: '/blog/best-digital-marketing-agency-in-pilibhit' });
    return res.end();
  }

  // ── Root → index.html ─────────────────────────────────
  if (urlPath === '/') {
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  // Security: block path traversal
  const fsPath = path.normalize(path.join(__dirname, urlPath));
  if (!fsPath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // Try exact file
  fs.stat(fsPath, (err, stat) => {
    if (!err && stat.isFile()) return serveFile(res, fsPath);
    // Clean URL → try .html
    if (!path.extname(urlPath)) {
      const htmlPath = fsPath + '.html';
      fs.stat(htmlPath, (err2, stat2) => {
        if (!err2 && stat2.isFile()) return serveFile(res, htmlPath);
        notFound(res);
      });
    } else {
      notFound(res);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`AR Digital Ad Studio — server running on http://${HOST}:${PORT}`);
  console.log(`Endpoints: POST /api/contact, POST /webhook`);
});
