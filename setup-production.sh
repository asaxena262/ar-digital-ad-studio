#!/bin/bash
# ============================================================
# AR Digital Ad Studio — Production Setup Script
# Run this ONCE on the production server to configure auto-deploy
# ============================================================
set -e

REPO_PATH="/home/gmnfnice/repositories/ar-digital-ad-studio"
LOG_DIR="/home/gmnfnice/logs"
REPO_URL="https://github.com/asaxena262/ar-digital-ad-studio.git"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   AR Digital Ad Studio — Production Setup           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Create directories ─────────────────────────────────
mkdir -p "$REPO_PATH"
mkdir -p "$LOG_DIR"
echo "✓ Directories ready"

# ── 2. Clone or pull the repo ─────────────────────────────
if [ -d "$REPO_PATH/.git" ]; then
  echo "✓ Repo already cloned — pulling latest..."
  cd "$REPO_PATH" && git fetch origin main && git reset --hard origin/main
else
  echo "→ Cloning repository..."
  git clone "$REPO_URL" "$REPO_PATH"
fi
echo "✓ Code is up to date"

# ── 3. Install Node.js dependencies ───────────────────────
cd "$REPO_PATH"
if command -v npm &>/dev/null; then
  npm install --production --silent
  echo "✓ Node.js packages installed"
else
  echo "✗ npm not found. Please install Node.js >= 18"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
  exit 1
fi

# ── 4. Install PM2 globally (if not already installed) ────
if ! command -v pm2 &>/dev/null; then
  echo "→ Installing PM2..."
  npm install -g pm2
fi
echo "✓ PM2 available"

# ── 5. Set the webhook secret ─────────────────────────────
echo ""
echo "─────────────────────────────────────────────────────"
echo "  WEBHOOK SECRET SETUP"
echo "─────────────────────────────────────────────────────"
echo ""
read -rp "  Enter a webhook secret (press Enter to generate one): " WEBHOOK_SECRET
if [ -z "$WEBHOOK_SECRET" ]; then
  WEBHOOK_SECRET=$(openssl rand -hex 32)
  echo "  Generated secret: $WEBHOOK_SECRET"
fi

# Export for current session and write to .env file
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" > "$REPO_PATH/.env"
chmod 600 "$REPO_PATH/.env"
export WEBHOOK_SECRET
echo ""
echo "  ✓ Secret saved to $REPO_PATH/.env"
echo "  ✓ KEEP THIS SECRET — you will need it when setting up the GitHub webhook"
echo ""

# ── 6. Start the server with PM2 ─────────────────────────
cd "$REPO_PATH"

# Load .env into environment
set -a; source "$REPO_PATH/.env"; set +a

pm2 delete ar-digital 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
echo "✓ Server started with PM2 (process name: ar-digital)"

# ── 7. Configure PM2 to start on server reboot ───────────
echo ""
echo "─────────────────────────────────────────────────────"
echo "  RUN THE FOLLOWING COMMAND to enable PM2 on reboot:"
pm2 startup | tail -1
echo "─────────────────────────────────────────────────────"
echo ""

# ── 8. GitHub webhook instructions ───────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   GITHUB WEBHOOK SETUP (do this once in GitHub)    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  1. Go to: https://github.com/asaxena262/ar-digital-ad-studio/settings/hooks"
echo "  2. Click 'Add webhook'"
echo "  3. Payload URL:  https://ardigitaladstudio.in/webhook"
echo "  4. Content type: application/json"
echo "  5. Secret:       $WEBHOOK_SECRET"
echo "  6. Events:       Just the push event"
echo "  7. Click 'Add webhook'"
echo ""
echo "  After that, every git push to the main branch will"
echo "  automatically deploy to this server!"
echo ""
echo "✅ Setup complete. Server is running on port 5000."
echo ""
