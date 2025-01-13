#!/bin/sh

echo "Running database migrations..."
pnpm --filter @btsfinder/server db:migrate

echo "Starting server..."
exec pnpm --filter @btsfinder/server start
