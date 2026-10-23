#!/usr/bin/env bash
#
# Builds the simva-api image and verifies that the service can be launched on
# its own.
#
# The full cross-service stack (API + front + trace-allocator, plus their
# dependencies) is exercised together by simva-infra, so this check only covers
# this repository's own service.
#
set -euo pipefail

TARGET="${TARGET:-prod}"
IMAGE="simva-api:ci-${TARGET}"
CONTAINER="ci-simva-api"

cache_args=()
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  cache_args=(
    --cache-from "type=gha,scope=simva-api-${TARGET}"
    --cache-to "type=gha,mode=max,scope=simva-api-${TARGET}"
  )
fi

echo "::group::Building simva-api"
docker buildx build \
  --load \
  --target "${TARGET}" \
  --tag "${IMAGE}" \
  "${cache_args[@]}" \
  .
echo "::endgroup::"

container_running() {
  docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null | grep -qx true
}

cleanup() {
  docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Keep the SQLite database and logs in /tmp (the default /data path is not
# writable by the node user). prod runs the compiled/served app directly. dev runs the image's own CMD
# (`npm run dev`) with the checked-out repo mounted over /app, keeping the
# image's node_modules through an anonymous volume, as docker-compose does.
run_args=()
cmd=(node dist/server.js)
if [[ "${TARGET}" == "dev" ]]; then
  run_args=(-v "$(pwd):/app" -v /app/node_modules)
  cmd=()
fi

docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
docker run -d --name "${CONTAINER}" \
  -e SIMVA_API_PORT=3000 \
  -e SQLLITE_DB_PATH=/tmp \
  -e LOG_FOLDER=/tmp \
  "${run_args[@]}" "${IMAGE}" "${cmd[@]}" >/dev/null

# The probe runs inside the container through Node's built-in fetch so that the
# check does not depend on host ports or on curl being installed in the image.
url="http://localhost:3000/health"
probe="fetch('${url}').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"
for _ in $(seq 1 40); do
  if docker exec "${CONTAINER}" node -e "${probe}" >/dev/null 2>&1; then
    echo "OK: simva-api is healthy (HTTP 200 at ${url})"
    exit 0
  fi
  if ! container_running "${CONTAINER}"; then
    break
  fi
  sleep 3
done
echo "::error::simva-api health check failed (no HTTP 200 at ${url})"
docker logs "${CONTAINER}" 2>&1 | tail -n 50 || true
exit 1
