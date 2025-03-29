#!/bin/sh

echo "Running database migrations..."
pnpm --filter @openbts/server db:migrate

echo "Starting server..."
exec pnpm --filter @openbts/server start
