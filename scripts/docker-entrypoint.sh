#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_URL" ]; then
  echo "Running database migrations..."
  node api/migrate.js
fi

exec node api/server.js
