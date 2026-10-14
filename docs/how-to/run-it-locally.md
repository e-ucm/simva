# Run it locally

## Prerequisites

- Node.js 20 or later (the repo runs `"type": "module"` with ESM).
- No database server, no Keycloak, no object storage required for a first run.

## Start the server

```bash
npm install
npm run dev
```

`npm run dev` runs `npm run rebuild-sqlite` first, because the `sqlite3` native binding has to
match your Node ABI. Then it starts `tsx watch src/server.ts`, which:

1. opens the SQLite database (`SQLLITE_DB_PATH` + `SQLLITE_DB_FILE`, default
   `/data/db/simva_data.db`),
2. applies the umzug migrations in `src/lib/migrations`,
3. creates the tables from `migrate/sqlite/01-schemas.sql` and the views from
   `migrate/sqlite/02-views.sql` — both `IF NOT EXISTS`, so restarting is safe,
4. listens on `SIMVA_API_PORT` (3000).

```bash
curl -s localhost:3000/health | jq     # { "status": true, "db": { "status": true } }
```

## The database is disposable

Both SQL files use `CREATE TABLE IF NOT EXISTS` / `CREATE VIEW IF NOT EXISTS`, and the
migrations are tracked in a `SequelizeMeta` table. If you break a view while experimenting:

```bash
rm -f "$SQLLITE_DB_PATH/$SQLLITE_DB_FILE"
npm run dev
```

If you find yourself fighting the database more than the application, do this.

## Running without Keycloak

Keycloak is optional at runtime. With `SSO_ENABLED=false` the `KeycloakKeyManager` is
inactive and `createOrUpdateKeycloakUser()` returns immediately, so the JWT path is the only
thing standing between you and a working API.

For tests the Keycloak admin client is already mocked:

```
src/tests/__mocks__/keycloak-admin-client.js
src/tests/__mocks__/keycloak-public-key.js
```

## Running without object storage

Set `LRS_ENDPOINT` to an empty/unset value and SIMVA skips the LRS client entirely. Result
and presigned-URL endpoints will fail, but everything else works: activities, sessions,
schedules, permissions, allocation.

```bash
unset LRS_ENDPOINT
```

## Useful environment variables

```bash
LOG_LEVEL=debug          # pino level; debug is very chatty
NODE_ENV=test            # makes the DB :memory: (see config/config.ts)
SQLLITE_DB_PATH=./data   # keep the database inside the repo while experimenting
```

The full list is in the [configuration reference](../reference/configuration.md).

## Without watching

```bash
npm run build
npm start
```

`npm start` rebuilds sqlite, runs the compiled `dist/server.js`, and re-applies the schema on
boot.

## If the port is taken

```bash
SIMVA_API_PORT=3001 npm run dev
```

## If you only want the test suite

```bash
npm test
npm run test:coverage
```

Tests use an in-memory database (`NODE_ENV=test`), create no files, and need no running
services. See [write-a-test.md](./write-a-test.md).