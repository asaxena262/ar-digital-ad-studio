#!/bin/bash
# ============================================================
# AR Digital Ad Studio — cPanel Production Setup Script
# Run this ONCE inside your cPanel terminal (SSH access)
# ============================================================
set -e

REPO_PATH="/home/gmnfnice/repositories/ar-digital-ad-studio"
REPO_URL="https://github.com/asaxena262/ar-digital-ad-studio.git"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   AR Digital Ad Studio — cPanel Setup               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Create the app directory ───────────────────────────
mkdir -p "$REPO_PATH"
echo "✓ Directory: $REPO_PATH"

# ── 2. Clone or update the repo ───────────────────────────
if [ -d "$REPO_PATH/.git" ]; then
  echo "→ Repo exists — pulling latest code..."
  cd "$REPO_PATH"
  git config --global --add safe.directory "$REPO_PATH"
  git fetch origin main
  git reset --hard origin/main
else
  echo "→ Cloning repository..."
  git clone "$REPO_URL" "$REPO_PATH"
  cd "$REPO_PATH"
  git config --global --add safe.directory "$REPO_PATH"
fi
echo "✓ Code is up to date"

# ── 3. Install Node.js packages ───────────────────────────
cd "$REPO_PATH"
npm install --production
echo "✓ npm packages installed"

# ── 4. Create the tmp directory (for Passenger restart) ───
mkdir -p "$REPO_PATH/tmp"
echo "✓ tmp/ directory ready (used by Passenger to restart)"

# ── 5. Generate a webhook secret ─────────────────────────
echo ""
echo "──────────────────────────────────────────────────────"
echo "  WEBHOOK SECRET"
echo "──────────────────────────────────────────────────────"
read -rp "  Enter a webhook secret (press Enter to auto-generate): " WEBHOOK_SECRET
if [ -z "$WEBHOOK_SECRET" ]; then
  WEBHOOK_SECRET=$(openssl rand -hex 32)
  echo ""
  echo "  Generated: $WEBHOOK_SECRET"
fi

# Write .env file (server.js loads this automatically)
cat > "$REPO_PATH/.env" <<EOF
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=$WEBHOOK_SECRET
EOF
chmod 600 "$REPO_PATH/.env"
echo ""
echo "  ✓ .env file written — KEEP YOUR SECRET SAFE"
echo "  Secret: $WEBHOOK_SECRET"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║   NEXT STEPS — do these in cPanel                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  ① In cPanel → 'Setup Node.js App':"
echo "     • Node.js version:    18.x or 20.x"
echo "     • Application mode:   Production"
echo "     • Application root:   repositories/ar-digital-ad-studio"
echo "     • Application URL:    ardigitaladstudio.in (or /)"
echo "     • Application startup file: server.js"
echo "     → Click 'CREATE' then 'RUN NPM INSTALL'"
echo ""
echo "  ② In cPanel → 'Setup Node.js App' → set env vars:"
echo "     • WEBHOOK_SECRET = $WEBHOOK_SECRET"
echo "     • PORT           = 3000"
echo "     • NODE_ENV       = production"
echo "     (These are read automatically from .env too)"
echo ""
echo "  ③ Add the GitHub Webhook:"
echo "     URL:  https://github.com/asaxena262/ar-digital-ad-studio"
echo "     Path: Settings → Webhooks → Add webhook"
echo "       • Payload URL:  https://ardigitaladstudio.in/webhook"
echo "       • Content type: application/json"
echo "       • Secret:       $WEBHOOK_SECRET"
echo "       • Events:       Just the push event ✓"
echo "       • Click 'Add webhook'"
echo ""
echo "  ④ Test it:"
echo "     Push any commit from Replit → GitHub"
echo "     Your site will auto-update within 30 seconds!"
echo ""
echo "✅ Setup complete."
echo ""
