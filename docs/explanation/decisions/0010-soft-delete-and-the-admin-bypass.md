# ADR-0010 — Soft delete everywhere, with a view-level admin bypass

- **Status:** **Partially reversed**
- **Date:** 2026-08-06 (still being adjusted on 2026-10-05)

## Context

Before this decision, `DELETE /simlets/{id}` removed rows. In a research tool that is a
hazard with no undo: a mis-click during data collection destroys the record of what
participants did, and there is no way to prove the study ever existed.

The domain actively requires retention. Studies are archived, not deleted. A pilot must stay
available after it is superseded. A participant who withdraws still has a completion history
to account for. Consolidation of groups must not lose the record that a group existed.

## Decision

Add `deletedAt` to every table, set `paranoid: true` on every model, and filter deleted rows
out of the views.

```
8790b32  2026-08-06  adding soft delete
                    +274/-2 across 29 files
                    migration adds deletedAt to 24 tables
                    24 models gain the column and paranoid: true
```

Because the reads go through raw SQL views rather than the ORM, a second filter is needed in
SQL, and — because an administrator must be able to see deleted rows to undo a mistake — with
a bypass:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

That clause is where `is_admin` became a **query parameter present in nearly every template**,
rather than a flag consulted in JavaScript.

## Consequences

**Positive**

- `DELETE` is now reversible in principle, and archiving is a deletion.
- Compliance stories ("what data existed, and who was in it") become answerable.
- Consolidation does not destroy history.

**Negative — the decision cost six fix commits in 61 days**

| Commit | Date | What it fixed |
| --- | --- | --- |
| `c186629` | 2026-08-07 | `paranoid` does nothing for raw SQL; six query files hand-patched |
| `ad1b8e1` | 2026-09-02 | allocation tables were wrongly included |
| `d4a6b31` | 2026-09-03 | the previous fix broke allocation — next-day regression |
| `0b04a36` | 2026-09-10 | soft delete broke uniqueness; permission re-grant hit the primary key |
| `2f5d86e` | 2026-09-21 | an outer filter is not enough; deleted children leaked into arrays |
| `a578e57` | 2026-10-05 | `SIMLETs_shlinks` soft delete broke URL resolution — reverted |

Four lessons, in order of how expensive they were:

**1. An ORM guarantee is not a SQL guarantee.** Twenty-four models changed and the behaviour
did not, because the queries that matter are views. The fix was +51 lines of hand-written
filters that will silently rot the next time a query is added.

**2. Filtering the outer row is not filtering the graph.** `AND deletedAt IS NULL` on the
outer query does nothing about a deleted *child* joined into a `sessions[]` array.
`2f5d86e` had to add the filter per relation across six files: +290 lines, −51.

**3. Soft delete breaks uniqueness.** Re-granting a permission that existed before hit the
primary key. The fix turned `create()` into `upsert()` followed by an explicit `restore()` —
a hand-rolled un-delete now on the path of every permission grant. That commit also
introduced two bugs of its own: `createPermissions` filters on `simlet_id` in the session and
group branches too.

**4. Uniformity was the wrong goal for some tables.** Two tables were included by reflex and
each had to be carved out afterwards.

## The carve-outs

**Allocation bookkeeping** — `Experimental_Groups` and `Experimental_Participants`. These
record who was allocated where. Soft-deleting an allocation row does not hide it; it destroys
a fact that the study's methodology depends on. `ad1b8e1` removed `paranoid` from both, and
`d4a6b31` fixed the breakage the next day — the decision and its reversal cost more than
never making it.

**Short URLs** — `SIMLETs_shlinks`. `a578e57` removed the column and `paranoid` entirely: a
soft-deleted shlink row broke URL resolution, because the short URL still existed in Shlink
while SIMVA no longer knew about it. Short URLs are infrastructure, not user data.

## Status: not settled

The policy in force is "soft delete almost everywhere, except where the row is bookkeeping or
infrastructure", and **the exceptions were discovered, not designed**. Two months after the
decision it was still being adjusted.

## The rule to follow

If you add a table to a view, add both clauses yourself:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

Sequelize will not do it for you, and the omission is invisible until a deleted row appears in
a listing.

## Evidence

- `8790b32` — the decision
- `c186629`, `ad1b8e1`, `d4a6b31`, `0b04a36`, `2f5d86e`, `a578e57` — the consequences
- `src/lib/migrations/2026-08-02-add-deleteAt-to-alltables.ts` — 24 tables
- `migrate/sqlite/02-views.sql` — the filter that has to be replicated by hand

## Related

- [Soft delete](../soft-delete.md)
- [Permissions](../permissions.md)
- [ADR-0011](./0011-object-level-permissions-and-inheritance.md)
- [How-to: change the database schema](../../how-to/change-the-database-schema.md)