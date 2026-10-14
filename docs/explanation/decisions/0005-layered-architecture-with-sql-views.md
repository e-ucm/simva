# ADR-0005 — Layered architecture with SQL views

- **Status:** Accepted
- **Date:** 2026-02-13

## Context

The rewrite (ADR-0001) produced fat Sequelize models: table definitions with business rules
mixed in. `group.model.ts` was 323 lines, `groupParticipants.model.ts` 451,
`activity.model.ts` 317. "Can this user edit this simlet?", "is this activity openable?",
"may I see this deleted row?" — all of it sat next to the column definitions.

Two problems followed. Neither the rules nor the persistence could be tested independently, and
a change to a rule meant opening a file whose main job was describing a table.

The second problem was structural. `GET /simlets` returns, per study: sessions, activities,
completion, tags, the caller's direct and indirect permissions, allocation state, and — after
soft delete — a flag deciding whether deleted rows are visible. As a Sequelize `include`
graph that is unreadable and impossible to permission-filter cleanly.

## Decision

Two moves, three weeks apart.

**Split the domain out of the models.**

```
b4c8c8c  2026-02-11  src/lib/classes/*  ->  src/lib/mappers/*
f39064f  2026-02-13  +345 / -3232: nine models deleted outright
```

`src/lib/classes/{group,session,simlet,activities,allocators,UserPermisions}` became
`src/lib/mappers/*`, and the remaining models were reduced to column definitions.

**Put the reads in SQL.**

```
cddf34f  2026-01-22  src/lib/views/*.queries.ts + migrate/sqlite/02-views.sql
```

23 views in `02-views.sql`, plus typed query templates for the parameterised reads:

```ts
export const getSimletsByUserId: QueryTemplate = {
  description: '...',
  sql: 'SELECT ... FROM v_complete_simlets_users_permissions WHERE ...',
  params: [{ name: 'current_user_id', type: 'number' }, ...],
};
```

`runViewQuery()` validates the parameters, substitutes order-by from a whitelist, and executes
with Sequelize `replacements` — nothing a caller sends is ever concatenated into SQL.

Then a second split, in March, to stop the controller becoming the place where all use cases
live:

```
afb8925  2026-03-04  +1738 / -1252
          simlet.controler.ts  -548
          simlet.service.ts    -661
          six new service + controller + route triplets
```

Resulting layering:

```
routes -> controllers -> services -> mappers -> views -> models
```

## Consequences

**Positive**

- **Rules are testable without a database**, and persistence is testable without rules.
- **`02-views.sql` is the single place the read shape lives.** Permissions, tags and
  allocation all resolve in one pass instead of N+1 includes.
- **Order-by and pagination are whitelisted**, so the injection surface a raw string would
  offer does not exist.
- **The layer boundaries are checkable in review.** A controller that touches the database is
  visible at a glance.

**Negative — `02-views.sql` became the bottleneck**

Every significant 2026 feature ended in that one file:

| Feature | Commits |
| --- | --- |
| Soft delete | `c186629`, `2f5d86e` |
| Tag visibility | `7674cce`, `95b85ec` |
| Indirect permissions | `a28d71b`, `3286357`, `766ff1f` |
| Sandbox filtering | `fb121e5`, `7a26a4e`, `741307f` |
| Session permissions | `d121f5d` |

And one fix spread: `2f5d86e` added the `is_admin` pattern to six query template files and the
view (+290/−51) because it had to be replicated by hand everywhere.

**The ORM guarantee does not reach the views.** Sequelize's `paranoid` option rewrites ORM
queries and does nothing for a `SELECT` against a view, which is exactly the surprise that
shaped [ADR-0010](./0010-soft-delete-and-the-admin-bypass.md).

**The rename left residue.** Three months after `classes/` became `mappers/`, `35cde39` fixed
a `participantMapper` reference that should have been `userMapper` — a name from before the
rename, still in a schema.

**Query templates can drift from views.** They are separate SQL in separate directories,
maintained by hand.

## Evidence

- `b4c8c8c` — the rename to `mappers`
- `282b4c6`, `5aad24f` — the follow-through, +1,556 lines building the hierarchy
- `f39064f` — the deletion of nine fat models
- `afb8925` — the controller/service split
- `4fdcba3` — `is_admin` threaded through 39 files
- `c186629`, `2f5d86e` — the views becoming the cost centre
- `35cde39` — stale rename residue

## Related

- [Architecture](../architecture.md)
- [Persistence: SQLite and SQL views](../persistence-sqlite-and-views.md)
- [Data model reference](../../reference/data-model.md)