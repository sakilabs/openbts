#!/bin/bash
set -e

COMMIT_SHA=$(git rev-parse --short HEAD)

COMMIT_SHA=$COMMIT_SHA docker compose build "$@"
