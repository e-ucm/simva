# `/users` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/users` | [getUsers](#getusers) |
| `PATCH` | `/users` | [patchUser](#patchuser) |
| `PATCH` | `/users/{username}` | [patchUserByUsername](#patchuserbyusername) |
| `POST` | `/users/events` | [getUserEvents](#getuserevents) |
| `POST` | `/users/link` | [linkAccount](#linkaccount) |
| `GET` | `/users/me` | [getMe](#getme) |

## getUsers

`GET /users`

**gets the list of users.**

Obtains the list of users owned by current user.

- Allowed roles: administrator, teacher

```bash
curl -X GET "${SIMVA_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `username` | string | yes | The username of a specific user |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |
| query | `orderBy` | string ("id" \\| "name" \\| "createdAt" \\| "updatedAt") | no | Field by which the results should be ordered |
| query | `order` | string ("asc" \\| "desc") | no | Order of the results (ascending or descending) |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of users | array<object & object> \\| object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `500` | Internal server error | object |

---

## patchUser

`PATCH /users`

**Modifies the logged user, for exemple it's role.**

Modifies the logged user, for exemple it new role to be added to the user

- Allowed roles: administrator, norole

```bash
curl -X PATCH "${SIMVA_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `username` | string | yes | The username of a specific user |

### Request body

`Content-Type: application/json`, optional.

```json
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
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | User updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## patchUserByUsername

`PATCH /users/{username}`

**updates a user**

Updates the specified user's information

- Allowed roles: administrator, teacher, norole

```bash
curl -X PATCH "${SIMVA_URL}/users/{username}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `username` | string | yes | The username of a specific user |

### Request body

`Content-Type: application/json`, optional.

```json
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
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | user updated | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## getUserEvents

`POST /users/events`

**Receives the events of the SSO to sync the users**

Receives the SSO events and updates the users, both creating
the users and updating their roles and permissions

- Allowed roles: all roles (untagged operation)

```bash
curl -X POST "${SIMVA_URL}/users/events" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, optional.

```json
{
  "required": [
    "name"
  ],
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "example": "eventname",
      "description": "The event name.\n"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | events processed successfully | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## linkAccount

`POST /users/link`

**Links the secondary account to the main one**

Receives two valid JWT tokens and adds to the main
account, as an external_entity, the secondary account

- Allowed roles: all roles (untagged operation)

```bash
curl -X POST "${SIMVA_URL}/users/link" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, optional.

```json
{
  "required": [
    "main",
    "secondary"
  ],
  "type": "object",
  "properties": {
    "main": {
      "type": "string",
      "example": "JWT of the main account"
    },
    "secondary": {
      "type": "string",
      "example": "JWT of the secondary account"
    },
    "domain": {
      "type": "string",
      "example": "moodle_12321"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | accounts linked successfully | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getMe

`GET /users/me`

**Obtains your own user.**

Based on the current auth header obtains the user

- Allowed roles: administrator, lrsmanager, teacher, student, norole

```bash
curl -X GET "${SIMVA_URL}/users/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | The user | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---
