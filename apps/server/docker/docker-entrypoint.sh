#!/bin/sh

echo "Running database migrations..."
cd /app/packages/drizzle && bun dist/migrate.js && cd /app

echo "Starting server..."
exec bun --bun /app/apps/server/dist/index.js
