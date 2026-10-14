# Soft delete

SIMVA soft deletes. Every table has a `deletedAt` column, and most models set
`paranoid: true`. This page explains what that bought and what it cost, because the cost is
spread across nine weeks and seven commits and is not visible from reading the code.

## The decision

`8790b32` (2026-08-06), 29 files, +274/−2:

- `src/lib/migrations/2026-08-02-add-deleteAt-to-alltables.ts` added `deletedAt DATE` to 24
  tables in one transaction,
- 24 Sequelize models gained the column and `paranoid: true`.

Before that, `DELETE /simlets/{id}` removed the row and everything that pointed at it. In a
research tool that is a serious hazard: a mis-click during data collection can destroy the
record of what participants did.

## Why it was wanted

The domain demands it. Studies are archived, not deleted. A researcher who has finished a
pilot still needs the pilot. A participant who withdraws still has their completion history.
Groups get consolidated. And a study that once held data is evidence that the study happened.

Hard delete cannot express any of that.

## Consequence 1 — `paranoid` does nothing for views

The models set `paranoid: true`. The reads go through raw SQL views. Sequelize's paranoid
option rewrites ORM queries; it has no effect on a `SELECT` against a view.

So after the migration, deleted rows kept flowing out of every listing.

```
c186629  2026-08-07  fix deletedAt not get via queries
          02-views.sql            +13/-3
          activities queries      +6
          allocator queries       +3
          groupParticipants       +4
          groups queries          +7
          sessions queries        +11
          simlets queries         +17
```

The fix was to hand-add `AND deletedAt IS NULL` to every query template and every view.
Twenty-four models had been changed; six query files and the view file had to be changed
too, because they never had any reason to know about deletion.

## Consequence 2 — the outer filter is not enough

```
2f5d86e  2026-09-21  fix deletedAt in queries when id of deleted sessions/groups
                     stayed in array
          +290/-51 across six query template files
```

`AND deletedAt IS NULL` on the outer query filters the *row you are reading*. It does not
filter a deleted **child** joined into an array. A live simlet whose session was deleted still
reported that deleted session id in `sessions[]`, because the view flattened the join.

The fix had to be applied at join level, per relation, and paired with a bypass for
administrators:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

That is where `is_admin` stopped being a controller flag and became a query parameter present
in nearly every template. The consequence is visible in the size of the commit: six files,
+290 lines, to express one idea consistently.

This is also the moment the term `is_admin` became ambiguous — it now means "bypass the
own-data filter", not "is authorised". `getAccess()` says so in a comment, which is a hint that
the concept is doing two jobs.

## Consequence 3 — soft delete breaks uniqueness

Re-granting a permission that had been granted before and then removed hit the primary key:

```
0b04a36  2026-09-10  fix simlet permission deletedAt
          UserPermission.ts  +31/-13
```

The fix turned `create()` into `upsert()`, then looked the row up with `paranoid: false` and
called `restore()` if `deletedAt` was set. That is a hand-rolled un-delete, and it now runs on
every permission grant.

The same commit also introduced two bugs of its own: `createPermissions` uses
`where: { simlet_id: ..., user_id: ... }` in the **session** and **group** branches too. A
copy-paste of the simlet key. It is the kind of defect a review layer would have caught.

## Consequence 4 — uniformity was wrong for some tables

Two tables should not have been included at all.

**Allocation bookkeeping.** `Experimental_Groups` and `Experimental_Participants` record who
went where. Soft-deleting an allocation row does not "hide" it, it destroys the fact that the
allocation happened.

```
ad1b8e1  2026-09-02  fix experimental participant not paranoid
d4a6b31  2026-09-03  fix experimental participants not paranoid
```

The first removed `paranoid` from the two experimental models and dropped them from the
migration. The second, **the next day**, fixed the breakage that removal caused in
`SimletGroup` and `GroupAllocatorSimletGroup`. The decision and its reversal cost more than
leaving it alone would have.

**Short URLs.**

```
a578e57  2026-10-05  remove deletedAt field and paranoid option from SimletShlinks model
```

A soft-deleted shlink row broke URL resolution: the short URL still existed in Shlink but
SIMVA no longer knew it, so the redirect stopped resolving. Short URLs are infrastructure, not
user data.

## Where it stands

The policy is now *soft delete almost everywhere, except where the row is bookkeeping or
infrastructure*, and the exceptions are discovered rather than designed — each one cost a
follow-up commit.

Two months after the decision it was still being adjusted. That is worth knowing before you
add `deletedAt` to a new table: the default is not obviously right, and
[`how-to: change the database schema`](../how-to/change-the-database-schema.md) lists the
exceptions explicitly.

## The rule to follow

If you add a table to a view, add both clauses yourself:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

Sequelize will not do it for you, and the omission is invisible until a deleted row appears in
a listing.

## Related

- [ADR-0010 — soft delete and the admin bypass](./decisions/0010-soft-delete-and-the-admin-bypass.md)
- [Data model reference](../reference/data-model.md)
- [Persistence: SQLite and SQL views](./persistence-sqlite-and-views.md)