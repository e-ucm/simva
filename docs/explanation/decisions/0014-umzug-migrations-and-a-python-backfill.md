# ADR-0014 — umzug forward migrations, plus a separate one-off Python backfill

- **Status:** Accepted
- **Date:** 2026-02-25 (umzug); 2026-01-22 (the Python backfill)

## Context

Two different problems were being conflated under "migration":

1. **Moving the existing installation off MongoDB** — a one-off, large, destructive, run once
   per deployment, against a MongoDB export.
2. **Changing the schema from now on** — small, additive, run on every deployment, tracking
   which ones have already run.

Using one mechanism for both is the usual mistake. A bootstrap migration that runs on every
boot needs to be idempotent against production data it has already processed; a forward
migration system needs to know what it has already done.

## Decision

Two separate systems, in two languages, for two different jobs.

### The backfill: `migrate/`, in Python

```
8430d3e  2026-01-22  migrate/migrate.py (643 lines), 01-schemas.sql, 02-views.sql
                    plus migrate/Dockerfile and migrate/requirements.txt
```

A one-shot tool that reads a MongoDB export and writes SQLite: users, groups, simlets,
sessions, activities, allocation, permissions, tags. It is not part of the application, does
not run at boot, and has its own container so the Python toolchain stays out of the Node
image. `9ec8d74` added the behaviour of exiting cleanly with a log line when the backup files
are absent — which is what runs in production, where there is no Mongo export.

It was cheaper to finish an existing Python script than to port it, and it was last touched in
June 2026, which suggests it did its job.

### Forward migrations: umzug, in TypeScript

```
5d9b436  2026-02-25  feat: enhance build process and add migration support
                    adds umzug, src/lib/migrate.ts, config/config.ts, wired into server.ts
```

`runMigrations()` runs `src/lib/migrations/*.ts` with `context: db.sequelize.getQueryInterface()`
and `SequelizeStorage`, at boot, after `sequelize.authenticate()` and before the SQL files.

| File | What |
| --- | --- |
| `2026-02-25-migrate-backup-data-to-minio.ts` | local result files to object storage, `mongo_id` → `activity_id` |
| `2026-02-25-migrate-trace-data-in-minio.ts` | rewrite tracker state keys, guarded by an `updated === true` marker |
| `2026-02-26-remove-mongoid-colons.ts` | drop `mongo_id` from five tables, in a transaction with `PRAGMA foreign_keys` off |
| `2026-03-16-migrate-limesurvey-endpoints.ts` | push SIMVA's LRS endpoint into every LimeSurvey survey |
| `2026-05-01-fix-sessions-tags-foreign-key.ts` | correct a foreign key, self-skipping when already correct |
| `2026-08-02-add-deleteAt-to-alltables.ts` | add `deletedAt` to 24 tables |
| `2026-08-06-add-game-type.ts` | add `game_tracker_technology` and `game_technology` |

Note that two of these — the MinIO ones — are migrations off the old datastore too. That is
unavoidable: the end of the MongoDB era was not one commit, it was a sequence.

## Consequences

**Positive**

- **The backfill is disposable.** It has a known input and output, runs once, and can be
  deleted when the last deployment has migrated. It never has to be correct at boot.
- **Forward migrations are tracked.** `SequelizeMeta` knows what has run, so `up()` can be
  written as if it will not run twice.
- **The filename prefix is the order.** `YYYY-MM-DD-description.ts`, sorted. The file names are
  the migration history, readable without a database.
- **`down()` exists.** `2026-03-16` has an empty one, which is honest rather than pretending.

**Negative**

- **SQLite has no `ADD COLUMN IF NOT EXISTS`**, so migrations must inspect first. The pattern
  is visible in the foreign key migration, which reads `PRAGMA foreign_key_list` and skips
  itself when the table is already correct.
- **Idempotence is per-migration discipline, not a guarantee.** One migration
  (`2026-02-25-migrate-trace-data-in-minio.ts`) guards itself with an explicit state marker;
  the others assume `SequelizeMeta`.
- **The schema exists in three places.** `01-schemas.sql`, the umzug migrations, and the
  Sequelize models. They drift: `mongo_id` was dropped from the tables in February 2026
  (`0d8cd47`) and remained in five models until August (`fa9b864`) — five and a half months
  during which the tests were validating a schema that did not exist.
- **There is no `npm run migrate:status`.** The only way to see what has run is to read
  `SequelizeMeta` or to add one.
- **New tables need two edits** — the SQL file for fresh installs and a migration for existing
  ones. Forgetting the migration is silent: a new deployment works, an old one does not.

## The rule for a new schema change

1. `01-schemas.sql` if it is a new table, so fresh databases get it.
2. A umzug migration, always, so existing deployments get it.
3. The Sequelize model, in the same commit.
4. The view and every query template that reads it.

Step 4 is the one that gets missed. See
[how-to: change the database schema](../../how-to/change-the-database-schema.md).

## Evidence

- `8430d3e` — the Python backfill and the SQL files
- `5d9b436` — umzug introduced
- `0d8cd47`, `fa9b864` — the `mongo_id` removal and its five-month model tail
- `9ec8d74` — clean exit when the Mongo export is absent
- `eee7d6d` — a self-skipping foreign key repair
- `2026-09-03-add-login-mode.ts` — created by `c729779`, deleted by `e452e23`: the one migration
  in the history that was removed, which is fine because umzug tracks by filename and the
  column was never deployed

## Related

- [Persistence: SQLite and SQL views](../persistence-sqlite-and-views.md)
- [Data model reference](../../reference/data-model.md)
- [How-to: change the database schema](../../how-to/change-the-database-schema.md)