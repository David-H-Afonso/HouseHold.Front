#!/bin/sh
set -e

# Replace the runtime API URL placeholder in env-config.js.
# Set API_BASE_URL env var on the container to point to your backend.
# Defaults to http://localhost:1127 (CasaOS port).
PLACEHOLDER="HOUSEHOLD_API_URL_PLACEHOLDER"
TARGET="${API_BASE_URL:-http://localhost:1127}"

sed -i "s|${PLACEHOLDER}|${TARGET}|g" /usr/share/nginx/html/env-config.js

echo "[entrypoint] API_BASE_URL set to: ${TARGET}"

exec "$@"
