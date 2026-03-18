#!/bin/sh

echo "Running database migrations..."
cd /app/packages/drizzle && node dist/migrate.js && cd /app

echo "Starting server..."
exec node /app/apps/server/dist/index.js
