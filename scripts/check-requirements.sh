#!/usr/bin/env bash
set -e

MISSING=()

check() {
  local name=$1
  local cmd=$2
  local install_hint=$3
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ $name: NOT FOUND"
    echo "   Install: $install_hint"
    MISSING+=("$name")
  else
    echo "✅ $name: $($cmd --version 2>&1 | head -1)"
  fi
}

echo "Checking required tools for Scrolls..."
echo ""

check "make"     "make"     "brew install make (macOS) / sudo apt install make (Linux)"
check "git"      "git"      "https://git-scm.com/downloads"
check "node"     "node"     "nvm install --lts && nvm use --lts — see https://github.com/nvm-sh/nvm"
check "npm"      "npm"      "Ships with Node.js — install Node first"
check "supabase" "supabase" "https://supabase.com/docs/guides/cli/getting-started"

echo ""
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "Missing tools: ${MISSING[*]}"
  echo "Install all missing tools before running 'make dev'."
  exit 1
else
  echo "All requirements met."
fi
