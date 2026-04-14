#!/bin/bash
set -euo pipefail

if [ -f ".next/BUILD_ID" ]; then
  echo "[EB predeploy] Found prebuilt .next output, skipping build"
  exit 0
fi

echo "[EB predeploy] Running Next.js production build"
npm run build
