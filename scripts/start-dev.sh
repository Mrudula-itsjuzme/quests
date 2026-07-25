#!/bin/sh
set -eu

export NODE_ENV="${NODE_ENV:-development}"
export DEV_AUTH_ENABLED="${DEV_AUTH_ENABLED:-true}"
export DEV_ALLOW_LEGACY_MUTATIONS="${DEV_ALLOW_LEGACY_MUTATIONS:-true}"
export PROVIDER_MODE="${PROVIDER_MODE:-local}"
export VITE_API_TARGET="${VITE_API_TARGET:-http://127.0.0.1:3001}"

node api/server.js &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT INT TERM
npm run dev -- --host 127.0.0.1 --port 3000
