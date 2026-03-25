#!/bin/bash
set -euo pipefail

echo "[EB predeploy] Running Next.js production build"
npm run build
