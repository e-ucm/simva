# `/simlets` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/simlets` | [getAllSimlets](#getallsimlets) |
| `POST` | `/simlets` | [createSimlet](#createsimlet) |
| `DELETE` | `/simlets/{simletid}` | [deleteSimlet](#deletesimlet) |
| `GET` | `/simlets/{simletid}` | [getSimletById](#getsimletbyid) |
| `PATCH` | `/simlets/{simletid}` | [patchSimlet](#patchsimlet) |
| `GET` | `/simlets/{simletid}/events` | [limesurveyCompletionWebhook](#limesurveycompletionwebhook) |
| `GET` | `/simlets/{simletid}/events/getPresignedUrl` | [getEventsPresignedUrl](#geteventspresignedurl) |
| `GET` | `/simlets/{simletid}/export` | [getSimletExport](#getsimletexport) |
| `GET` | `/simlets/{simletid}/groups` | [getSimletGroups](#getsimletgroups) |
| `POST` | `/simlets/{simletid}/groups` | [createGroup](#creategroup) |
| `DELETE` | `/simlets/{simletid}/groups/{groupid}` | [deleteGroup](#deletegroup) |
| `GET` | `/simlets/{simletid}/groups/{groupid}` | [getGroup](#getgroup) |
| `PATCH` | `/simlets/{simletid}/groups/{groupid}` | [updateGroup](#updategroup) |
| `POST` | `/simlets/{simletid}/groups/{groupid}/allocate/{sessionid}` | [allocateToSessionSimlet](#allocatetosessionsimlet) |
| `GET` | `/simlets/{simletid}/groups/{groupid}/participants` | [getGroupParticipants](#getgroupparticipants) |
| `POST` | `/simlets/{simletid}/groups/{groupid}/participants` | [addUser](#adduser) |
| `DELETE` | `/simlets/{simletid}/groups/{groupid}/participants/{userid}` | [deleteUser](#deleteuser) |
| `POST` | `/simlets/{simletid}/groups/{groupid}/participants/{userid}` | [addUserToGroup](#addusertogroup) |
| `GET` | `/simlets/{simletid}/groups/{groupid}/participants/count` | [getGroupCount](#getgroupcount) |
| `POST` | `/simlets/{simletid}/groups/{groupid}/random/allocate` | [allocateRandomToSessionSimlet](#allocaterandomtosessionsimlet) |
| `GET` | `/simlets/{simletid}/groups/count` | [getGroupCount](#getgroupcount-1) |
| `GET` | `/simlets/{simletid}/groups/participants/count` | [getGroupCount](#getgroupcount-2) |
| `GET` | `/simlets/{simletid}/participants` | [getSimletParticipants](#getsimletparticipants) |
| `GET` | `/simlets/{simletid}/permissions` | [getSimletPermissions](#getsimletpermissions) |
| `POST` | `/simlets/{simletid}/permissions` | [createSimletPermissions](#createsimletpermissions) |
| `DELETE` | `/simlets/{simletid}/permissions/{userid}` | [deleteSimletPermissionsForUser](#deletesimletpermissionsforuser) |
| `GET` | `/simlets/{simletid}/permissions/{userid}` | [getSimletPermissionsForUser](#getsimletpermissionsforuser) |
| `PATCH` | `/simlets/{simletid}/permissions/{userid}` | [patchSimletPermissionsForUser](#patchsimletpermissionsforuser) |
| `GET` | `/simlets/{simletid}/schedule` | [getSchedule](#getschedule) |
| `GET` | `/simlets/{simletid}/schedule/events` | [GetSSEEvent](#getsseevent) |
| `GET` | `/simlets/{simletid}/schedule/events/getPresignedUrl` | [getScheduleEventsPresignedUrl](#getscheduleeventspresignedurl) |
| `GET` | `/simlets/{simletid}/sessions` | [getSimletSessions](#getsimletsessions) |
| `POST` | `/simlets/{simletid}/sessions` | [createSimletSession](#createsimletsession) |
| `DELETE` | `/simlets/{simletid}/sessions/{sessionid}` | [deleteSession](#deletesession) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}` | [getSession](#getsession) |
| `PATCH` | `/simlets/{simletid}/sessions/{sessionid}` | [patchSession](#patchsession) |
| `POST` | `/simlets/{simletid}/sessions/{sessionid}/activate` | [activateSimletSession](#activatesimletsession) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/activities` | [getSessionActivities](#getsessionactivities) |
| `POST` | `/simlets/{simletid}/sessions/{sessionid}/activities` | [addActivityToSession](#addactivitytosession) |
| `DELETE` | `/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | [deleteSessionActivity](#deletesessionactivity) |
| `PATCH` | `/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}` | [patchSessionActivity](#patchsessionactivity) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/lrs_test_statements` | [getTestStatement](#getteststatement) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/lrs/statements` | [getStatement](#getstatement) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/participants` | [getSessionSimletParticipants](#getsessionsimletparticipants) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/permissions` | [getSessionPermissions](#getsessionpermissions) |
| `POST` | `/simlets/{simletid}/sessions/{sessionid}/permissions` | [createSessionPermissions](#createsessionpermissions) |
| `DELETE` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | [deleteSessionPermissionsForUser](#deletesessionpermissionsforuser) |
| `GET` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | [getSessionPermissionsForUser](#getsessionpermissionsforuser) |
| `PATCH` | `/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}` | [patchSessionPermissionsForUser](#patchsessionpermissionsforuser) |
| `DELETE` | `/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | [deleteTagForUser](#deletetagforuser) |
| `POST` | `/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}` | [addTagForUser](#addtagforuser) |
| `DELETE` | `/simlets/{simletid}/sessions/{sessionid}/tester` | [deleteTesterForSession](#deletetesterforsession) |
| `PATCH` | `/simlets/{simletid}/sessions/{sessionid}/tester` | [resetTesterForSession](#resettesterforsession) |
| `POST` | `/simlets/{simletid}/sessions/{sessionid}/tester` | [addTesterForSession](#addtesterforsession) |
| `GET` | `/simlets/{simletid}/sessions/count` | [getSessionSimletCount](#getsessionsimletcount) |
| `DELETE` | `/simlets/{simletid}/shlink` | [deleteSimletShlink](#deletesimletshlink) |
| `GET` | `/simlets/{simletid}/shlink` | [getSimletShlink](#getsimletshlink) |
| `PATCH` | `/simlets/{simletid}/shlink` | [updateSimletShlink](#updatesimletshlink) |
| `POST` | `/simlets/{simletid}/shlink` | [createSimletShlink](#createsimletshlink) |
| `GET` | `/simlets/{simletid}/tags` | [getSimletTagsForUser](#getsimlettagsforuser) |
| `GET` | `/simlets/count` | [getSimletCount](#getsimletcount) |
| `POST` | `/simlets/import` | [addSimletFromImport](#addsimletfromimport) |
| `GET` | `/simlets/scheduler` | [getAllSchedulerSimlets](#getallschedulersimlets) |
| `GET` | `/simlets/scheduler/count` | [getSimletCount](#getsimletcount-1) |
| `GET` | `/simlets/tags` | [getSimletTagsForUser](#getsimlettagsforuser-1) |

## getAllSimlets

`GET /simlets`

**gets the list of studies for the current teacher**

Obtains the list of studies for the current teacher.

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |
| query | `status` | string ("active" \\| "archived") | no |  |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of studies for this teacher | array<object & object \\| object & object & object \\| object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## createSimlet

`POST /simlets`

**adds an simlet for the current teacher**

Creates a new simlet for the current teacher.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, optional.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "simlet_name": {
          "type": "string",
          "example": "Survey for SG validation"
        },
        "simlet_description": {
          "type": "string",
          "example": "A comprehensive simlet for serious game validation"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "simlet_name",
        "simlet_description"
      ]
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `201` | simlet created | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteSimlet

`DELETE /simlets/{simletid}`

**Deletes the simlet with the given ID**

Deleted the designed simlet

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | simlet deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletById

`GET /simlets/{simletid}`

**gets the simlet with the given ID**

Obtains the requested simlet

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | simlet object | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## patchSimlet

`PATCH /simlets/{simletid}`

**updates the simlet**

Updates an existing simlet

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "simlet_name": {
          "type": "string",
          "example": "Survey for SG validation"
        },
        "simlet_description": {
          "type": "string",
          "example": "A comprehensive simlet for serious game validation"
        }
      }
    },
    {
      "type": "object",
      "properties": {
        "simlet_archived": {
          "type": "boolean",
          "example": false
        },
        "sessions": {
          "type": "array",
          "items": {
            "type": "integer"
          }
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item updated | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## limesurveyCompletionWebhook

`GET /simlets/{simletid}/events`

**send Server Side Events to Client for this simlet**

send Server Side Events to Client

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/events" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Event processed | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getEventsPresignedUrl

`GET /simlets/{simletid}/events/getPresignedUrl`

**get getPresignedUrl for Server Side Events to Client for this simlet**

get getPresignedUrl Server Side Events to Client

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/events/getPresignedUrl" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Event processed | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletExport

`GET /simlets/{simletid}/export`

**gets the simlet export with the given ID**

Obtains the requested simlet Export

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/export" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | simlet object | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletGroups

`GET /simlets/{simletid}/groups`

**gets the assigned groups to the simlet**

Obtains the list of groups assigned to the simlet

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `use_new_generation` | boolean | no | If true, the new generation of groups will be used |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |
| query | `sandbox` | boolean | no | If true, the new generation of groups will be used |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of groups assigned | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## createGroup

`POST /simlets/{simletid}/groups`

**adds a group for the current user as owner.**

Creates a new group for the current user as owner.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/groups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "simlet_id": {
          "type": "integer",
          "example": 123
        },
        "group_name": {
          "type": "string",
          "example": "Session group for School"
        },
        "group_use_new_generation": {
          "type": "boolean",
          "example": true
        },
        "group_allocator_type": {
          "type": "string",
          "enum": [
            "default",
            "session",
            "group",
            "random"
          ],
          "example": "default"
        },
        "group_sandbox": {
          "type": "boolean",
          "example": false
        }
      }
    },
    {
      "type": "object",
      "required": [
        "group_name",
        "group_use_new_generation",
        "group_sandbox"
      ]
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group created | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteGroup

`DELETE /simlets/{simletid}/groups/{groupid}`

**delete the group**

delete an existing group

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | deleted group | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getGroup

`GET /simlets/{simletid}/groups/{groupid}`

**gets the group with the given ID**

Obtains the requested group

- Allowed roles: administrator, student, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group object | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## updateGroup

`PATCH /simlets/{simletid}/groups/{groupid}`

**updates the group**

Updates an existing group

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "type": "object",
  "properties": {
    "simlet_id": {
      "type": "integer",
      "example": 123
    },
    "group_name": {
      "type": "string",
      "example": "Session group for School"
    },
    "group_use_new_generation": {
      "type": "boolean",
      "example": true
    },
    "group_allocator_type": {
      "type": "string",
      "enum": [
        "default",
        "session",
        "group",
        "random"
      ],
      "example": "default"
    },
    "group_sandbox": {
      "type": "boolean",
      "example": false
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## allocateToSessionSimlet

`POST /simlets/{simletid}/groups/{groupid}/allocate/{sessionid}`

**allocates a participant or group to a session**

Allocates participants to the selected session using the configured allocator.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/allocate/{sessionid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |
| path | `sessionid` | integer | yes | The session ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "type": "object",
  "properties": {
    "participant_id": {
      "type": "integer",
      "example": 123
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | allocation applied | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getGroupParticipants

`GET /simlets/{simletid}/groups/{groupid}/participants`

**gets the list of participants for this group**

Obtains the list of participants of the group

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/participants" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of participants | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addUser

`POST /simlets/{simletid}/groups/{groupid}/participants`

**adds a user.**

Creates a new user for the current group.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/participants" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `groupid` | integer | yes | The group ID |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "oneOf": [
    {
      "allOf": [
        {
          "type": "object",
          "properties": {
            "username": {
              "type": "string",
              "example": "username_unique"
            },
            "isToken": {
              "type": "boolean",
              "example": false
            },
            "token": {
              "type": "string",
              "nullable": true,
              "example": "user"
            },
            "email": {
              "type": "string",
              "example": "email@example.com"
            },
            "role": {
              "type": "string",
              "description": "The role for the user to have. Some\nexamples include teacher, student \nteaching-assistant or researcher\n",
              "enum": [
                "norole",
                "student",
                "teacher",
                "teaching-assistant",
                "researcher",
                "administrator",
                "lrsmanager"
              ]
            }
          }
        },
        {
          "type": "object",
          "required": [
            "isToken",
            "token",
            "role"
          ]
        }
      ]
    },
    {
      "allOf": [
        {
          "type": "object",
          "properties": {
            "username": {
              "type": "string",
              "example": "username_unique"
            },
            "isToken": {
              "type": "boolean",
              "example": false
            },
            "token": {
              "type": "string",
              "nullable": true,
              "example": "user"
            },
            "email": {
              "type": "string",
              "example": "email@example.com"
            },
            "role": {
              "type": "string",
              "description": "The role for the user to have. Some\nexamples include teacher, student \nteaching-assistant or researcher\n",
              "enum": [
                "norole",
                "student",
                "teacher",
                "teaching-assistant",
                "researcher",
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item created | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteUser

`DELETE /simlets/{simletid}/groups/{groupid}/participants/{userid}`

**deletes a user.**

Deletes a user from the current group.

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/participants/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `groupid` | integer | yes | The group ID |
| path | `userid` | integer | yes | The user ID |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `keycloakDelete` | boolean | no | If true, the user will be deleted also in keycloak. Only for testing purposes |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addUserToGroup

`POST /simlets/{simletid}/groups/{groupid}/participants/{userid}`

**add a user to a group.**

Adds a user to the current group.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/participants/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `groupid` | integer | yes | The group ID |
| path | `userid` | integer | yes | The user ID |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getGroupCount

`GET /simlets/{simletid}/groups/{groupid}/participants/count`

**gets the total count of groups**

Gets the total number of groups available to the current user

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/participants/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group count | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## allocateRandomToSessionSimlet

`POST /simlets/{simletid}/groups/{groupid}/random/allocate`

**allocates randomly participant or group to a session**

Allocates participants to the selected session using the configured randomallocator.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/groups/{groupid}/random/allocate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `groupid` | integer | yes | The group ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "session_id": {
        "type": "integer",
        "example": 123
      },
      "percentage": {
        "type": "integer",
        "example": 50
      }
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | allocation applied | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getGroupCount

`GET /simlets/{simletid}/groups/count`

**gets the total count of groups**

Gets the total number of groups available to the current user

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `sandbox` | boolean | no | If true, the new generation of groups will be used |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group count | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getGroupCount

`GET /simlets/{simletid}/groups/participants/count`

**gets the total count of groups**

Gets the total number of groups available to the current user

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/groups/participants/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | group count | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletParticipants

`GET /simlets/{simletid}/participants`

**gets the list of participants for this simlet**

Obtains the list of participants of the simlet

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/participants" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of participants | array<object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletPermissions

`GET /simlets/{simletid}/permissions`

**gets permissions for a simlet**

Gets all user permissions for the specified simlet

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/permissions" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | simlet permissions | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## createSimletPermissions

`POST /simlets/{simletid}/permissions`

**creates permissions for a simlet**

Creates new user permissions for the specified simlet

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/permissions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 123
        },
        "permission": {
          "type": "string",
          "example": "READ_WRITE"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "user_id",
        "permission"
      ]
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions created | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteSimletPermissionsForUser

`DELETE /simlets/{simletid}/permissions/{userid}`

**deletes permissions for a user in a simlet**

Deletes permissions for a specific user in the specified simlet

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `userid` | integer | yes | The user ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletPermissionsForUser

`GET /simlets/{simletid}/permissions/{userid}`

**gets permissions for a user in a simlet**

Gets permissions for a specific user in the specified simlet

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `userid` | integer | yes | The user ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | user permissions for simlet | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## patchSimletPermissionsForUser

`PATCH /simlets/{simletid}/permissions/{userid}`

**updates permissions for a user in a simlet**

Updates permissions for a specific user in the specified simlet

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `userid` | integer | yes | The user ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 123
        },
        "permission": {
          "type": "string",
          "example": "READ_WRITE"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "user_id",
        "username",
        "permission",
        "isCurrentUser"
      ],
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 456
        },
        "username": {
          "type": "string",
          "example": "teacher1"
        },
        "isCurrentUser": {
          "type": "boolean",
          "example": true
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getSchedule

`GET /simlets/{simletid}/schedule`

**gets the list of scheduled activities for the student**

Obtains the list of scheduled activities for the current
student and simlet, and its completion status. Hides the
current used session to the user.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/schedule" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | The list of scheduled activities in order. | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `500` | Internal server error | object |

---

## GetSSEEvent

`GET /simlets/{simletid}/schedule/events`

**send Server Side Events to Client for this simlet**

send Server Side Events to Client

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/schedule/events" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | presigned URL | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getScheduleEventsPresignedUrl

`GET /simlets/{simletid}/schedule/events/getPresignedUrl`

**get getPresignedUrl for Server Side Events to Client for this simlet**

get getPresignedUrl Server Side Events to Client

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/schedule/events/getPresignedUrl" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | presigned URL | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletSessions

`GET /simlets/{simletid}/sessions`

**gets the sessions from a simlet**

Obtains the list of sessions assigned to the simlet

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |
| query | `status` | string ("active" \\| "inactive" \\| "terminated") | no |  |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of sessions assigned | array<object & object \\| object & object & object \\| object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## createSimletSession

`POST /simlets/{simletid}/sessions`

**adds a session to the simlet**

Adds a session for the current group

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "session_name": {
          "type": "string",
          "example": "Session A for my simlet"
        },
        "session_description": {
          "type": "string",
          "example": "Pre-session session for baseline measurement"
        },
        "session_can_be_manually_activated": {
          "type": "boolean",
          "example": true
        }
      }
    },
    {
      "type": "object",
      "required": [
        "session_name",
        "session_description",
        "session_can_be_manually_activated"
      ]
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | session created | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteSession

`DELETE /simlets/{simletid}/sessions/{sessionid}`

**deletes the session with the given ID**

Deleted the selected session

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | success | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSession

`GET /simlets/{simletid}/sessions/{sessionid}`

**gets the session with the given ID**

Obtains the requested session

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | session object | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## patchSession

`PATCH /simlets/{simletid}/sessions/{sessionid}`

**Modifies the session.**

Modifies the session

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "session_name": {
          "type": "string",
          "example": "Session A for my simlet"
        },
        "session_description": {
          "type": "string",
          "example": "Pre-session session for baseline measurement"
        },
        "session_can_be_manually_activated": {
          "type": "boolean",
          "example": true
        }
      }
    },
    {
      "type": "object",
      "properties": {
        "activities": {
          "type": "array",
          "items": {
            "type": "integer"
          }
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Session updated | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## activateSimletSession

`POST /simlets/{simletid}/sessions/{sessionid}/activate`

**gets the list of activities for the selected session**

Activate, desactivate or terminate the current session

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/activate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "object",
  "required": [
    "activate"
  ],
  "properties": {
    "activate": {
      "type": "string",
      "enum": [
        "active",
        "inactive",
        "terminated"
      ]
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the current session | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getSessionActivities

`GET /simlets/{simletid}/sessions/{sessionid}/activities`

**gets the list of activities for the selected session**

Obtains the list of activities for the selected session

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of activities for this session | array<object & object & object & object & object \\| object & object & object \\| object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addActivityToSession

`POST /simlets/{simletid}/sessions/{sessionid}/activities`

**adds a Activity to a session**

Creates a new activity for the current teacher.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

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

## deleteSessionActivity

`DELETE /simlets/{simletid}/sessions/{sessionid}/activities/{activityid}`

**Deletes an activity from a session.**

Deletes the specified activity from the session.

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `204` | Activity deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## patchSessionActivity

`PATCH /simlets/{simletid}/sessions/{sessionid}/activities/{activityid}`

**Modifies an activity in a session.**

Modifies the activity within the specified session.

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/activities/{activityid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `activityid` | integer | yes | The activity ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "anyOf": [
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
          "properties": {
            "manual_user_managed": {
              "type": "boolean",
              "example": true
            },
            "manual_ressource_type": {
              "type": "string",
              "enum": [
                "WEB",
                "EXTERNAL"
              ],
              "example": "WEB"
            },
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Activity updated | object & object & object & object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getTestStatement

`GET /simlets/{simletid}/sessions/{sessionid}/lrs_test_statements`

**gets the statement of the session for a student**

Get the statement object of the session for a student

- Allowed roles: administrator, teacher, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/lrs_test_statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
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

## getStatement

`GET /simlets/{simletid}/sessions/{sessionid}/lrs/statements`

**gets the statement of the session for a student**

Get the statement object of the session for a student

- Allowed roles: administrator, teacher, student, lrsmanager

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
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

## getSessionSimletParticipants

`GET /simlets/{simletid}/sessions/{sessionid}/participants`

**gets the list of participants for this session**

Obtains the list of participants of the session

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/participants" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of participants | array<object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSessionPermissions

`GET /simlets/{simletid}/sessions/{sessionid}/permissions`

**gets permissions for a session**

Gets all user permissions for the specified session

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/permissions" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | session permissions | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## createSessionPermissions

`POST /simlets/{simletid}/sessions/{sessionid}/permissions`

**creates permissions for a session**

Creates new user permissions for the specified session

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/permissions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 123
        },
        "permission": {
          "type": "string",
          "example": "READ_WRITE"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "user_id",
        "username",
        "permission",
        "isCurrentUser"
      ],
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 456
        },
        "username": {
          "type": "string",
          "example": "teacher1"
        },
        "isCurrentUser": {
          "type": "boolean",
          "example": true
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions created | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteSessionPermissionsForUser

`DELETE /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}`

**deletes permissions for a user in a session**

Deletes permissions for a specific user in the specified session

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `userid` | integer | yes | The user ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSessionPermissionsForUser

`GET /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}`

**gets permissions for a user in a session**

Gets permissions for a specific user in the specified session

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `userid` | integer | yes | The user ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | user permissions for session | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## patchSessionPermissionsForUser

`PATCH /simlets/{simletid}/sessions/{sessionid}/permissions/{userid}`

**updates permissions for a user in a session**

Updates permissions for a specific user in the specified session

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/permissions/{userid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `userid` | integer | yes | The user ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 123
        },
        "permission": {
          "type": "string",
          "example": "READ_WRITE"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "user_id",
        "username",
        "permission",
        "isCurrentUser"
      ],
      "properties": {
        "user_id": {
          "type": "integer",
          "example": 456
        },
        "username": {
          "type": "string",
          "example": "teacher1"
        },
        "isCurrentUser": {
          "type": "boolean",
          "example": true
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | permissions updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteTagForUser

`DELETE /simlets/{simletid}/sessions/{sessionid}/tags/{tagid}`

**deletes a tag for the current user in a session**

Deletes the specified tag from the current user for the selected session.

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `tagid` | integer | yes | The tag ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | updated list of tags for the user in this session | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addTagForUser

`POST /simlets/{simletid}/sessions/{sessionid}/tags/{tagid}`

**adds a tag for the current user in a session**

Adds the specified tag to the current user for the selected session.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/tags/{tagid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |
| path | `tagid` | integer | yes | The tag ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | list of tags for the user in this session | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## deleteTesterForSession

`DELETE /simlets/{simletid}/sessions/{sessionid}/tester`

**deletes the current user as tester in a session**

Delete the current user as tester in a session.

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/tester" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Tester deleted | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## resetTesterForSession

`PATCH /simlets/{simletid}/sessions/{sessionid}/tester`

**reset the current user as tester in a session**

Reset the current user as tester in a session.

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/tester" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | current group as tester in a session | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addTesterForSession

`POST /simlets/{simletid}/sessions/{sessionid}/tester`

**adds the current user as tester in a session**

Adds the current user as tester in a session.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/sessions/{sessionid}/tester" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| path | `sessionid` | integer | yes | The session ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | current group as tester in a session | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSessionSimletCount

`GET /simlets/{simletid}/sessions/count`

**gets the count of sessions for the current user**

Obtains the count of sessions for the current user.

- Allowed roles: administrator, teacher, student, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/sessions/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |
| query | `status` | string ("active" \\| "inactive" \\| "terminated") | no |  |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the count of sessions for this user | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## deleteSimletShlink

`DELETE /simlets/{simletid}/shlink`

**deletes the shlink URL for the simlet**

Deletes the shlink URL for the simlet

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/simlets/{simletid}/shlink" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `204` | shlink URL deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletShlink

`GET /simlets/{simletid}/shlink`

**gets the shlink URL for the simlet**

Obtains the shlink URL for the simlet

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/shlink" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | shlink URL obtained | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## updateSimletShlink

`PATCH /simlets/{simletid}/shlink`

**updates the shlink URL for the simlet**

Updates the shlink URL for the simlet

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/simlets/{simletid}/shlink" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "oneOf": [
    {
      "type": "object",
      "required": [
        "length"
      ],
      "properties": {
        "length": {
          "type": "integer",
          "example": 5
        }
      }
    },
    {
      "type": "object",
      "required": [
        "customSlug"
      ],
      "properties": {
        "customSlug": {
          "type": "string",
          "example": "customSlug123"
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | shlink URL updated | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## createSimletShlink

`POST /simlets/{simletid}/shlink`

**creates a shlink URL for the simlet**

Creates a shlink URL for the simlet

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/{simletid}/shlink" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "oneOf": [
    {
      "type": "object",
      "required": [
        "length"
      ],
      "properties": {
        "length": {
          "type": "integer",
          "example": 5
        }
      }
    },
    {
      "type": "object",
      "required": [
        "customSlug"
      ],
      "properties": {
        "customSlug": {
          "type": "string",
          "example": "customSlug123"
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | shlink URL created | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getSimletTagsForUser

`GET /simlets/{simletid}/tags`

**gets the list of tags available for the current simlet**

Obtains the list of tags available for the current simlet.

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/{simletid}/tags" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `simletid` | integer | yes | The SIMLET ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of tags | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletCount

`GET /simlets/count`

**gets the count of simlets for the current user**

Obtains the count of simlets for the current user.

- Allowed roles: administrator, teacher, student, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/simlets/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |
| query | `status` | string ("active" \\| "archived") | no |  |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the count of simlets for this user | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## addSimletFromImport

`POST /simlets/import`

**adds an simlet for the current teacher**

Creates a new simlet for the current teacher.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/simlets/import" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "object",
  "required": [
    "file"
  ],
  "properties": {
    "file": {
      "type": "string",
      "format": "binary"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | simlet created | object & object \\| object & object & object \\| object & object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getAllSchedulerSimlets

`GET /simlets/scheduler`

**gets the list of scheduler entries for the current user**

Obtains the list of scheduler entries for the current user.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/simlets/scheduler" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of scheduler entries for the current user | array<object & object \\| object & object & object \\| object & object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletCount

`GET /simlets/scheduler/count`

**gets the count of simlets scheduler entries for the current user**

Obtains the count of simlets scheduler entries for the current user.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/simlets/scheduler/count" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `searchTags` | string | no | pass an optional tag for result filtering |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the count of simlets scheduler entries for this user | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## getSimletTagsForUser

`GET /simlets/tags`

**gets the list of tags available for the current simlet**

Obtains the list of tags available for the current simlet.

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/simlets/tags" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of tags | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---
