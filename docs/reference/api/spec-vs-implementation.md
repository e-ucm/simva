# Contract versus implementation

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

This page is produced by statically scanning `src/app.ts` and every route module under
`src/routes`: each `app.use(prefix, router)` and `router.use(subPath, router)` mount is
followed recursively and each `router.method(path)` registration is collected (commented out
registrations are ignored), then the result is compared with `api.yaml`.

Three kinds of difference are reported:

- **Documented, not implemented** — the contract describes an endpoint that no handler
  answers. Requests return `404` from Express.
- **Implemented, not documented** — a handler exists but `api.yaml` has no matching
  operation. `express-openapi-validator` rejects those requests, so the handler is dead
  code until the contract is updated.
- **Parameter name mismatch** — same endpoint, different spelling of a path parameter.
  These work, because `roleAllowed()` treats `{...}` segments as wildcards.

| Metric | Count |
| --- | ---: |
| Operations documented in `api.yaml` | 155 |
| Routes registered in the Express app | 123 |
| Documented, not implemented | 37 |
| Implemented, not documented | 5 |
| Path parameter name mismatches | 2 |

## Documented, not implemented

| Method | Path | Summary | operationId |
| --- | --- | --- | --- |
| `POST` | `/activities` | adds a Activity | `addActivity` |
| `DELETE` | `/activities/{activityid}/lrs/activities/status` | delete the activities status for the activity | `deleteActivitiesStatus` |
| `GET` | `/activities/{activityid}/lrs/activities/status` | gets the activities status object of the activity | `getActivitiesStatus` |
| `POST` | `/activities/{activityid}/lrs/activities/status` | Post the activities status for the activity | `setActivitiesStatus` |
| `PUT` | `/activities/{activityid}/lrs/activities/status` | put the activities status for the activity | `putActivitiesStatus` |
| `POST` | `/activities/{activityid}/session` | sessioning endpoint for uadventure sessioning | `setSession` |
| `GET` | `/events` | send Server Side Events to Client | `sendEvent` |
| `GET` | `/lti` | gets the status of the LTI compatibility | `getLtiStatus` |
| `GET` | `/lti/claims` | gets the LTI claims for the given hints | `getLtiClaims` |
| `POST` | `/lti/claims` | gets the LTI claims for the given hints | `postLtiClaims` |
| `GET` | `/lti/context/{id}/lineitems` | gets the LineItems of the Lti Activity | `getLtiLineItems` |
| `GET` | `/lti/context/{id}/lineitems/{lineitem}` | gets the LineItems of the Lti Activity | `getLtiLineItem` |
| `PUT` | `/lti/context/{id}/lineitems/{lineitem}` | gets the LineItems of the Lti Activity | `putLtiLineItem` |
| `GET` | `/lti/context/{id}/lineitems/{lineitem}/results` | gets the result for the LineItems of the Lti Activity | `getLtiLineItemResults` |
| `POST` | `/lti/context/{id}/lineitems/{lineitem}/score` | gets the LineItems of the Lti Activity | `setLtiLineItemScore` |
| `GET` | `/lti/context/{id}/memberships` | gets the list of members based on the LTI NRPS | `getLtiMemberships` |
| `GET` | `/lti/platforms` | gets the list of LTI platforms | `getLtiPlatforms` |
| `POST` | `/lti/platforms` | adds a lti platform | `addLtiPlatform` |
| `DELETE` | `/lti/platforms/{id}` | Deletes the lti platform with the given ID | `deleteLtiPlatform` |
| `GET` | `/lti/platforms/{id}` | gets the LTI platforms with the given ID | `getLtiPlatform` |
| `PUT` | `/lti/platforms/{id}` | updates the LTI platforms | `updateLtiPlatform` |
| `GET` | `/lti/tools` | gets the list of LTI tools | `getLtiTools` |
| `POST` | `/lti/tools` | adds a lti tool | `addLtiTool` |
| `DELETE` | `/lti/tools/{id}` | Deletes the lti tool with the given ID | `deleteLtiTool` |
| `GET` | `/lti/tools/{id}` | gets the LTI tool with the given ID | `getLtiTool` |
| `PUT` | `/lti/tools/{id}` | updates the LTI tool | `updateLtiTool` |
| `GET` | `/simlets/{simletid}/events` | send Server Side Events to Client for this simlet | `limesurveyCompletionWebhook` |
| `GET` | `/simlets/{simletid}/events/getPresignedUrl` | get getPresignedUrl for Server Side Events to Client for this simlet | `getEventsPresignedUrl` |
| `POST` | `/simlets/{simletid}/groups/{groupid}/random/allocate` | allocates randomly participant or group to a session | `allocateRandomToSessionSimlet` |
| `GET` | `/simlets/{simletid}/schedule/events` | send Server Side Events to Client for this simlet | `GetSSEEvent` |
| `GET` | `/simlets/{simletid}/schedule/events/getPresignedUrl` | get getPresignedUrl for Server Side Events to Client for this simlet | `getScheduleEventsPresignedUrl` |
| `POST` | `/simlets/import` | adds an simlet for the current teacher | `addSimletFromImport` |
| `POST` | `/tasklist` | add to the task list | `addToTaskList` |
| `POST` | `/uploads` | adds a lti tool | `uploadLtiTool` |
| `PATCH` | `/users` | Modifies the logged user, for exemple it's role. | `patchUser` |
| `POST` | `/users/events` | Receives the events of the SSO to sync the users | `getUserEvents` |
| `POST` | `/users/link` | Links the secondary account to the main one | `linkAccount` |

## Implemented, not documented

| Method | Express path | File | Handler |
| --- | --- | --- | --- |
| `DELETE` | `/activities/:activity_id/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:27` | `activitiesLRSControler.deleteActivitiesStateLRSForActivity` |
| `GET` | `/activities/:activity_id/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:24` | `activitiesLRSControler.getActivitiesStateLRSForActivity` |
| `POST` | `/activities/:activity_id/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:25` | `activitiesLRSControler.postActivitiesStateLRSForActivity` |
| `PUT` | `/activities/:activity_id/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:26` | `activitiesLRSControler.updateActivitiesStateLRSForActivity` |
| `GET` | `/activities/:activity_id/suspension` | `src/routes/activities/activities.routes.ts:64` | `activitiesControlers.getSuspensionForActivity` |

## Path parameter name mismatches

| Method | Contract path | Express path | File |
| --- | --- | --- | --- |
| `DELETE` | `/simlets/{simletid}/groups/{groupid}/participants/{userid}` | `/simlets/:simlet_id/groups/:group_id/participants/:participant_id` | `src/routes/simlets/simlet.groups.routes.ts:44` |
| `POST` | `/simlets/{simletid}/groups/{groupid}/participants/{userid}` | `/simlets/:simlet_id/groups/:group_id/participants/:participant_id` | `src/routes/simlets/simlet.groups.routes.ts:42` |

## All registered routes

| Method | Express path | Normalized key | File |
| --- | --- | --- | --- |
| `GET` | `/activities` | `/activities` | `src/routes/activities/activities.routes.ts:50` |
| `GET` | `/activities/:activity_id` | `/activities/{activityid}` | `src/routes/activities/activities.routes.ts:57` |
| `GET` | `/activities/:activity_id/completion` | `/activities/{activityid}/completion` | `src/routes/activities/activities.routes.ts:63` |
| `POST` | `/activities/:activity_id/completion` | `/activities/{activityid}/completion` | `src/routes/activities/activities.routes.ts:67` |
| `POST` | `/activities/:activity_id/completion/multi` | `/activities/{activityid}/completion/multi` | `src/routes/activities/activities.routes.ts:69` |
| `GET` | `/activities/:activity_id/export` | `/activities/{activityid}/export` | `src/routes/activities/activities.routes.ts:51` |
| `GET` | `/activities/:activity_id/hasResult` | `/activities/{activityid}/hasresult` | `src/routes/activities/activities.routes.ts:73` |
| `GET` | `/activities/:activity_id/initialized` | `/activities/{activityid}/initialized` | `src/routes/activities/activities.routes.ts:61` |
| `POST` | `/activities/:activity_id/initialized` | `/activities/{activityid}/initialized` | `src/routes/activities/activities.routes.ts:65` |
| `GET` | `/activities/:activity_id/lrs_test_statements` | `/activities/{activityid}/lrs_test_statements` | `src/routes/activities/activities.routes.ts:75` |
| `GET` | `/activities/:activity_id/lrs/about` | `/activities/{activityid}/lrs/about` | `src/routes/activities/activities.lrs.routes.ts:28` |
| `GET` | `/activities/:activity_id/lrs/activities` | `/activities/{activityid}/lrs/activities` | `src/routes/activities/activities.lrs.routes.ts:19` |
| `DELETE` | `/activities/:activity_id/lrs/activities/profile` | `/activities/{activityid}/lrs/activities/profile` | `src/routes/activities/activities.lrs.routes.ts:23` |
| `GET` | `/activities/:activity_id/lrs/activities/profile` | `/activities/{activityid}/lrs/activities/profile` | `src/routes/activities/activities.lrs.routes.ts:20` |
| `POST` | `/activities/:activity_id/lrs/activities/profile` | `/activities/{activityid}/lrs/activities/profile` | `src/routes/activities/activities.lrs.routes.ts:21` |
| `PUT` | `/activities/:activity_id/lrs/activities/profile` | `/activities/{activityid}/lrs/activities/profile` | `src/routes/activities/activities.lrs.routes.ts:22` |
| `DELETE` | `/activities/:activity_id/lrs/activities/state` | `/activities/{activityid}/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:27` |
| `GET` | `/activities/:activity_id/lrs/activities/state` | `/activities/{activityid}/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:24` |
| `POST` | `/activities/:activity_id/lrs/activities/state` | `/activities/{activityid}/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:25` |
| `PUT` | `/activities/:activity_id/lrs/activities/state` | `/activities/{activityid}/lrs/activities/state` | `src/routes/activities/activities.lrs.routes.ts:26` |
| `GET` | `/activities/:activity_id/lrs/agents` | `/activities/{activityid}/lrs/agents` | `src/routes/activities/activities.lrs.routes.ts:14` |
| `DELETE` | `/activities/:activity_id/lrs/agents/profile` | `/activities/{activityid}/lrs/agents/profile` | `src/routes/activities/activities.lrs.routes.ts:18` |
| `GET` | `/activities/:activity_id/lrs/agents/profile` | `/activities/{activityid}/lrs/agents/profile` | `src/routes/activities/activities.lrs.routes.ts:15` |
| `POST` | `/activities/:activity_id/lrs/agents/profile` | `/activities/{activityid}/lrs/agents/profile` | `src/routes/activities/activities.lrs.routes.ts:16` |
| `PUT` | `/activities/:activity_id/lrs/agents/profile` | `/activities/{activityid}/lrs/agents/profile` | `src/routes/activities/activities.lrs.routes.ts:17` |
| `GET` | `/activities/:activity_id/lrs/extension/:extension_id` | `/activities/{activityid}/lrs/extension/{extensionid}` | `src/routes/activities/activities.lrs.routes.ts:29` |
| `GET` | `/activities/:activity_id/lrs/statements` | `/activities/{activityid}/lrs/statements` | `src/routes/activities/activities.lrs.routes.ts:10` |
| `POST` | `/activities/:activity_id/lrs/statements` | `/activities/{activityid}/lrs/statements` | `src/routes/activities/activities.lrs.routes.ts:12` |
| `PUT` | `/activities/:activity_id/lrs/statements` | `/activities/{activityid}/lrs/statements` | `src/routes/activities/activities.lrs.routes.ts:13` |
| `GET` | `/activities/:activity_id/lrs/statements/more` | `/activities/{activityid}/lrs/statements/more` | `src/routes/activities/activities.lrs.routes.ts:11` |
| `GET` | `/activities/:activity_id/open` | `/activities/{activityid}/open` | `src/routes/activities/activities.routes.ts:60` |
| `GET` | `/activities/:activity_id/openable` | `/activities/{activityid}/openable` | `src/routes/activities/activities.routes.ts:58` |
| `GET` | `/activities/:activity_id/presignedurl` | `/activities/{activityid}/presignedurl` | `src/routes/activities/activities.routes.ts:70` |
| `GET` | `/activities/:activity_id/progress` | `/activities/{activityid}/progress` | `src/routes/activities/activities.routes.ts:62` |
| `POST` | `/activities/:activity_id/progress` | `/activities/{activityid}/progress` | `src/routes/activities/activities.routes.ts:66` |
| `GET` | `/activities/:activity_id/result` | `/activities/{activityid}/result` | `src/routes/activities/activities.routes.ts:71` |
| `POST` | `/activities/:activity_id/result` | `/activities/{activityid}/result` | `src/routes/activities/activities.routes.ts:72` |
| `GET` | `/activities/:activity_id/suspension` | `/activities/{activityid}/suspension` | `src/routes/activities/activities.routes.ts:64` |
| `POST` | `/activities/:activity_id/suspension` | `/activities/{activityid}/suspension` | `src/routes/activities/activities.routes.ts:68` |
| `GET` | `/activities/:activity_id/target` | `/activities/{activityid}/target` | `src/routes/activities/activities.routes.ts:59` |
| `GET` | `/activities/:activity_id/tracker_config` | `/activities/{activityid}/tracker_config` | `src/routes/activities/activities.routes.ts:74` |
| `GET` | `/activitytypes` | `/activitytypes` | `src/routes/activitiesTypes/activitiesTypes.routes.ts:30` |
| `GET` | `/admin/lrs/statements` | `/admin/lrs/statements` | `src/routes/admin/admin.routes.ts:10` |
| `POST` | `/admin/lrs/statements` | `/admin/lrs/statements` | `src/routes/admin/admin.routes.ts:11` |
| `GET` | `/admin/lrs/statements/more` | `/admin/lrs/statements/more` | `src/routes/admin/admin.routes.ts:12` |
| `GET` | `/allocatortypes` | `/allocatortypes` | `src/routes/allocatorsTypes/allocatorsTypes.routes.ts:28` |
| `POST` | `/auth2/:activity_id/device` | `/auth2/{activityid}/device` | `src/routes/auth2/auth2.routes.ts:25` |
| `POST` | `/auth2/:activity_id/token` | `/auth2/{activityid}/token` | `src/routes/auth2/auth2.routes.ts:26` |
| `GET` | `/groups` | `/groups` | `src/routes/groups/group.routes.ts:47` |
| `GET` | `/health` | `/health` | `src/app.ts:92` |
| `POST` | `/limesurvey-completion-webhooks` | `/limesurvey-completion-webhooks` | `src/app.ts:89` |
| `GET` | `/limesurvey/:survey_id/surveylanguages` | `/limesurvey/{surveyid}/surveylanguages` | `src/routes/limesurvey/limesurvey.routes.ts:24` |
| `PATCH` | `/limesurvey/:survey_id/surveyowner` | `/limesurvey/{surveyid}/surveyowner` | `src/routes/limesurvey/limesurvey.routes.ts:25` |
| `GET` | `/limesurvey/isAdmin` | `/limesurvey/isadmin` | `src/routes/limesurvey/limesurvey.routes.ts:23` |
| `GET` | `/limesurvey/surveys` | `/limesurvey/surveys` | `src/routes/limesurvey/limesurvey.routes.ts:22` |
| `GET` | `/simlets` | `/simlets` | `src/routes/simlets/simlet.routes.ts:67` |
| `POST` | `/simlets` | `/simlets` | `src/routes/simlets/simlet.routes.ts:68` |
| `DELETE` | `/simlets/:simlet_id` | `/simlets/{simletid}` | `src/routes/simlets/simlet.routes.ts:78` |
| `GET` | `/simlets/:simlet_id` | `/simlets/{simletid}` | `src/routes/simlets/simlet.routes.ts:76` |
| `PATCH` | `/simlets/:simlet_id` | `/simlets/{simletid}` | `src/routes/simlets/simlet.routes.ts:77` |
| `GET` | `/simlets/:simlet_id/export` | `/simlets/{simletid}/export` | `src/routes/simlets/simlet.routes.ts:79` |
| `GET` | `/simlets/:simlet_id/groups` | `/simlets/{simletid}/groups` | `src/routes/simlets/simlet.groups.routes.ts:25` |
| `GET` | `/simlets/:simlet_id/groups` | `/simlets/{simletid}/groups` | `src/routes/simlets/simlet.groups.routes.ts:28` |
| `POST` | `/simlets/:simlet_id/groups` | `/simlets/{simletid}/groups` | `src/routes/simlets/simlet.groups.routes.ts:31` |
| `DELETE` | `/simlets/:simlet_id/groups/:group_id` | `/simlets/{simletid}/groups/{groupid}` | `src/routes/simlets/simlet.groups.routes.ts:36` |
| `GET` | `/simlets/:simlet_id/groups/:group_id` | `/simlets/{simletid}/groups/{groupid}` | `src/routes/simlets/simlet.groups.routes.ts:34` |
| `PATCH` | `/simlets/:simlet_id/groups/:group_id` | `/simlets/{simletid}/groups/{groupid}` | `src/routes/simlets/simlet.groups.routes.ts:35` |
| `POST` | `/simlets/:simlet_id/groups/:group_id/allocate/:session_id` | `/simlets/{simletid}/groups/{groupid}/allocate/{sessionid}` | `src/routes/simlets/simlet.groups.routes.ts:45` |
| `GET` | `/simlets/:simlet_id/groups/:group_id/participants` | `/simlets/{simletid}/groups/{groupid}/participants` | `src/routes/simlets/simlet.groups.routes.ts:39` |
| `POST` | `/simlets/:simlet_id/groups/:group_id/participants` | `/simlets/{simletid}/groups/{groupid}/participants` | `src/routes/simlets/simlet.groups.routes.ts:41` |
| `DELETE` | `/simlets/:simlet_id/groups/:group_id/participants/:participant_id` | `/simlets/{simletid}/groups/{groupid}/participants/{participantid}` | `src/routes/simlets/simlet.groups.routes.ts:44` |
| `POST` | `/simlets/:simlet_id/groups/:group_id/participants/:participant_id` | `/simlets/{simletid}/groups/{groupid}/participants/{participantid}` | `src/routes/simlets/simlet.groups.routes.ts:42` |
| `GET` | `/simlets/:simlet_id/groups/:group_id/participants/count` | `/simlets/{simletid}/groups/{groupid}/participants/count` | `src/routes/simlets/simlet.groups.routes.ts:40` |
| `GET` | `/simlets/:simlet_id/groups/count` | `/simlets/{simletid}/groups/count` | `src/routes/simlets/simlet.groups.routes.ts:29` |
| `GET` | `/simlets/:simlet_id/groups/participants/count` | `/simlets/{simletid}/groups/participants/count` | `src/routes/simlets/simlet.groups.routes.ts:30` |
| `GET` | `/simlets/:simlet_id/participants` | `/simlets/{simletid}/participants` | `src/routes/simlets/simlet.routes.ts:83` |
| `GET` | `/simlets/:simlet_id/permissions` | `/simlets/{simletid}/permissions` | `src/routes/simlets/simlet.permissions.routes.ts:27` |
| `POST` | `/simlets/:simlet_id/permissions` | `/simlets/{simletid}/permissions` | `src/routes/simlets/simlet.permissions.routes.ts:28` |
| `DELETE` | `/simlets/:simlet_id/permissions/:user_id` | `/simlets/{simletid}/permissions/{userid}` | `src/routes/simlets/simlet.permissions.routes.ts:31` |
| `GET` | `/simlets/:simlet_id/permissions/:user_id` | `/simlets/{simletid}/permissions/{userid}` | `src/routes/simlets/simlet.permissions.routes.ts:29` |
| `PATCH` | `/simlets/:simlet_id/permissions/:user_id` | `/simlets/{simletid}/permissions/{userid}` | `src/routes/simlets/simlet.permissions.routes.ts:30` |
| `GET` | `/simlets/:simlet_id/schedule` | `/simlets/{simletid}/schedule` | `src/routes/simlets/simlet.routes.ts:84` |
| `GET` | `/simlets/:simlet_id/sessions` | `/simlets/{simletid}/sessions` | `src/routes/simlets/session.routes.ts:37` |
| `POST` | `/simlets/:simlet_id/sessions` | `/simlets/{simletid}/sessions` | `src/routes/simlets/session.routes.ts:39` |
| `DELETE` | `/simlets/:simlet_id/sessions/:session_id` | `/simlets/{simletid}/sessions/{sessionid}` | `src/routes/simlets/session.routes.ts:42` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id` | `/simlets/{simletid}/sessions/{sessionid}` | `src/routes/simlets/session.routes.ts:40` |
| `PATCH` | `/simlets/:simlet_id/sessions/:session_id` | `/simlets/{simletid}/sessions/{sessionid}` | `src/routes/simlets/session.routes.ts:41` |
| `POST` | `/simlets/:simlet_id/sessions/:session_id/activate` | `/simlets/{simletid}/sessions/{sessionid}/activate` | `src/routes/simlets/session.routes.ts:44` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/activities` | `/simlets/{simletid}/sessions/{sessionid}/activities` | `src/routes/simlets/session.activities.routes.ts:26` |
| `POST` | `/simlets/:simlet_id/sessions/:session_id/activities` | `/simlets/{simletid}/sessions/{sessionid}/activities` | `src/routes/simlets/session.activities.routes.ts:27` |
| `DELETE` | `/simlets/:simlet_id/sessions/:session_id/activities/:activity_id` | `/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | `src/routes/simlets/session.activities.routes.ts:29` |
| `PATCH` | `/simlets/:simlet_id/sessions/:session_id/activities/:activity_id` | `/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | `src/routes/simlets/session.activities.routes.ts:28` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/lrs_test_statements` | `/simlets/{simletid}/sessions/{sessionid}/lrs_test_statements` | `src/routes/simlets/session.routes.ts:54` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/lrs/statements` | `/simlets/{simletid}/sessions/{sessionid}/lrs/statements` | `src/routes/simlets/session.routes.ts:53` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/participants` | `/simlets/{simletid}/sessions/{sessionid}/participants` | `src/routes/simlets/session.routes.ts:43` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/permissions` | `/simlets/{simletid}/sessions/{sessionid}/permissions` | `src/routes/simlets/session.permissions.routes.ts:27` |
| `POST` | `/simlets/:simlet_id/sessions/:session_id/permissions` | `/simlets/{simletid}/sessions/{sessionid}/permissions` | `src/routes/simlets/session.permissions.routes.ts:28` |
| `DELETE` | `/simlets/:simlet_id/sessions/:session_id/permissions/:user_id` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | `src/routes/simlets/session.permissions.routes.ts:31` |
| `GET` | `/simlets/:simlet_id/sessions/:session_id/permissions/:user_id` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | `src/routes/simlets/session.permissions.routes.ts:29` |
| `PATCH` | `/simlets/:simlet_id/sessions/:session_id/permissions/:user_id` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | `src/routes/simlets/session.permissions.routes.ts:30` |
| `DELETE` | `/simlets/:simlet_id/sessions/:session_id/tags/:tag_id` | `/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | `src/routes/simlets/session.routes.ts:46` |
| `POST` | `/simlets/:simlet_id/sessions/:session_id/tags/:tag_id` | `/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | `src/routes/simlets/session.routes.ts:45` |
| `DELETE` | `/simlets/:simlet_id/sessions/:session_id/tester` | `/simlets/{simletid}/sessions/{sessionid}/tester` | `src/routes/simlets/session.routes.ts:50` |
| `PATCH` | `/simlets/:simlet_id/sessions/:session_id/tester` | `/simlets/{simletid}/sessions/{sessionid}/tester` | `src/routes/simlets/session.routes.ts:49` |
| `POST` | `/simlets/:simlet_id/sessions/:session_id/tester` | `/simlets/{simletid}/sessions/{sessionid}/tester` | `src/routes/simlets/session.routes.ts:48` |
| `GET` | `/simlets/:simlet_id/sessions/count` | `/simlets/{simletid}/sessions/count` | `src/routes/simlets/session.routes.ts:38` |
| `DELETE` | `/simlets/:simlet_id/shlink` | `/simlets/{simletid}/shlink` | `src/routes/simlets/simlet.shlink.routes.ts:9` |
| `GET` | `/simlets/:simlet_id/shlink` | `/simlets/{simletid}/shlink` | `src/routes/simlets/simlet.shlink.routes.ts:7` |
| `PATCH` | `/simlets/:simlet_id/shlink` | `/simlets/{simletid}/shlink` | `src/routes/simlets/simlet.shlink.routes.ts:8` |
| `POST` | `/simlets/:simlet_id/shlink` | `/simlets/{simletid}/shlink` | `src/routes/simlets/simlet.shlink.routes.ts:6` |
| `GET` | `/simlets/:simlet_id/tags` | `/simlets/{simletid}/tags` | `src/routes/simlets/simlet.routes.ts:80` |
| `GET` | `/simlets/count` | `/simlets/count` | `src/routes/simlets/simlet.routes.ts:70` |
| `GET` | `/simlets/scheduler` | `/simlets/scheduler` | `src/routes/simlets/simlet.routes.ts:71` |
| `GET` | `/simlets/scheduler/count` | `/simlets/scheduler/count` | `src/routes/simlets/simlet.routes.ts:72` |
| `GET` | `/simlets/tags` | `/simlets/tags` | `src/routes/simlets/simlet.routes.ts:73` |
| `GET` | `/tags` | `/tags` | `src/routes/tags/tags.router.ts:22` |
| `POST` | `/tags` | `/tags` | `src/routes/tags/tags.router.ts:23` |
| `DELETE` | `/tags/:tag_id` | `/tags/{tagid}` | `src/routes/tags/tags.router.ts:25` |
| `PATCH` | `/tags/:tag_id` | `/tags/{tagid}` | `src/routes/tags/tags.router.ts:24` |
| `GET` | `/users` | `/users` | `src/routes/users/user.routes.ts:37` |
| `PATCH` | `/users/:username` | `/users/{username}` | `src/routes/users/user.routes.ts:60` |
| `GET` | `/users/me` | `/users/me` | `src/routes/users/user.routes.ts:39` |
| `GET` | `/version` | `/version` | `src/app.ts:96` |
