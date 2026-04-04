#!/bin/sh

echo "Starting server..."
exec bun --bun /app/apps/server/dist/index.js
