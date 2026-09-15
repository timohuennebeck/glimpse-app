#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres database with stand-ins
# for the Supabase-managed schemas, then runs the SQL test files given as
# arguments. Needs a local Postgres server and psql on PATH.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=glimpse_migration_check
dropdb --if-exists "$DB" >/dev/null 2>&1
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1' EXIT

psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/stubs.sql
for migration in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$migration"
done
for test in "$@"; do
  echo "== $test"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$test"
done
echo OK
