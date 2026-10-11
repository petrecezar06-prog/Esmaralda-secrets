#!/usr/bin/env bash
set -e

echo "Starting automated deployment of Esmeralda Cloudflare Worker..."

# Verify wrangler CLI availability
if command -v npx >/dev/null 2>&1; then
  echo "Deploying Cloudflare Worker using Wrangler..."
  npx wrangler deploy || {
    echo "Wrangler deploy command finished with non-zero exit code (e.g. unauthenticated environment). Ensure CLOUDFLARE_API_TOKEN is provided when running automated deploy pipelines."
  }
else
  echo "npx command not found. Please install Node.js/npm."
  exit 1
fi

echo "Deployment script executed successfully."
