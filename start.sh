#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

cleanup() {
  echo ""
  warn "Shutting down..."
  [[ -n "${BACKEND_PID:-}" ]]  && kill "$BACKEND_PID"  2>/dev/null && log "Backend stopped"
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null && log "Frontend stopped"
  [[ -n "${DOCKER_PG:-}" ]]    && docker stop pg-order-mgmt >/dev/null 2>&1 && log "PostgreSQL container stopped"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Check prerequisites ───────────────────────────────────────────
command -v node >/dev/null 2>&1 || err "Node.js is not installed. Install Node 24+ via nvm: nvm install 24"
command -v npm  >/dev/null 2>&1 || err "npm is not installed."

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_MAJOR" -lt 24 ]]; then
  warn "Node $(node -v) detected. Node 24+ required."
  if command -v nvm >/dev/null 2>&1; then
    info "Switching via nvm..."
    nvm use 2>/dev/null || nvm install 24
  else
    err "Please install Node 24+. Recommended: nvm install 24"
  fi
fi

# ─── Ensure backend .env ───────────────────────────────────────────
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  log "Creating backend/.env from .env.example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

# ─── Ensure PostgreSQL is running ──────────────────────────────────
source "$BACKEND_DIR/.env"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DOCKER_PG=""

check_pg() {
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null
  else
    nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null
  fi
}

if ! check_pg; then
  if command -v docker >/dev/null 2>&1; then
    info "PostgreSQL not found at $DB_HOST:$DB_PORT — starting Docker container..."
    if docker ps -a --format '{{.Names}}' | grep -q '^pg-order-mgmt$'; then
      docker start pg-order-mgmt >/dev/null 2>&1
    else
      docker run -d --name pg-order-mgmt \
        -e POSTGRES_USER="${DB_USERNAME:-postgres}" \
        -e POSTGRES_PASSWORD="${DB_PASSWORD:-postgres}" \
        -e POSTGRES_DB="${DB_DATABASE:-order_management}" \
        -p "${DB_PORT}:5432" \
        postgres:15-alpine >/dev/null 2>&1
    fi
    DOCKER_PG="true"
    log "PostgreSQL container started"
  else
    err "PostgreSQL is not available at $DB_HOST:$DB_PORT and Docker is not installed.\n  Please start PostgreSQL manually or install Docker."
  fi
fi

info "Waiting for PostgreSQL to be ready..."
RETRIES=30
until check_pg; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    err "PostgreSQL is not available at $DB_HOST:$DB_PORT after 30 seconds"
  fi
  sleep 1
done
log "PostgreSQL is ready"

# ─── Install dependencies ──────────────────────────────────────────
log "Installing dependencies..."
cd "$ROOT_DIR"
npm install --silent 2>/dev/null || npm install

# ─── Kill stale processes on target ports ───────────────────────────
BACKEND_PORT="${PORT:-4000}"
FRONTEND_PORT=3000
for p in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  PID_ON_PORT=$(lsof -ti:"$p" 2>/dev/null || true)
  if [[ -n "$PID_ON_PORT" ]]; then
    warn "Killing stale process on port $p (PID: $PID_ON_PORT)..."
    echo "$PID_ON_PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done

# ─── Start backend ──────────────────────────────────────────────────
log "Starting backend (port $BACKEND_PORT)..."
cd "$BACKEND_DIR"
NODE_ENV=development npm run start:dev &
BACKEND_PID=$!

info "Waiting for backend to be ready..."
RETRIES=30
until curl -sf http://localhost:${PORT:-4000}/api/docs >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    err "Backend failed to start. Check logs above."
  fi
  sleep 1
done
log "Backend is ready (seed data auto-loaded on first run)"

# ─── Start frontend ────────────────────────────────────────────────
log "Starting frontend (port 3000)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

sleep 2

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Project is running!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Frontend${NC}  → http://localhost:3000"
echo -e "  ${CYAN}Backend${NC}   → http://localhost:${PORT:-4000}/api"
echo -e "  ${CYAN}Swagger${NC}   → http://localhost:${PORT:-4000}/api/docs"
echo ""
echo -e "  ${YELLOW}Login credentials:${NC}"
echo -e "    manager  / password123  (Manager role)"
echo -e "    staff    / password123  (Warehouse Staff role)"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"
echo ""

wait
