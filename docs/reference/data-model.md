# Data model reference

SQLite, one file, accessed through Sequelize. Complex reads go through SQL **views**; writes
go through the models and the mappers on top of them.

## Where the schema lives

| File | Contents |
| --- | --- |
| `migrate/sqlite/01-schemas.sql` | 25 `CREATE TABLE IF NOT EXISTS`, run on every boot |
| `migrate/sqlite/02-views.sql` | 23 `CREATE VIEW`, run on every boot, after the tables |
| `src/lib/migrations/*.ts` | umzug forward migrations, applied once, tracked in `SequelizeMeta` |
| `src/lib/models/**` | Sequelize models — **not** the schema; they drift |
| `src/lib/views/**.queries.ts` | query templates with typed parameters, executed via `runViewQuery` |

`QUERY_DOCS.md` documents every query template; regenerate it with `npm run updateQueryDocs`.

## Tables

```
Users
SIMLETs ──┬── SIMLETs_permissions
          ├── SIMLETs_shlinks
          ├── Sessions ──┬── Sessions_dates
          │              ├── Sessions_tags ── Sessions_tags_list
          │              ├── Sessions_permissions
          │              └── Activities ──┬── Activities_completion
          │                               ├── Manual_Activities
          │                               ├── GamePlay_Activities
          │                               └── Limesurvey_Activities
          └── ParticipantGroups ──┬── ParticipantGroups_participants
                                   └── ParticipantGroups_permissions

Experimental_Groups
Experimental_Participants
Random_Allocators

Activities_template ──┬── Activities_template_permissions
                      ├── Activities_template_tags ── Activities_template_tags_list
                      ├── Manual_Template_Activities
                      ├── GamePlay_Activities_Template
                      └── Limesurvey_Activities_Template
```

### Identity

`Users` mirrors Keycloak: `user_id`, `username` (unique), `email`, `external_id`,
`real_name`, `role`, timestamps. SIMVA creates the row on first login and keeps `email` and
`role` in sync with the token.

### The study chain

| Table | Holds |
| --- | --- |
| `SIMLETs` | `simlet_name`, `simlet_description`, `simlet_owner_id`, `archived`, sandbox fields |
| `Sessions` | `simlet_id`, `session_name`, `session_can_be_manually_activated`, activation state |
| `Sessions_dates` | open/close dates, kept in a separate table |
| `Activities` | `session_id`, `activity_name`, `activity_type`, `activity_order`, GDPR flag |
| `Activities_completion` | `(activity_id, user_id, completion_date, result)` — the state rows |

`activity_type` selects the subclass; the per-type tables hold the extra columns
(`GamePlay_Activities.game_url`, `Limesurvey_Activities.survey_id`, …).

### Permissions

Three parallel sets — `SIMLETs_permissions`, `Sessions_permissions`,
`ParticipantGroups_permissions` — each keyed by `(object_id, user_id)` with a `permission`
value of `FULL` or `WRITE`. All three are managed through one mapper,
`UserPermission`, which dispatches on the object type.

### Allocation

| Table | Holds |
| --- | --- |
| `ParticipantGroups` | a cohort, with `group_allocator_type` and `group_sandbox` |
| `ParticipantGroups_participants` | membership |
| `Experimental_Groups` | `(group_id, session_id)` — which group went to which session |
| `Experimental_Participants` | `(allocator_id, user_id, allocated_group)` |
| `Random_Allocators` | `(allocator_id, group_percentages)` |

**These five rows are never soft deleted.** Allocation bookkeeping that disappears is
allocation that silently breaks; the two experimental tables were mistakenly made paranoid and
the reversal took two commits.

## Views

23 views in `migrate/sqlite/02-views.sql`, in two families:

- `v_*` — application facing aggregates.
- `vv_*` — intermediate permission and allocator views that the `v_*` ones build on.

The ones that matter most:

| View | Used for |
| --- | --- |
| `v_complete_simlets_users_permissions` (+ `_tags`) | `GET /simlets`, `GET /simlets/{id}` |
| `v_complete_sessions_users_permissions` (+ `_tags`) | session listings, filtered by role |
| `v_complete_activities_users_permissions` | activity listings |
| `v_complete_groups_user_permissions`, `v_complete_groups_simlets` | group listings |
| `v_complete_allocation_participants` | who is allocated where |
| `vv_user_permissions` | the permission resolution that everything else builds on |
| `v_activities_by_survey_id` | LimeSurvey reverse lookup |

Views take optional filters with the idiom:

```sql
WHERE (:param IS NULL OR col = :param)
```

and, since soft delete, carry:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

The `is_admin` part is not decoration: it is how an administrator sees soft-deleted rows, and
it is why `is_admin` is threaded through every query template.

## Query templates

`src/lib/views/*.queries.ts` exports named `QueryTemplate` objects:

```ts
{ description: '...', sql: '...', params: [{ name: 'limit', type: 'number' }] }
```

`runViewQuery()` validates the params with `validateParams()`, substitutes `{{orderBy}}` and
`{{order}}`, and executes with Sequelize `replacements` — parameters are never interpolated.

Ordering and pagination arguments are validated against a whitelist before being substituted;
`?orderBy=deletedAt; DROP TABLE` is not reachable.

## What is not in SQLite

| Data | Where |
| --- | --- |
| xAPI statements | the LRS |
| Result files | object storage, keyed `activity_id/user_id` |
| Tracker state | object storage |
| Survey answers | read from LimeSurvey, cached in object storage |

The only *state* in SQLite is the completion table, plus the `deletedAt` markers.

## Soft delete

Every table carries `deletedAt` and every model sets `paranoid: true`, except the two
experimental allocation tables and `SIMLETs_shlinks`. Sequelize's `paranoid` option only
affects ORM queries — the views are raw SQL and need their own filters, which is why both exist
and why forgetting one leaks deleted rows. See
[ADR-0010](../explanation/decisions/0010-soft-delete-and-the-admin-bypass.md).

## Related

- [Explanation: persistence with SQLite and SQL views](../explanation/persistence-sqlite-and-views.md)
- [How-to: change the database schema](../how-to/change-the-database-schema.md)
- [How-to: fetch results](../how-to/fetch-results.md)