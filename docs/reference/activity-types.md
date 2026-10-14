# Activity types reference

An activity's *type* is its behaviour. The same `Activities` row becomes a different object
depending on `activity_type`, and the subclasses override target URLs, tracker
configuration, result storage and how incoming xAPI statements are read.

```bash
curl -s "$SIMVA_URL/activitytypes" -H "Authorization: Bearer $TOKEN" | jq
```

```json
[
  {
    "activity_type": "gameplay",
    "activity_name": "GamePlay Activity",
    "activity_description": "An activity to track gameplay sessions and scores.",
    "activity_utils": { "game_backup": true, "game_scorm_xapi": false, "...": "..." }
  }
]
```

## The types

### `default` (stored as `activity`)

A bare activity: completion state plus somewhere to put a result. No external integration, no
trace interpretation.

### `manual`

The researcher completes it by hand, or the participant does through
`POST /activities/{id}/completion`.

| Field | Required | Values |
| --- | --- | --- |
| `manual_user_managed` | yes | boolean — whether completion is a human decision |
| `manual_ressource_type` | yes | `WEB` or `EXTERNAL` |
| `manual_ressource_url` | yes | URL the participant is sent to (may be `null`) |
| `activity_trace_storage` | yes | boolean |
| `activity_can_be_restarted` | yes | boolean |

### `limesurvey`

Creates or clones a survey in an external LimeSurvey instance and tracks participants by
token.

| Field | Required | Values |
| --- | --- | --- |
| `rawsurvey` | one of these two | survey file content |
| `copysurvey` | one of these two | id of an existing survey to clone |
| `survey_language` | no | language code |
| `activity_trace_storage` | yes | boolean |
| `activity_can_be_restarted` | yes | boolean |

Behaviour worth knowing:

- `GET /activities/{id}/target` returns
  `{limesurvey.external_url}/{survey_id}?token={username}&lang={language}` — the SIMVA
  username is the LimeSurvey token.
- Responses are read from LimeSurvey by token and cached as result files in object storage.
- Deleting a SIMVA participant deletes their responses upstream.
- `survey_lrsset` / `survey_lrsset_id` control whether answers become xAPI statements.

### `gameplay`

A serious game, hosted anywhere, traced through a tracker configuration file SIMVA hands out.

| Field | Required | Values |
| --- | --- | --- |
| `game_type` | yes | `WEB` or `DESKTOP` |
| `game_url` | yes | where the participant goes (may be `null`, but then the activity never opens) |
| `game_technology` | no | engine or technology label |
| `game_tracker_technology` | no | which tracker flavour: `uAdventure`, `Xasu`, `Xasu+Simva_Plugin` |
| `game_backup` | no | store result files as well as statements |
| `game_scorm_xapi` | no | the game speaks SCORM/xAPI itself; SIMVA generates no traces |
| `activity_trace_storage` | yes | boolean |
| `activity_can_be_restarted` | yes | boolean |

`game_tracker_technology` selects the config file name:

| Value | `file_name` returned by `GET /activities/{id}/tracker_config` |
| --- | --- |
| `uAdventure`, `Xasu+Simva_Plugin` | `simva.conf` |
| `Xasu` (default) | `tracker_config.json` |

`game_url` also feeds the CORS allowlist: every origin found in any gameplay activity is
allowed, refreshed once a minute.

## Fields common to every type

| Field | Required | Meaning |
| --- | --- | --- |
| `activity_name` | yes | display name |
| `activity_type` | yes | the discriminator |
| `activity_description` | no | defaults to `""` |
| `activity_order` | no | position in the session; assigned as `max + 1` |
| `activity_comply_with_GDPR` | no | defaults to `false` |
| `activity_trace_storage` | type dependent | expose a trace endpoint |
| `activity_can_be_restarted` | type dependent | allow re-completion |

## Shared state machine

Whichever type it is, an activity can only be opened when:

1. its session is active,
2. its session's dates allow it (unless the session is manually activated),
3. every **previous** activity in the session is completed.

And it rejects statements, `POST /completion` and `POST /progress` unless the same three hold
plus, for completion, the activity is not already complete — unless
`activity_can_be_restarted`.

This is why "the participant cannot proceed" is nearly always "an earlier activity is not
finished" rather than a permissions problem.

## How a type interprets incoming statements

`processStatementsForActivity` matches `object.definition.type` against the type's IRI:

| Type | Statement object type |
| --- | --- |
| `limesurvey` | `.../adlnet.gov/expapi/activities/assessment` |
| `gameplay` | `.../seriousgames/activity-types/serious-game` |
| `manual` | disabled |

Then:

| Verb | Effect |
| --- | --- |
| `initialized` | marks initialised |
| `progressed` | scaled score for LimeSurvey, `.../extensions/progress` for gameplay |
| `completed`, `terminated` | completes the activity when `result.completion` is truthy |

## Allocator types, for comparison

`GET /allocatortypes` follows the same pattern with a different default set:

| Type | Default listed | Extra fields |
| --- | --- | --- |
| `default` | yes | — |
| `group` | yes | — |
| `session` | no, needs `?type=session` | — |
| `random` | no, needs `?type=random` | `randomize_session_allocation[]` |

## Adding a type

See [how-to: add an activity type](../how-to/add-an-activity-type.md).

## Related

- [Explanation: the activity and allocator type system](../explanation/activity-and-allocator-types.md)
- [Reference: the `/activities` endpoints](./api/activities.md)
- [How-to: create a gameplay activity](../how-to/create-a-gameplay-activity.md)