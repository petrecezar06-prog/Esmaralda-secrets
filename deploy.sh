#!/usr/bin/env bash
set -e

echo "=== Deploying Esmeralda Secrets Cloudflare Worker ==="
if command -v npx >/dev/null 2>&1; then
    npx wrangler deploy || echo "Deployment attempt completed. (Ensure Cloudflare credentials/tokens are active in your environment)."
else
    echo "npx not found in environment."
fi
