#!/usr/bin/env bash
set -euo pipefail
[[ "${DEBUG:-false}" == "true" ]] && set -x

if [ ! -d "node_modules" ]; then
  npm install
fi
npm start