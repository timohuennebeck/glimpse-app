#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres database with stand-ins
# for the Supabase-managed schemas, then runs each SQL test file given as an
# argument against its own fresh copy of it. Needs a local Postgres server and
# psql on PATH.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=glimpse_migration_check
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1' EXIT

# A fresh database per test file. The test files seed the same fixture uuids and
# psql autocommits, so one shared database makes the second file collide on
# `users_pkey` and leaves the whole run order-dependent. Re-applying the
# migrations per file also proves they apply repeatedly from nothing.
prepare() {
  dropdb --if-exists "$DB" >/dev/null 2>&1
  createdb "$DB"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/stubs.sql
  for migration in supabase/migrations/*.sql; do
    psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$migration"
  done
}

if [ "$#" -eq 0 ]; then
  # No test files: still prove every migration applies to an empty database.
  prepare
else
  for test in "$@"; do
    echo "== $test"
    prepare
    psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$test"
  done
fi
echo OK
