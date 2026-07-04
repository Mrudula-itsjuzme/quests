#!/bin/sh
set -eu

node api/server.js &
npm run dev -- --host 0.0.0.0 --port 3000
