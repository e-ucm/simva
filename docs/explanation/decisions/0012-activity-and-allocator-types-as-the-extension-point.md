# ADR-0012 — Activity and allocator types as the extension point

- **Status:** Accepted
- **Date:** 2026-02-11 (activity types), refined 2026-08-06

## Context

SIMVA's original premise — "validate serious games using pre-post surveys as a control point" —
means the interesting half of the system is everything that is *not* a questionnaire. A
manual instruction, a serious game, a LimeSurvey form, and anything a university builds
in-house must all sit in the same session, obey the same ordering rules, and record progress
the same way.

If activity behaviour is hard-coded — a chain of `if (type === 'limesurvey')` branches in the
service — then adding the next integration means touching every use case, and every
conditional becomes a place where a future type could fall through wrong.

The history shows this happening repeatedly: `MinioActivity` → `RageAnalyticsActivity` →
`RageMinioActivity` → `GamePlayActivity`, consolidated in 2020 (`bc9e794`, `e83290f`,
`e83290f`, `40beb77`, `ac54703`), with only `GamePlayActivity` surviving.

## Decision

Model both concepts as a discriminator plus a class hierarchy, with a factory, and keep the
shared behaviour on the base class.

```ts
// src/lib/mappers/activities/ActivityToClass.ts
switch (dbRow.activity_type) {
  case 'gameplay':   return GamePlayActivity.getFromDbData(...);
  case 'limesurvey': return LimesurveyActivity.getFromDbData(...);
  case 'manual':     return ManualActivity.getFromDbData(...);
  default:
    logger.warn(`Unknown activity type ${dbRow.activity_type}, falling back to Activity`);
    return new Activity(dbRow.activity_id);
}
```

The base `Activity` owns the state machine — session active, dates, previous activities
complete, already-completed — so ordering rules apply identically to every type:

```ts
canSendStatementsLRS() {
  if (!this.session.isActive()) return false;
  if (!this.session.datesAllow()) return false;
  if (!this.previousActivitiesCompleted()) return false;
  if (this.isCompleted() && !this.activity_can_be_restarted) return false;
  return true;
}
```

Subclasses override what is genuinely type specific: `getType()`, `getFromDbData()`,
`canBeOpened()`, `target()`, `getUtils()`, `getResults()`, `setResult()`, `activate()`.

Type metadata is discovered, not declared: `GET /activitytypes` instantiates each type and asks
it for `getUtils()`. Allocators follow the identical pattern —
`AllocatorType.getAll()` and `GroupAllocatorToClass`.

## Consequences

**Positive**

- **Adding an integration touches one new file** plus a factory case, a table, a model and a
  migration. No existing use case changes.
- **Ordering rules cannot diverge per type.** They are inherited, not reimplemented.
- **The fallback is safe.** An unknown `activity_type` degrades to a base `Activity` with a
  warning rather than throwing — an old deployment reading a new activity type still works.
- **`GET /activitytypes` cannot drift from reality**, because the metadata comes from the
  classes that do the work.

**Negative**

- **`Activity.ts` is over a thousand lines.** State machine, statement processing, progress,
  results, export, LRS pipeline. A change to completion semantics touches every type. That is
  the price of putting shared rules in one place, and for ordering semantics it is worth it.
- **A polymorphic type changes in two places at once.** `5147be7` (2026-08-06) is the
  clearest example: tracker-config generation had spread across the simlet controller, the
  simlet service, the simlet mapper and the base `Activity`, and the fix pulled it all into
  `GameplayActivity` because tracker configuration is a gameplay concept and nothing else
  produces one (−88 lines across four files, +53 in one).
- **`AllocatorType.getAll()` lists only `default` and `group` by default.** `session` and
  `random` are commented out of the default array and only appear with `?type=`. So
  `GET /allocatortypes` under-reports what the server supports — an inconsistency with the
  activity side, which lists everything.
- **Per-type tables must be created lazily.** `getFromDbData()` creates the `GamePlay_Activities`
  row on first read, which means a read path has a write side effect. That produced an N+1 and
  a side-effect bug on `GET /activities`, fixed by `buildListFromRows` in `8dcd6f9` (2026-09-29,
  +102 and +201 lines of tests) with the comment that listing activities must stay side-effect
  free.

## The tracker configuration is the hard part

Tracker-config URL construction depends on the game engine, the tracker flavour, the SSO mode
and the session state simultaneously. It was rewritten **eleven times in 48 days**
(2026-08-06 → 2026-09-28): `5147be7`, `f547138`, `636253f`, `c729779`, `dd9c3a6`, `4c2e092`,
`e452e23`, `7aff131`, `bdc19a9`, `24ac082`, `cf22e02`.

The final state is *smaller* than the intermediate ones — `cf22e02` removed 36 lines and added
11 — which is the usual shape of a design that converged.

## Adding a type

See [how-to: add an activity type](../../how-to/add-an-activity-type.md). The short version:
subclass, register in the factory, add the type to `getAll()`, add the table and model, add a
migration, add a branch to the creation schema, and extend `buildListFromRows` if the type has
its own table.

## Evidence

- `b4c8c8c`, `5aad24f` (2026-02-11/12) — the mapper hierarchy
- `8dcd6f9` (2026-09-29) — `buildListFromRows`, +201 lines of tests
- `5147be7` (2026-08-06) — tracker config consolidated into `GameplayActivity`
- `cf22e02` (2026-09-28) — the converging reduction
- `bc9e794`, `e83290f`, `40beb77`, `ac54703` (2020) — the activity vocabulary revised four times

## Related

- [The activity and allocator type system](../activity-and-allocator-types.md)
- [Activity types reference](../../reference/activity-types.md)
- [ADR-0007](./0007-oauth2-device-authorization-flow.md) — why tracker config is hard
- [ADR-0013](./0013-allocator-strategies-and-sandbox-groups.md)