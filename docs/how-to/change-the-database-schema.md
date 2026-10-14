# Change the database schema

There are three schema sources and they answer to different situations. Using the wrong one is
the most common source of "works on my machine".

| File | Applied | Use it for |
| --- | --- | --- |
| `migrate/sqlite/01-schemas.sql` | every boot, `CREATE TABLE IF NOT EXISTS` | brand new tables on a fresh database |
| `migrate/sqlite/02-views.sql` | every boot, `CREATE VIEW IF NOT EXISTS` | views |
| `src/lib/migrations/*.ts` | once, tracked by umzug | changing anything that already exists |

## 1. Adding a new table

Add it to `01-schemas.sql` **and** add a umzug migration. New installations create the table
from the SQL file; existing ones need the migration.

```ts
// src/lib/migrations/2026-10-20-add-quiz-activities.ts
import { MigrationContext } from 'umzug';

export async function up({ context }: MigrationContext): Promise<void> {
  await context.sequelize.query(`CREATE TABLE IF NOT EXISTS Quiz_Activities (
    activity_id INTEGER PRIMARY KEY,
    quiz_id     INTEGER,
    quiz_language TEXT
  )`);
}

export async function down({ context }: MigrationContext): Promise<void> {
  await context.sequelize.query('DROP TABLE IF EXISTS Quiz_Activities');
}
```

The filename prefix is the ordering. Keep it `YYYY-MM-DD-description.ts`.

## 2. Adding a column

Migrations in this repo write raw SQL through `context.sequelize.query`, because SQLite cannot
express `ALTER TABLE ... ADD COLUMN ... IF NOT EXISTS`. Write the migration so it is
idempotent by inspecting first, the way
`2026-05-01-fix-sessions-tags-foreign-key.ts` does with `PRAGMA foreign_key_list`.

```ts
export async function up({ context }: MigrationContext): Promise<void> {
  const columns = await context.sequelize.query('PRAGMA table_info("GamePlay_Activities")');
  const exists = (columns[0] as any[]).some((column: any) => column.name === 'game_type');
  if (!exists) {
    await context.sequelize.query('ALTER TABLE "GamePlay_Activities" ADD COLUMN game_type TEXT');
  }
}
```

Then update the Sequelize model **in the same commit**. Model and schema drifting apart is how
`mongo_id` stayed declared in five models for five and a half months after the columns were
dropped.

## 3. Adding `deletedAt`

Every table gets it, with `paranoid: true` on the model — **except**:

- allocation bookkeeping (`Experimental_Groups`, `Experimental_Participants`), where soft
  deleting rows breaks allocation;
- `SIMLETs_shlinks`, where soft deleting broke URL resolution.

See [ADR-0010](../explanation/decisions/0010-soft-delete-and-the-admin-bypass.md) before
adding it anywhere.

## 4. Changing a view

Views are in `02-views.sql` and are also read through query templates in
`src/lib/views/**/*.queries.ts`. **Both must change.** The templates carry the SQL for
parameterised reads, and they embed their own copies of the filters.

After editing a view, regenerate:

```bash
npm run updateQueryDocs      # QUERY_DOCS.md describes every query template
npm test
```

## 5. Verify

```bash
npm run dev                            # schema + views + migrations applied on boot
curl -s localhost:3000/health | jq     # db.status must be true
npm test
```

## Migrating data from a previous MongoDB deployment

That is a different tool: `migrate/migrate.py`, a one-shot Python backfill with its own
`Dockerfile`, run against a MongoDB export. It is not umzug and it does not run at boot. The
umzug migrations assume the backfill already happened.

## Gotchas

- **`sequelize.sync()` in tests does not create views.** A test that depends on a view will
  pass locally and fail in production, or the reverse.
- **Views do not get `paranoid` filtering for free.** Sequelize's `paranoid` option only
  affects ORM queries. If you add a table to a view, add
  `AND (deletedAt IS NULL OR :is_admin IS TRUE)` yourself, or the deleted rows will surface.