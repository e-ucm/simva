# The activity and allocator type system

SIMVA has one polymorphic concept and uses it twice: **activity types** and **allocator
types**. Both work the same way, and both are the domain's main extension mechanism.

## How polymorphism is spelled

An `Activities` row stores an `activity_type` discriminator. When a mapper needs the object, a
factory switches on it:

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

Each type has its own table holding the extra columns, created lazily on first read:

```
Activities
├── GamePlay_Activities    game_url, game_type, game_technology, game_tracker_technology, game_backup
├── Limesurvey_Activities  survey_id, survey_language, survey_lrsset
└── Manual_Activities      instructions
```

The subclass overrides behaviour, not just data:

| Member | Decides |
| --- | --- |
| `getType()` | the discriminator |
| `static getFromDbData()` | how a row becomes an object, including lazy creation of the per-type row |
| `canBeOpened()` | `GET /activities/{id}/openable` |
| `target()` | the URL `GET /activities/{id}/target` returns |
| `getUtils()` | the extra fields `GET /activitytypes` advertises |
| `getResults()`, `setResult()`, `hasResults()` | where the payload lives |
| `activate()` | what happens when the session is activated |

That is why an activity's type, not its session, decides whether SIMVA talks to LimeSurvey,
builds a tracker config, or stores nothing at all.

## The shared state machine

Everything every type inherits lives on the base `Activity`:

```ts
canSendStatementsLRS() {
  if (!this.session.isActive()) return false;
  if (!this.session.datesAllow()) return false;
  if (!this.previousActivitiesCompleted()) return false;
  if (this.isCompleted() && !this.activity_can_be_restarted) return false;
  return true;
}
```

An activity is strictly sequential within a session: you cannot open activity 4 until
activities 1 to 3 are complete. That single rule explains most participant-facing surprises,
and it is why "the participant is stuck" is nearly always about the previous activity rather
than about permissions.

## Type metadata

`GET /activitytypes` is not a static list. `ActivityType.getAll()` instantiates each type and
asks it for `getUtils()`:

```ts
getAll(type?: string) {
  return [GamePlayActivity, LimesurveyActivity, ManualActivity]
    .filter(c => !type || c.getType() === type)
    .map(c => c.getUtils());
}
```

A new type becomes visible the moment it is in that list. `LimesurveyActivity.getUtils()`
also reports live LimeSurvey availability (`isOnline` from the client), so the metadata
endpoint is partly a health check.

## Allocators, the same pattern

```
ParticipantGroups.group_allocator_type
├── default  SimletGroup                      -> first session
├── session  SessionAllocatorSimletGroup      -> all sessions, reject overlapping dates
├── group    GroupAllocatorSimletGroup        -> whole groups, recorded in Experimental_Groups
└── random   RandomAllocatorSimletGroup       -> percentages at allocation time
```

`AllocatorType.getAll()` mirrors `ActivityType.getAll()`, and `GroupAllocatorToClass` is the
factory.

One inconsistency worth knowing: **`AllocatorType.getAll()` lists only `default` and `group`
by default.** `session` and `random` are commented out of the default array and only appear
when you pass `?type=`. So `GET /allocatortypes` under-reports what the server supports.

## A refactor that shows what "type" had come to mean

```
5147be7  2026-08-06  fix tracker config all in one
                    simlet.controler.ts  -32
                    Activity.ts          -22
                    Simlet.ts            -12
                    simlet.service.ts    -21
                    GameplayActivity.ts  +53
                    api.yaml             +94
```

Tracker-config generation had been spread across the simlet controller, the simlet service,
the simlet mapper and the base `Activity`. It all got pulled into `GameplayActivity`, because
tracker configuration is a gameplay concept and nothing else produces one.

Then five "fix tracker config" commits followed in eight weeks, plus the `oauth_login_mode`
episode and `cf22e02` (2026-09-28), which *removed* 36 lines and added 11 — the final state
being smaller than the intermediate ones. Eleven rewrites in 48 days of the same URL-building
code is the honest measure of how hard this part is: it depends on the game engine, the
tracker flavour, the SSO mode and the session state simultaneously.

## Why the base class is so large

`Activity.ts` is over a thousand lines and carries: the state machine, statement processing,
progress computation, completion, results, export, and the LRS pipeline. The type subclasses
are thin.

That is the trade-off: a large base with a small extension surface. It keeps the shared rules
in one place, which matters because the sequentiality rule *must* apply identically to a
manual instruction and a serious game. The cost is that a change to completion semantics
touches every type.

## Adding a type

Full walkthrough in [how-to: add an activity type](../how-to/add-an-activity-type.md).

## Related

- [Activity types reference](../reference/activity-types.md)
- [ADR-0012 — activity and allocator types as the extension point](./decisions/0012-activity-and-allocator-types-as-the-extension-point.md)
- [LRS integration](./lrs-integration.md)
- [How-to: create a gameplay activity](../how-to/create-a-gameplay-activity.md)