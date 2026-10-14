# Persistence: SQLite and SQL views

## Why SQLite

SIMVA's own data is small and shaped like a relational schema: a study contains sessions
contains activities, and every read needs the same five joins — permissions, participants,
completion state, tags, allocation. Object storage was always reserved for the *large*,
*append-heavy* data (traces, results); the metadata was never the problem SQLite had.

The choice came late and by elimination. The history shows three attempts:

| Attempt | Commit | Outcome |
| --- | --- | --- |
| MySQL | `eeaeea8` (2025-12-15) | +3,933 lines, abandoned; survives only on branch `mongo-mysql` |
| Sequelize + SQLite in JavaScript | `8e801ac` (2025-12-19) | deleted three weeks later by the TypeScript rewrite |
| Sequelize + SQLite in TypeScript | `cddf34f` (2026-01-22) | kept |

The MySQL experiment is the interesting one: 3,933 lines added to keep the existing MongoDB
code working against a SQL store, and then abandoned rather than finished. Whatever it
demonstrated, a separate database server was not worth the operational cost for a service
whose metadata fits comfortably in one file — especially when the heavy data was already
elsewhere.

One SQLite file also makes the deployment story simple: a volume, a file, and
`CREATE TABLE IF NOT EXISTS` on boot.

## Why the reads live in SQL views

The deciding factor was not performance — it was that a simlet listing is not expressible
readably as an ORM query.

`GET /simlets` returns, for each study: the sessions, for each session the activities, for
each activity the completion rows; plus the tags; plus which permissions the *calling* user
holds on the study and, indirectly, on its sessions; plus whether the caller is an
administrator (which changes what `deletedAt` filtering does); plus search, limit, offset and
ordering. Written as a Sequelize `include` graph that is unreadable and impossible to
permission-filter cleanly.

So the complex reads became SQL views:

```sql
-- migrate/sqlite/02-views.sql, roughly
CREATE VIEW IF NOT EXISTS v_complete_simlets_users_permissions AS ...
```

23 of them, in two families: `v_*` for application-facing aggregates, `vv_*` for the
permission and allocator intermediates the others build on.

And because a view is not callable with parameters, the parameterised reads live in query
templates:

```ts
// src/lib/views/simlets.queries.ts
export const getSimletsByUserId: QueryTemplate = {
  description: 'gets simlets visible to a user, with sessions, tags and permissions',
  sql: `SELECT ... FROM v_complete_simlets_users_permissions
        WHERE (current_user_id IS NULL OR :current_user_id IS NULL
               OR (:is_admin IS TRUE OR deletedAt IS NULL))
        ORDER BY {{orderBy}} {{order}}
        LIMIT :limit OFFSET :offset`,
  params: [ { name: 'current_user_id', type: 'number' }, ... ],
};
```

`runViewQuery()` validates the params against their declared types, substitutes the
order-by placeholders from a whitelist, and executes with Sequelize `replacements` — so
nothing a caller sends is ever concatenated into SQL.

## The two idioms every view uses

**Optional filters:**

```sql
AND (:param IS NULL OR col = :param)
```

One view serves "list everything" and "list this one". The alternative — two views per filter
combination — did not scale past the first few filters.

**Permission scoping:**

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

The second clause is the origin of `is_admin` as a *data visibility* flag. It is not an
authorization decision: the authorization decision already happened, in `roleAllowed()`, from
the tag matrix. `is_admin` decides what the caller can *see inside* a route they are already
allowed to call.

## What that architecture costs

**`02-views.sql` is the bottleneck.** Every significant 2026 feature ended in that file:

| Feature | Commits touching the views |
| --- | --- |
| Soft delete | `c186629`, `2f5d86e` |
| Tag visibility | `7674cce`, `85b85ec` |
| Indirect permissions | `a28d71b`, `3286357`, `766ff1f` |
| Sandbox filtering | `fb121e5`, `7a26a4e`, `741307f` |
| Session permissions | `d121f5d` |

And one fix can spread: `2f5d86e` added `is_admin` to six query template files plus the view
(+290/−51) because the pattern had to be replicated everywhere by hand.

**The ORM guarantee is not a SQL guarantee.** Sequelize's `paranoid: true` filters deleted
rows for ORM queries and does nothing for a view. When soft delete was introduced, deleted
rows kept appearing until `c186629` hand-patched every query template. See
[soft delete](./soft-delete.md).

**The templates can drift from the views.** They are separate SQL, maintained by hand in
different directories. `2f5d86e` exists because they did.

**PostgreSQL idioms leak in.** `95b85ec` used `DISTINCT ON` — which SQLite does not have — in
a tag query. It was worked around rather than fixed.

## Why the models are not the schema

There are two definitions of the database, and they are not the same:

- `migrate/sqlite/01-schemas.sql` is what the server creates.
- `src/lib/models/**` is what Sequelize and the tests use.

`sync({ force: true })` in tests builds the tables from the models, so a test can pass against
a schema that production does not have. This is not hypothetical: `mongo_id` was dropped from
the tables in February 2026 (`0d8cd47`) and remained declared in five models until August
(`fa9b864`).

## Migrations, and why there are two systems

| System | File | Purpose |
| --- | --- | --- |
| One-off backfill | `migrate/migrate.py` | MongoDB export → SQLite, in Python, with its own Dockerfile |
| Forward migrations | `src/lib/migrations/*.ts` | Schema evolution, umzug, run at boot |

The Python tool is not part of the application and does not run at boot. It is for the
migration off MongoDB and nothing else. Keeping it in Python was cheaper than rewriting an
existing script; it was last touched in June 2026.

The umzug migrations are dated-prefixed and run in filename order, which is how the file names
double as the migration history. They must be idempotent by inspection, because SQLite has no
`ADD COLUMN IF NOT EXISTS` — see `2026-05-01-fix-sessions-tags-foreign-key.ts`, which reads
`PRAGMA foreign_key_list` and skips itself when the table is already correct.

## Related

- [Data model reference](../reference/data-model.md)
- [ADR-0002 — SQLite and Sequelize as the datastore](./decisions/0002-sqlite-and-sequelize-as-the-datastore.md)
- [ADR-0005 — layered architecture and SQL views](./decisions/0005-layered-architecture-with-sql-views.md)
- [soft delete](./soft-delete.md)