#!/bin/sh
set -eu

pnpm db:deploy
pnpm db:seed
pnpm admin:create --if-not-exists
