#!/bin/sh
set -eu

node api/server.js &
npm run dev -- --host 127.0.0.1 --port 3000
