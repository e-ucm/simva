# `/activities` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/activities` | [getAllActivities](#getallactivities) |
| `POST` | `/activities` | [addActivity](#addactivity) |
| `GET` | `/activities/{activityid}` | [getActivity](#getactivity) |
| `GET` | `/activities/{activityid}/completion` | [getCompletion](#getcompletion) |
| `POST` | `/activities/{activityid}/completion` | [setCompletion](#setcompletion) |
| `POST` | `/activities/{activityid}/completion/multi` | [setMultiCompletion](#setmulticompletion) |
| `GET` | `/activities/{activityid}/export` | [exportActivity](#exportactivity) |
| `GET` | `/activities/{activityid}/hasresult` | [hasResult](#hasresult) |
| `GET` | `/activities/{activityid}/initialized` | [getActivityInitialized](#getactivityinitialized) |
| `POST` | `/activities/{activityid}/initialized` | [setActivityInitialized](#setactivityinitialized) |
| `GET` | `/activities/{activityid}/lrs_test_statements` | [getTestActivityLrsStatements](#gettestactivitylrsstatements) |
| `GET` | `/activities/{activityid}/lrs/about` | [getAbout](#getabout) |
| `GET` | `/activities/{activityid}/lrs/activities` | [getActivities](#getactivities) |
| `DELETE` | `/activities/{activityid}/lrs/activities/profile` | [deleteActivitiesProfile](#deleteactivitiesprofile) |
| `GET` | `/activities/{activityid}/lrs/activities/profile` | [getActivitiesProfile](#getactivitiesprofile) |
| `POST` | `/activities/{activityid}/lrs/activities/profile` | [setActivitiesProfile](#setactivitiesprofile) |
| `PUT` | `/activities/{activityid}/lrs/activities/profile` | [putActivitiesProfile](#putactivitiesprofile) |
| `DELETE` | `/activities/{activityid}/lrs/activities/status` | [deleteActivitiesStatus](#deleteactivitiesstatus) |
| `GET` | `/activities/{activityid}/lrs/activities/status` | [getActivitiesStatus](#getactivitiesstatus) |
| `POST` | `/activities/{activityid}/lrs/activities/status` | [setActivitiesStatus](#setactivitiesstatus) |
| `PUT` | `/activities/{activityid}/lrs/activities/status` | [putActivitiesStatus](#putactivitiesstatus) |
| `GET` | `/activities/{activityid}/lrs/agents` | [getAgent](#getagent) |
| `DELETE` | `/activities/{activityid}/lrs/agents/profile` | [deleteAgentProfile](#deleteagentprofile) |
| `GET` | `/activities/{activityid}/lrs/agents/profile` | [getAgentProfile](#getagentprofile) |
| `POST` | `/activities/{activityid}/lrs/agents/profile` | [setAgentProfile](#setagentprofile) |
| `PUT` | `/activities/{activityid}/lrs/agents/profile` | [putAgentProfile](#putagentprofile) |
| `GET` | `/activities/{activityid}/lrs/extension/{extension_id}` | [getExtension](#getextension) |
| `GET` | `/activities/{activityid}/lrs/statements` | [getActivityLrsStatements](#getactivitylrsstatements) |
| `POST` | `/activities/{activityid}/lrs/statements` | [setStatement](#setstatement) |
| `PUT` | `/activities/{activityid}/lrs/statements` | [putStatement](#putstatement) |
| `GET` | `/activities/{activityid}/lrs/statements/more` | [getActivityMoreLrsStatements](#getactivitymorelrsstatements) |
| `GET` | `/activities/{activityid}/open` | [openActivity](#openactivity) |
| `GET` | `/activities/{activityid}/openable` | [getOpenable](#getopenable) |
| `GET` | `/activities/{activityid}/presignedurl` | [getPresignedFileUrl](#getpresignedfileurl) |
| `GET` | `/activities/{activityid}/progress` | [getProgress](#getprogress) |
| `POST` | `/activities/{activityid}/progress` | [setProgress](#setprogress) |
| `GET` | `/activities/{activityid}/result` | [getResult](#getresult) |
| `POST` | `/activities/{activityid}/result` | [setResult](#setresult) |
| `POST` | `/activities/{activityid}/session` | [setSession](#setsession) |
| `POST` | `/activities/{activityid}/suspension` | [setSuspension](#setsuspension) |
| `GET` | `/activities/{activityid}/target` | [getActivityTarget](#getactivitytarget) |
| `GET` | `/activities/{activityid}/tracker_config` | [getActivityConfig](#getactivityconfig) |

## getAllActivities

`GET /activities`

**gets the list of activities across every session**

Obtains the list of activities across every session.

Administrators and the read only `garbagecollector` service account receive the activities of
every simlet, while the rest of the roles only receive the activities of their own simlets.

The `searchString` query param accepts a JSON object to filter the result, where every field is
optional and an empty object returns every activity:
- `type`: a string or an array of strings with the activity types to include, such as
  `{"type":["gameplay","manual"]}`.
- `name`: a string the activity name must contain.
- `simlet_id`: a number or an array of numbers to restrict the result to those simlets. For
  non administrators it is intersected with the simlets of the current user.

A `searchString` that is not JSON is used as an activity name filter.

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of activities | array<object & object & object & object & object \\| object & object & object \\| object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addActivity

`POST /activities`

**adds a Activity**

Creates a new activity for the current teacher.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "anyOf": [
    {
      "oneOf": [
        {
          "allOf": [
            {
              "allOf": [
                {
                  "type": "object",
                  "properties": {
                    "activity_name": {
                      "type": "string",
                      "example": "Pre-survey activity"
                    },
                    "activity_type": {
                      "type": "string",
                      "enum": [
                        "default",
                        "manual",
                        "limesurvey",
                        "gameplay",
                        "lti_tool"
                      ],
                      "example": "limesurvey"
                    },
                    "activity_comply_with_GDPR": {
                      "type": "boolean",
                      "example": true
                    }
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "survey_language": {
                      "type": "string",
                      "example": "en"
                    }
                  }
                }
              ]
            },
            {
              "allOf": [
                {
                  "type": "object",
                  "properties": {
                    "activity_name": {
                      "type": "string",
                      "example": "Pre-survey activity"
                    },
                    "activity_type": {
                      "type": "string",
                      "enum": [
                        "default",
                        "manual",
                        "limesurvey",
                        "gameplay",
                        "lti_tool"
                      ],
                      "example": "limesurvey"
                    },
                    "activity_comply_with_GDPR": {
                      "type": "boolean",
                      "example": true
                    }
                  }
                },
                {
                  "type": "object",
                  "required": [
                    "activity_name",
                    "activity_type"
                  ]
                }
              ]
            },
            {
              "type": "object",
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | activity created | object & object & object & object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getActivity

`GET /activities/{activityid}`

**gets the activity with the given ID**

Obtains the requested activity

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Activity object | object & object & object & object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getCompletion

`GET /activities/{activityid}/completion`

**gets the completion status of the activity**

Obtains the completion status of the activity

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/completion" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the completion status of the activity | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## setCompletion

`POST /activities/{activityid}/completion`

**sets the completion status of the activity**

Set the completion status of the activity for a student

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/completion" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the completion status of the activity | object & object \\| object & object \\| object & object \\| object & object \\| object & object & object & object & object & object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## setMultiCompletion

`POST /activities/{activityid}/completion/multi`

**sets the completion status for all participants of the activity**

Set the completion status of the activity for all participants

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/completion/multi" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is openable or not | object & object \\| object & object \\| object & object \\| object & object \\| object & object & object & object & object & object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## exportActivity

`GET /activities/{activityid}/export`

**gets the activity export with the given ID**

Obtains the requested activity export

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/export" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `complete` | boolean | no | If true, the completion status of the activity will be returned |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Activity export object | object & object & object & object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## hasResult

`GET /activities/{activityid}/hasresult`

**gets true if has results of the activity**

Obtains true or false depending on if the user have results
or not for the activity.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/hasresult" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |
| query | `type` | string | no | If the activity has multiple types of results, the type of result can be specified here |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | true or false depending on if has or not results | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getActivityInitialized

`GET /activities/{activityid}/initialized`

**gets the initialized status of the activity**

Obtains the initialized status of the activity

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/initialized" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is initialized or not | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## setActivityInitialized

`POST /activities/{activityid}/initialized`

**sets the initialized status of the activity**

Set the initialized status of the activity for a student

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/initialized" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | set the initialized status of the activity for a student | object & object \\| object & object \\| object & object \\| object & object \\| object & object & object & object & object & object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getTestActivityLrsStatements

`GET /activities/{activityid}/lrs_test_statements`

**gets the statement of the activity**

Get the statement object of the activity for a teacher

- Allowed roles: administrator, teacher, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs_test_statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `agent` | string | no | Filter statements by agent or identified group |
| query | `attachments` | boolean | no | Include attachments in the response |
| query | `ascending` | boolean | no | Return statements in ascending stored-time order |
| query | `activity` | string | no | The activity IRI to filter xAPI statements |
| query | `format` | string ("ids" \\| "exact" \\| "canonical") | no | Statement representation format |
| query | `related_agents` | boolean | no | Include statements related to matching agents |
| query | `related_activities` | boolean | no | Include statements related to the specified activity |
| query | `limit` | integer | no | Maximum number of xAPI statements to return |
| query | `from` | string | no | Pagination cursor returned by the xAPI statement endpoint |
| query | `registration` | string | no | Filter statements by registration UUID |
| query | `since` | string | no | Return statements stored since this timestamp |
| query | `statementId` | string | no | Id of Statement to fetch |
| query | `until` | string | no | Return statements stored at or before this timestamp |
| query | `verb` | string | no | Filter statements by verb IRI |
| query | `voidedStatementId` | string | no | Id of voided Statement to fetch |
| query | `more` | string | no | Return more statements using this URL provided in the "more" property of the response |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the result of the students required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getAbout

`GET /activities/{activityid}/lrs/about`

**gets the LRS Information of the activity**

Get the LRS Information of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/about" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the LRS Information of the activity of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getActivities

`GET /activities/{activityid}/lrs/activities`

**gets the activities object of the activity**

Get the  activities object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## deleteActivitiesProfile

`DELETE /activities/{activityid}/lrs/activities/profile`

**delete the activities profile for the activity**

delete the activities profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X DELETE "${SIMVA_URL}/activities/{activityid}/lrs/activities/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities profile has been deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getActivitiesProfile

`GET /activities/{activityid}/lrs/activities/profile`

**gets the activities profile object of the activity**

Get the activities profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/activities/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities profile of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## setActivitiesProfile

`POST /activities/{activityid}/lrs/activities/profile`

**Post the activities profile for the activity**

Post the activities profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/lrs/activities/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities profile has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## putActivitiesProfile

`PUT /activities/{activityid}/lrs/activities/profile`

**put the activities profile for the activity**

Put the activities profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X PUT "${SIMVA_URL}/activities/{activityid}/lrs/activities/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities profile has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## deleteActivitiesStatus

`DELETE /activities/{activityid}/lrs/activities/status`

**delete the activities status for the activity**

delete the activities status object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X DELETE "${SIMVA_URL}/activities/{activityid}/lrs/activities/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities status has been deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getActivitiesStatus

`GET /activities/{activityid}/lrs/activities/status`

**gets the activities status object of the activity**

Get the activities status object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/activities/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities status of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## setActivitiesStatus

`POST /activities/{activityid}/lrs/activities/status`

**Post the activities status for the activity**

Post the activities status object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/lrs/activities/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities status has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## putActivitiesStatus

`PUT /activities/{activityid}/lrs/activities/status`

**put the activities status for the activity**

Put the activities status object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X PUT "${SIMVA_URL}/activities/{activityid}/lrs/activities/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the activities status has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getAgent

`GET /activities/{activityid}/lrs/agents`

**gets the agent object of the activity**

Get the  agent object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/agents" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the agents of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## deleteAgentProfile

`DELETE /activities/{activityid}/lrs/agents/profile`

**delete the agent profile for the activity**

delete the agent profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X DELETE "${SIMVA_URL}/activities/{activityid}/lrs/agents/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the agent profile has been deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getAgentProfile

`GET /activities/{activityid}/lrs/agents/profile`

**gets the agent profile object of the activity**

Get the agent profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/agents/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the agent profile of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## setAgentProfile

`POST /activities/{activityid}/lrs/agents/profile`

**Post the agent profile for the activity**

Post the agent profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/lrs/agents/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the agent profile has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## putAgentProfile

`PUT /activities/{activityid}/lrs/agents/profile`

**put the agent profile for the activity**

Put the agent profile object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X PUT "${SIMVA_URL}/activities/{activityid}/lrs/agents/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the agent profile has been stocked | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getExtension

`GET /activities/{activityid}/lrs/extension/{extension_id}`

**gets the extension Information**

Get the LRS extension Information of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/extension/{extension_id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| path | `extension_id` | string | yes | Extension identifier |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the LRS extension Information of the activity of the students required | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getActivityLrsStatements

`GET /activities/{activityid}/lrs/statements`

**gets the statement of the activity**

Get the statement object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `agent` | string | no | Filter statements by agent or identified group |
| query | `attachments` | boolean | no | Include attachments in the response |
| query | `ascending` | boolean | no | Return statements in ascending stored-time order |
| query | `activity` | string | no | The activity IRI to filter xAPI statements |
| query | `format` | string ("ids" \\| "exact" \\| "canonical") | no | Statement representation format |
| query | `related_agents` | boolean | no | Include statements related to matching agents |
| query | `related_activities` | boolean | no | Include statements related to the specified activity |
| query | `limit` | integer | no | Maximum number of xAPI statements to return |
| query | `from` | string | no | Pagination cursor returned by the xAPI statement endpoint |
| query | `registration` | string | no | Filter statements by registration UUID |
| query | `since` | string | no | Return statements stored since this timestamp |
| query | `statementId` | string | no | Id of Statement to fetch |
| query | `until` | string | no | Return statements stored at or before this timestamp |
| query | `verb` | string | no | Filter statements by verb IRI |
| query | `voidedStatementId` | string | no | Id of voided Statement to fetch |
| query | `more` | string | no | Return more statements using this URL provided in the "more" property of the response |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the result of the students required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## setStatement

`POST /activities/{activityid}/lrs/statements`

**Post the statement for the activity**

Post the statement object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the ids of the statements created | array<string> |
| `201` | the ids of the statements created | array<string> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## putStatement

`PUT /activities/{activityid}/lrs/statements`

**put the statement for the activity**

Put the statement object of the activity for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X PUT "${SIMVA_URL}/activities/{activityid}/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the ids of the statements created | array<string> |
| `201` | the ids of the statements created | array<string> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getActivityMoreLrsStatements

`GET /activities/{activityid}/lrs/statements/more`

**gets more statements of the activity**

Get more statement objects of the activity using the more URL

- Allowed roles: administrator, teacher, student, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/lrs/statements/more" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `more` | string | no | Return more statements using this URL provided in the "more" property of the response |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the result of the statements required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## openActivity

`GET /activities/{activityid}/open`

**redirects the user to the activity landing**

If the activity is openable, redirects the user to
the activity landing.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/open" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | activity is openable | unknown |
| `307` | redirects to the valid landing | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getOpenable

`GET /activities/{activityid}/openable`

**returns if the activity can be opened or not**

If the activity can be opened, e.g. is hosted in a web,
the activity will be openable as can be opened.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/openable" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is openable or not | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getPresignedFileUrl

`GET /activities/{activityid}/presignedurl`

**gets the presigned minio url**

Obtains the presigned minio url of the activity data result.

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/presignedurl" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |
| query | `type` | string | no | If the activity has multiple types of results, the type of result can be specified here |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the presigned minio url of the activity data result | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getProgress

`GET /activities/{activityid}/progress`

**gets the progress status of the activity**

Obtains the progress status of the activity

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/progress" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the progress status of the activity | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## setProgress

`POST /activities/{activityid}/progress`

**progress in the activity**

Set the progress status of the activity for a student

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/progress" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is progressed or not | object & object \\| object & object \\| object & object \\| object & object \\| object & object & object & object & object & object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getResult

`GET /activities/{activityid}/result`

**gets the results of the activity**

Obtains the result of the activity for the specified user

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/result" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `users` | string | no | the list of users comma separated or none for all (if logged in student , user is not needed) |
| query | `type` | string | no | If the activity has multiple types of results, the type of result can be specified here |
| query | `all` | string | no | The type of the Limesurvey result |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the result of the students required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `500` | Internal server error | object |

---

## setResult

`POST /activities/{activityid}/result`

**sets the result for the activity**

Set the result of the activity for a student

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/result" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is openable or not | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## setSession

`POST /activities/{activityid}/session`

**sessioning endpoint for uadventure sessioning**

Sessioning endpoint

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/session" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `time` | integer | no | milliseconds to return |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the session of the activity | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## setSuspension

`POST /activities/{activityid}/suspension`

**suspend the activity**

Set the suspend status of the activity for a student

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/activities/{activityid}/suspension" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |
| query | `user` | string | no | the user to get its completion status (if logged in student , user is not needed) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | if it is suspended or not | object & object \\| object & object \\| object & object \\| object & object \\| object & object & object & object & object & object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getActivityTarget

`GET /activities/{activityid}/target`

**returns if the activity can be opened or not**

If the activity can be opened, e.g. is hosted in a web,
this endpoint will return the target URI

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/target" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the target URI of the activity | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getActivityConfig

`GET /activities/{activityid}/tracker_config`

**gets the config tracker for the activity**

Obtains the requested tracker config

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/activities/{activityid}/tracker_config" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | tracker config | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---
