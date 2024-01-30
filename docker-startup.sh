#!/usr/bin/env bash
set -euo pipefail
[[ "${DEBUG:-false}" == "true" ]] && set -x

if [[ ! -d "node_modules" ]]; then
  npm install
  cksum "./package.json" | cut -d' ' -f1 >> "node_modules/.checksum"
else 
  OldSum=$(cat "node_modules/.checksum")
  NewSum=$(cksum "./package.json" | cut -d' ' -f1)
  if [[ $OldSum != $NewSum ]]; then
    # Checksum mismatch, do something useful here
    rm -rf "node_modules"
    npm install
    echo $NewSum >> "node_modules/.checksum"
  fi
fi

if [[ "${NODE_ENV:-production}" == "development" ]]; then
  npm install -g nodemon
  npm install -g bunyan
  npm run dev
else
  npm start
fi