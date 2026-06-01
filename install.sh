#!/usr/bin/env bash
# jgrep installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/jgrep/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/jgrep/main/install.sh | bash -s -- v1.2.0

set -euo pipefail

REPO="YOUR_GITHUB_USERNAME/jgrep"
REQUESTED_VERSION="${1:-latest}"

# ── colours ─────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"
  CYAN="\033[0;36m"; BOLD="\033[1m"; RESET="\033[0m"
else
  GREEN=""; YELLOW=""; RED=""; CYAN=""; BOLD=""; RESET=""
fi

info()    { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; exit 1; }
heading() { echo -e "\n${BOLD}$*${RESET}"; }

# ── Node.js check ────────────────────────────────────────────────────────────
heading "jgrep installer"

if ! command -v node &>/dev/null; then
  error "Node.js is required but was not found. Install it from https://nodejs.org (≥ 18)."
fi

NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node.js ≥ 18 required (found $(node --version))."
fi
info "Node.js $(node --version)"

if ! command -v npm &>/dev/null; then
  error "npm is required but was not found."
fi
info "npm $(npm --version)"

# ── resolve version ──────────────────────────────────────────────────────────
if [ "$REQUESTED_VERSION" = "latest" ]; then
  echo -e "  Fetching latest release…"
  API_URL="https://api.github.com/repos/${REPO}/releases/latest"
  if command -v curl &>/dev/null; then
    TAG=$(curl -fsSL "$API_URL" | grep '"tag_name"' | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')
  elif command -v wget &>/dev/null; then
    TAG=$(wget -qO- "$API_URL" | grep '"tag_name"' | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')
  else
    error "curl or wget is required."
  fi
  if [ -z "$TAG" ]; then
    error "Could not fetch latest release. Check your connection or visit https://github.com/${REPO}/releases."
  fi
else
  # Accept both "v1.2.0" and "1.2.0"
  TAG="${REQUESTED_VERSION}"
  [[ "$TAG" == v* ]] || TAG="v${TAG}"
fi

VERSION_CLEAN="${TAG#v}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/jgrep-${VERSION_CLEAN}.tgz"

info "Installing jgrep ${CYAN}${TAG}${RESET}"
echo -e "  ${RESET}${DOWNLOAD_URL}${RESET}"

# ── install ──────────────────────────────────────────────────────────────────
npm install -g "$DOWNLOAD_URL"

# ── verify ───────────────────────────────────────────────────────────────────
if command -v jgrep &>/dev/null; then
  INSTALLED=$(jgrep --version 2>/dev/null || echo "?")
  echo ""
  info "${BOLD}jgrep ${INSTALLED} installed successfully${RESET}"
  echo -e "  Run ${CYAN}jgrep --help${RESET} to get started."
  echo -e "  Run ${CYAN}jgrep update${RESET} anytime to upgrade."
else
  warn "jgrep was installed but is not in your PATH."
  echo -e "  Add $(npm root -g)/../bin to your PATH, then restart your shell."
fi
