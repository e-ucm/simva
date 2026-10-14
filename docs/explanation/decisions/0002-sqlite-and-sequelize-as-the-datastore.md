# ADR-0002 — SQLite and Sequelize as the datastore

- **Status:** Accepted
- **Date:** 2026-01-22 (after two discarded attempts)

## Context

SIMVA's own data is a relational schema with a fixed shape: study → session → activity, plus
permissions, participants, completion, tags and allocation. Every useful read joins most of
them, filtered by the calling user.

The volume argument never favoured a database server. The heavy data — xAPI statements and
result files — was already destined for object storage and an LRS (ADR-0008), so the metadata
was never the problem SQLite has.

The question was whether to run MongoDB, MySQL, or SQLite, and how much of the ORM to use.

## Attempts

| Attempt | Commits | Lines | Outcome |
| --- | --- | ---: | --- |
| MySQL alongside MongoDB | `eeaeea8` (2025-12-15) | +3,933/−688 | Abandoned |
| Sequelize + SQLite, in JavaScript | `8e801ac` (2025-12-19) | +1,832/−317 | Deleted three weeks later by the rewrite |
| Sequelize + SQLite, in TypeScript | `cddf34f` (2026-01-22) | +2,004 | Kept |

The MySQL attempt is the interesting one. It added a SQL model layer on top of the existing
MongoDB code rather than replacing it, and a month later both `src/lib/sql.model.js` and
`src/lib/db.js` were deleted. Whatever the prototype demonstrated, it did not survive contact
with the requirement.

## Decision

One SQLite file, accessed through Sequelize, with reads expressed as SQL views and query
templates rather than ORM includes.

```ts
// src/lib/db.ts
const sequelize = new Sequelize({ dialect: 'sqlite', storage: NODE_ENV === 'test' ? ':memory:' : config.db.complete_path, logging: false });
```

Both schema and views are re-applied on every boot with `IF NOT EXISTS`, so a clean checkout
and a restarted server converge on the same shape.

## Consequences

**Positive**

- **No service to operate.** The metadata lives in a file on a volume. Deploying is copying a
  container.
- **Cheap tests.** `NODE_ENV=test` swaps the storage for `:memory:`, so the suite creates no
  files and needs no teardown beyond closing the connection.
- **A real schema.** Foreign keys, `PRAGMA foreign_key_list` for migrations, and constraints
  the MongoDB version never had — visible in `2026-05-01-fix-sessions-tags-foreign-key.ts`,
  which exists to correct a foreign key.
- **The database can be thrown away and rebuilt** from the SQL files, which is what makes
  experimentation cheap.

**Negative**

- **The deployment lost MongoDB's flexibility for the one schema that kept changing.** The
  activity model went from a single collection to three tables and a discriminator in a
  single year.
- **SQLite has no `DISTINCT ON`.** `95b85ec` used it anyway in a tag query; the result was
  worked around rather than fixed.
- **`sequelize.sync()` in tests does not create views.** Tests build tables from the models, so
  a test can pass against a schema production does not have.
- **Model and schema are two definitions and they drift.** `mongo_id` was dropped from the
  tables in February 2026 (`0d8cd47`) and stayed declared in five models until August
  (`fa9b864`) — five and a half months.

## Why the reads are not ORM queries

Separate decision, documented in
[ADR-0005](./0005-layered-architecture-with-sql-views.md), because it is what made the SQL
choice expensive as well as cheap.

## Evidence

- `eeaeea8`, `8e801ac` — the discarded attempts
- `cddf34f` — the models, views and templates
- `8430d3e` — `01-schemas.sql`, `02-views.sql`, `migrate/migrate.py`
- `0d8cd47`, `fa9b864` — the `mongo_id` removal and its five-month tail
- `95b85ec` — `DISTINCT ON` on SQLite

## Related

- [Persistence: SQLite and SQL views](../persistence-sqlite-and-views.md)
- [ADR-0014](./0014-umzug-migrations-and-a-python-backfill.md)
- [Data model reference](../../reference/data-model.md)