#!/bin/bash
set -e

COMMIT_SHA=$(git log --invert-grep --grep="^feat: swap \`OpenBTS\` to \`BTSearch\`" -1 --format="%h")

if [[ "$1" == "client" || "$1" == "server" ]]; then
  SERVICE=$1
  COMMIT_SHA=$COMMIT_SHA docker compose build "$SERVICE"
  docker compose up -d --no-deps "$SERVICE"
else
  COMMIT_SHA=$COMMIT_SHA docker compose build "$@"
fi
