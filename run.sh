#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm run build
go run ./cmd/server
