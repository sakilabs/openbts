#!/bin/sh

echo "Running database migrations..."
cd /app/packages/drizzle && bun dist/migrate.js
