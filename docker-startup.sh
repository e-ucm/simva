#!/usr/bin/env bash
set -euo pipefail
[[ "${DEBUG:-false}" == "true" ]] && set -x

if [[ ! -d "./node_modules" ]]; then
  npm install
fi

if [[ "${NODE_ENV:-production}" == "development" ]]; then
  npm run dev
  #perf record -e cycles:u -g -- npm run dev > perf.out
else
  npm start
fi