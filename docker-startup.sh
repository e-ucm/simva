#!/usr/bin/env bash
set -euo pipefail
[[ "${DEBUG:-false}" == "true" ]] && set -x

if [[ ! -d "./node_modules" ]]; then
  npm install
fi

if [[ "${NODE_ENV:-production}" == "development" ]]; then
  npm install -g nodemon
  npm install -g bunyan
  npm run dev
else
  npm start
fi