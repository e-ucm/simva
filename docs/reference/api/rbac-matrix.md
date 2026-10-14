# Role and endpoint matrix

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## How the server derives this table

`api.yaml` uses OpenAPI `tags` for a non-standard purpose: the pluralised name of the
role allowed to call the operation. `Authenticator.initPaths()` in
`src/middlewares/auth.middleware.ts` reads `api.yaml` at startup, lowercases each tag and
drops the trailing `s` to obtain the role key:

```ts
const roleTag = methodConfig.tags[i].toLowerCase().slice(0, -1); // 'teachers' -> 'teacher'
```

Operations **without** tags land in a ``*`` bucket that every role may call.

Two consequences worth knowing before you edit the contract:

1. Editing a tag is an authorization change, not a documentation change.
2. A role name must be singular and must not end in `s`, otherwise the de-pluralisation
   produces a role key that `getAccess()` in `src/controlers/users/user.helper.ts` does not
   recognise.

The role used for the check is the one stored in the database (`req.user.sql.role`),
mapped from Keycloak realm roles by `getRoleFromKeycloakJWT()`, not a role read from the
token at request time.

## Matrix

Legend: `x` allowed, `-` rejected by `roleAllowed` (401), blank means the role has no
entry for that method at all and the request is rejected with 404.

| Operation | administrator | garbagecollector | lrsmanager | norole | student | teacher |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /activities` | x | x | - | - | - | x |
| `POST /activities` | x | - | - | - | - | x |
| `GET /activities/{activityid}` | x | x | - | - | - | x |
| `GET /activities/{activityid}/completion` | x | - | - | - | x | x |
| `POST /activities/{activityid}/completion` | x | - | - | - | x | x |
| `POST /activities/{activityid}/completion/multi` | x | - | - | - | - | x |
| `GET /activities/{activityid}/export` | x | x | - | - | - | x |
| `GET /activities/{activityid}/hasresult` | x | - | - | - | x | x |
| `GET /activities/{activityid}/initialized` | x | - | - | - | x | x |
| `POST /activities/{activityid}/initialized` | x | - | - | - | x | x |
| `GET /activities/{activityid}/lrs_test_statements` | x | x | x | - | - | x |
| `GET /activities/{activityid}/lrs/about` | x | x | x | - | x | x |
| `GET /activities/{activityid}/lrs/activities` | x | - | x | - | x | x |
| `DELETE /activities/{activityid}/lrs/activities/profile` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/activities/profile` | x | - | x | - | x | x |
| `POST /activities/{activityid}/lrs/activities/profile` | x | - | x | - | x | x |
| `PUT /activities/{activityid}/lrs/activities/profile` | x | - | x | - | x | x |
| `DELETE /activities/{activityid}/lrs/activities/status` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/activities/status` | x | - | x | - | x | x |
| `POST /activities/{activityid}/lrs/activities/status` | x | - | x | - | x | x |
| `PUT /activities/{activityid}/lrs/activities/status` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/agents` | x | - | x | - | x | x |
| `DELETE /activities/{activityid}/lrs/agents/profile` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/agents/profile` | x | - | x | - | x | x |
| `POST /activities/{activityid}/lrs/agents/profile` | x | - | x | - | x | x |
| `PUT /activities/{activityid}/lrs/agents/profile` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/extension/{extension_id}` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/statements` | x | x | x | - | x | x |
| `POST /activities/{activityid}/lrs/statements` | x | - | x | - | x | x |
| `PUT /activities/{activityid}/lrs/statements` | x | - | x | - | x | x |
| `GET /activities/{activityid}/lrs/statements/more` | x | x | x | - | x | x |
| `GET /activities/{activityid}/open` | x | - | - | - | x | x |
| `GET /activities/{activityid}/openable` | x | - | - | - | x | x |
| `GET /activities/{activityid}/presignedurl` | x | x | - | - | - | x |
| `GET /activities/{activityid}/progress` | x | - | - | - | x | x |
| `POST /activities/{activityid}/progress` | x | - | - | - | x | x |
| `GET /activities/{activityid}/result` | x | - | - | - | x | x |
| `POST /activities/{activityid}/result` | x | - | - | - | x | x |
| `POST /activities/{activityid}/session` | x | - | - | - | x | x |
| `POST /activities/{activityid}/suspension` | x | - | - | - | x | x |
| `GET /activities/{activityid}/target` | x | - | - | - | x | x |
| `GET /activities/{activityid}/tracker_config` | x | x | - | - | - | x |
| `GET /activitytypes` | x | x | x | - | - | x |
| `GET /admin/lrs/statements` | x | x | x | - | - | - |
| `POST /admin/lrs/statements` | x | - | x | - | - | - |
| `GET /admin/lrs/statements/more` | x | x | x | - | - | - |
| `GET /allocatortypes` | x | x | x | - | - | x |
| `POST /auth2/{activity_id}/device` | x | x | x | x | x | x |
| `POST /auth2/{activity_id}/token` | x | x | x | x | x | x |
| `GET /events` | x | x | x | x | x | x |
| `GET /groups` | x | - | - | - | x | x |
| `GET /health` | x | x | x | x | x | x |
| `HEAD /health` | x | x | x | x | x | x |
| `POST /limesurvey-completion-webhooks` | x | x | x | x | x | x |
| `GET /limesurvey/{surveyid}/surveylanguages` | x | - | - | - | - | x |
| `PATCH /limesurvey/{surveyid}/surveyowner` | x | - | - | - | - | x |
| `GET /limesurvey/isAdmin` | x | - | - | - | - | x |
| `GET /limesurvey/surveys` | x | - | - | - | - | x |
| `GET /lti` | x | - | - | - | x | x |
| `GET /lti/claims` | x | - | - | - | x | x |
| `POST /lti/claims` | x | - | - | - | x | x |
| `GET /lti/context/{id}/lineitems` | x | - | - | - | x | x |
| `GET /lti/context/{id}/lineitems/{lineitem}` | x | - | - | - | x | x |
| `PUT /lti/context/{id}/lineitems/{lineitem}` | x | - | - | - | x | x |
| `GET /lti/context/{id}/lineitems/{lineitem}/results` | x | - | - | - | x | x |
| `POST /lti/context/{id}/lineitems/{lineitem}/score` | x | - | - | - | x | x |
| `GET /lti/context/{id}/memberships` | x | - | - | - | x | x |
| `GET /lti/platforms` | - | - | - | - | - | x |
| `POST /lti/platforms` | - | - | - | - | - | x |
| `DELETE /lti/platforms/{id}` | - | - | - | - | - | x |
| `GET /lti/platforms/{id}` | - | - | - | - | - | x |
| `PUT /lti/platforms/{id}` | - | - | - | - | - | x |
| `GET /lti/tools` | - | - | - | - | - | x |
| `POST /lti/tools` | - | - | - | - | - | x |
| `DELETE /lti/tools/{id}` | - | - | - | - | - | x |
| `GET /lti/tools/{id}` | - | - | - | - | - | x |
| `PUT /lti/tools/{id}` | - | - | - | - | - | x |
| `GET /simlets` | x | x | - | - | - | x |
| `POST /simlets` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}` | x | x | - | - | - | x |
| `PATCH /simlets/{simletid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/events` | x | x | - | - | - | x |
| `GET /simlets/{simletid}/events/getPresignedUrl` | x | x | - | - | - | x |
| `GET /simlets/{simletid}/export` | x | x | - | - | - | x |
| `GET /simlets/{simletid}/groups` | x | x | - | - | - | x |
| `POST /simlets/{simletid}/groups` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/groups/{groupid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/groups/{groupid}` | x | x | - | - | x | x |
| `PATCH /simlets/{simletid}/groups/{groupid}` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/groups/{groupid}/allocate/{sessionid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/groups/{groupid}/participants` | x | x | - | - | - | x |
| `POST /simlets/{simletid}/groups/{groupid}/participants` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/groups/{groupid}/participants/{userid}` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/groups/{groupid}/participants/{userid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/groups/{groupid}/participants/count` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/groups/{groupid}/random/allocate` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/groups/count` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/groups/participants/count` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/participants` | x | x | - | - | - | x |
| `GET /simlets/{simletid}/permissions` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/permissions` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/permissions/{userid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/permissions/{userid}` | x | - | - | - | - | x |
| `PATCH /simlets/{simletid}/permissions/{userid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/schedule` | x | - | - | - | x | x |
| `GET /simlets/{simletid}/schedule/events` | x | - | - | - | x | x |
| `GET /simlets/{simletid}/schedule/events/getPresignedUrl` | x | - | - | - | x | x |
| `GET /simlets/{simletid}/sessions` | x | x | - | - | - | x |
| `POST /simlets/{simletid}/sessions` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/sessions/{sessionid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}` | x | x | - | - | - | x |
| `PATCH /simlets/{simletid}/sessions/{sessionid}` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/sessions/{sessionid}/activate` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/activities` | x | x | - | - | - | x |
| `POST /simlets/{simletid}/sessions/{sessionid}/activities` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | x | - | - | - | - | x |
| `PATCH /simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/lrs_test_statements` | x | - | x | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/lrs/statements` | x | - | x | - | x | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/participants` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/permissions` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/sessions/{sessionid}/permissions` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | x | - | - | - | - | x |
| `PATCH /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | x | - | - | - | - | x |
| `DELETE /simlets/{simletid}/sessions/{sessionid}/tester` | x | - | - | - | - | x |
| `PATCH /simlets/{simletid}/sessions/{sessionid}/tester` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/sessions/{sessionid}/tester` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/sessions/count` | x | x | - | - | x | x |
| `DELETE /simlets/{simletid}/shlink` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/shlink` | x | - | - | - | - | x |
| `PATCH /simlets/{simletid}/shlink` | x | - | - | - | - | x |
| `POST /simlets/{simletid}/shlink` | x | - | - | - | - | x |
| `GET /simlets/{simletid}/tags` | x | x | - | - | - | x |
| `GET /simlets/count` | x | x | - | - | x | x |
| `POST /simlets/import` | x | - | - | - | - | x |
| `GET /simlets/scheduler` | x | - | - | - | x | x |
| `GET /simlets/scheduler/count` | x | - | - | - | x | x |
| `GET /simlets/tags` | x | - | - | - | - | x |
| `GET /tags` | x | x | - | - | - | x |
| `POST /tags` | x | - | - | - | - | x |
| `DELETE /tags/{tagid}` | x | - | - | - | - | x |
| `PATCH /tags/{tagid}` | x | - | - | - | - | x |
| `POST /tasklist` | x | - | - | - | - | x |
| `POST /uploads` | - | - | - | - | - | x |
| `GET /users` | x | - | - | - | - | x |
| `PATCH /users` | x | - | - | x | - | - |
| `PATCH /users/{username}` | x | - | - | x | - | x |
| `POST /users/events` | x | x | x | x | x | x |
| `POST /users/link` | x | x | x | x | x | x |
| `GET /users/me` | x | - | x | x | x | x |
| `GET /version` | x | x | x | x | x | x |

Operations: **155**. Roles: **6**.

## Per request capabilities

`getAccess()` (`src/controlers/users/user.helper.ts`) turns the role into the four flags
that services and mappers branch on:

| Role | `allocated` | `is_admin` | `canImpersonate` |
| --- | --- | --- | --- |
| `administrator` | false | true | true |
| `garbagecollector` | false | true | false |
| `lrsmanager` | true | false | true |
| `teacher` | false | false | false |
| `student` | true | false | false |
| anything else | `AuthentificationError` | | |

- `allocated: true` means "participant shaped": callers are rejected from management
  endpoints and only ever see their own data.
- `is_admin: true` is **not** an authorization flag. It bypasses the "only own data" row
  filters, including the `AND (deletedAt IS NULL OR :is_admin IS TRUE)` clauses in the SQL
  views. The `garbagecollector` service account relies on the tag matrix above to stay
  read-only.
