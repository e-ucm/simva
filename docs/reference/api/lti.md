# `/lti` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/lti` | [getLtiStatus](#getltistatus) |
| `GET` | `/lti/claims` | [getLtiClaims](#getlticlaims) |
| `POST` | `/lti/claims` | [postLtiClaims](#postlticlaims) |
| `GET` | `/lti/context/{id}/lineitems` | [getLtiLineItems](#getltilineitems) |
| `GET` | `/lti/context/{id}/lineitems/{lineitem}` | [getLtiLineItem](#getltilineitem) |
| `PUT` | `/lti/context/{id}/lineitems/{lineitem}` | [putLtiLineItem](#putltilineitem) |
| `GET` | `/lti/context/{id}/lineitems/{lineitem}/results` | [getLtiLineItemResults](#getltilineitemresults) |
| `POST` | `/lti/context/{id}/lineitems/{lineitem}/score` | [setLtiLineItemScore](#setltilineitemscore) |
| `GET` | `/lti/context/{id}/memberships` | [getLtiMemberships](#getltimemberships) |
| `GET` | `/lti/platforms` | [getLtiPlatforms](#getltiplatforms) |
| `POST` | `/lti/platforms` | [addLtiPlatform](#addltiplatform) |
| `DELETE` | `/lti/platforms/{id}` | [deleteLtiPlatform](#deleteltiplatform) |
| `GET` | `/lti/platforms/{id}` | [getLtiPlatform](#getltiplatform) |
| `PUT` | `/lti/platforms/{id}` | [updateLtiPlatform](#updateltiplatform) |
| `GET` | `/lti/tools` | [getLtiTools](#getltitools) |
| `POST` | `/lti/tools` | [addLtiTool](#addltitool) |
| `DELETE` | `/lti/tools/{id}` | [deleteLtiTool](#deleteltitool) |
| `GET` | `/lti/tools/{id}` | [getLtiTool](#getltitool) |
| `PUT` | `/lti/tools/{id}` | [updateLtiTool](#updateltitool) |

## getLtiStatus

`GET /lti`

**gets the status of the LTI compatibility**

Returns an object that specifies if simva is acting as
an LTI platform and/or LTI tool

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the object with the LTI status | array<object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiClaims

`GET /lti/claims`

**gets the LTI claims for the given hints**

An lti tool launch will provide two parameters including
lti_message_hint and lti_login_hint and, in base of that,
this endpoint will return an object including all the claims
needed for the tool to work.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti/claims" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `lti_login_hint` | string | no | simva signed JWT token with LTI-login data |
| query | `lti_message_hint` | string | no | simva signed JWT token with LTI-related data |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of groups for this user | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## postLtiClaims

`POST /lti/claims`

**gets the LTI claims for the given hints**

An lti tool launch will provide two parameters including
lti_message_hint and lti_login_hint and, in base of that,
this endpoint will return an object including all the claims
needed for the tool to work.

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/lti/claims" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `lti_login_hint` | string | no | simva signed JWT token with LTI-login data |
| query | `lti_message_hint` | string | no | simva signed JWT token with LTI-related data |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of groups for this user | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiLineItems

`GET /lti/context/{id}/lineitems`

**gets the LineItems of the Lti Activity**

Returns the list of LineItems

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti/context/{id}/lineitems" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the object including all the LineItems | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiLineItem

`GET /lti/context/{id}/lineitems/{lineitem}`

**gets the LineItems of the Lti Activity**

Returns the list of LineItems

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti/context/{id}/lineitems/{lineitem}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |
| path | `lineitem` | string | yes | The id of the line item |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the object including all the LineItems | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## putLtiLineItem

`PUT /lti/context/{id}/lineitems/{lineitem}`

**gets the LineItems of the Lti Activity**

Sets the value of a lineitem

- Allowed roles: administrator, teacher, student

```bash
curl -X PUT "${SIMVA_URL}/lti/context/{id}/lineitems/{lineitem}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |
| path | `lineitem` | string | yes | The id of the line item |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the object including all the LineItems | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiLineItemResults

`GET /lti/context/{id}/lineitems/{lineitem}/results`

**gets the result for the LineItems of the Lti Activity**

Sets the value of a lineitem score

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti/context/{id}/lineitems/{lineitem}/results" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |
| path | `lineitem` | string | yes | The id of the line item |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | The result of the lineitem | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## setLtiLineItemScore

`POST /lti/context/{id}/lineitems/{lineitem}/score`

**gets the LineItems of the Lti Activity**

Sets the value of a lineitem score

- Allowed roles: administrator, teacher, student

```bash
curl -X POST "${SIMVA_URL}/lti/context/{id}/lineitems/{lineitem}/score" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |
| path | `lineitem` | string | yes | The id of the line item |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | success | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiMemberships

`GET /lti/context/{id}/memberships`

**gets the list of members based on the LTI NRPS**

Returns the list of members of an activity based on the specification
of the LTI service Names and Roles Provisioning Service

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/lti/context/{id}/memberships" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The context id |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the object including context and users | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiPlatforms

`GET /lti/platforms`

**gets the list of LTI platforms**

Obtains the list of lti platforms registered

- Allowed roles: teacher

```bash
curl -X GET "${SIMVA_URL}/lti/platforms" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of LTI platforms registered | array<object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## addLtiPlatform

`POST /lti/platforms`

**adds a lti platform**

Register an lti platform that is allowed to launch simva as tool

- Allowed roles: teacher

```bash
curl -X POST "${SIMVA_URL}/lti/platforms" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "url": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva"
    },
    "name": {
      "type": "string",
      "example": "simva"
    },
    "clientId": {
      "type": "string",
      "example": "lti-tool-81751"
    },
    "authenticationEndpoint": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva/protocol/openid-connect/auth"
    },
    "accesstokenEndpoint": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva/protocol/openid-connect/token"
    },
    "authConfig": {
      "type": "object"
    },
    "internal_id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "extra_data": {
      "type": "object"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | lti platform registered | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## deleteLtiPlatform

`DELETE /lti/platforms/{id}`

**Deletes the lti platform with the given ID**

Deletes the designed lti platform

- Allowed roles: teacher

```bash
curl -X DELETE "${SIMVA_URL}/lti/platforms/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti platform ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | LTI platform deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiPlatform

`GET /lti/platforms/{id}`

**gets the LTI platforms with the given ID**

Obtains the requested LTI platforms

- Allowed roles: teacher

```bash
curl -X GET "${SIMVA_URL}/lti/platforms/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti platform ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | lti platforms object | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## updateLtiPlatform

`PUT /lti/platforms/{id}`

**updates the LTI platforms**

Updates an existing LTI platforms

- Allowed roles: teacher

```bash
curl -X PUT "${SIMVA_URL}/lti/platforms/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti platform ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "url": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva"
    },
    "name": {
      "type": "string",
      "example": "simva"
    },
    "clientId": {
      "type": "string",
      "example": "lti-tool-81751"
    },
    "authenticationEndpoint": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva/protocol/openid-connect/auth"
    },
    "accesstokenEndpoint": {
      "type": "string",
      "example": "https://sso.simva.e-ucm.es/auth/realms/simva/protocol/openid-connect/token"
    },
    "authConfig": {
      "type": "object"
    },
    "internal_id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "extra_data": {
      "type": "object"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item created | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiTools

`GET /lti/tools`

**gets the list of LTI tools**

Obtains the list of lti tools available

- Allowed roles: teacher

```bash
curl -X GET "${SIMVA_URL}/lti/tools" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `searchString` | string | no | pass an optional search string for result filtering |
| query | `skip` | integer | no | number of records to skip for pagination |
| query | `limit` | integer | no | maximum number of records to return |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the list of LTI tools available | array<object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## addLtiTool

`POST /lti/tools`

**adds a lti tool**

Adds an lti tool that will be later available for the activities

- Allowed roles: teacher

```bash
curl -X POST "${SIMVA_URL}/lti/tools" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "name": {
      "type": "string",
      "example": "Session tool"
    },
    "description": {
      "type": "string",
      "example": "This is a test tool used for testing"
    },
    "client_id": {
      "type": "string",
      "example": "lti-tool-client-12345"
    },
    "url": {
      "type": "string",
      "example": "https://lti-tool.test/"
    },
    "jwks_uri": {
      "type": "string",
      "example": "https://lti-tool.test/.well-known/jwks.json"
    },
    "login_uri": {
      "type": "string",
      "example": "https://lti-tool.test/oidc/init"
    },
    "redirect_uri": {
      "type": "string",
      "example": "https://lti-tool.test/launch"
    },
    "extra_data": {
      "type": "object"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | lti tool created | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## deleteLtiTool

`DELETE /lti/tools/{id}`

**Deletes the lti tool with the given ID**

Deletes the designed lti tool

- Allowed roles: teacher

```bash
curl -X DELETE "${SIMVA_URL}/lti/tools/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti_tool ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | LTI tool deleted | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getLtiTool

`GET /lti/tools/{id}`

**gets the LTI tool with the given ID**

Obtains the requested LTI tool

- Allowed roles: teacher

```bash
curl -X GET "${SIMVA_URL}/lti/tools/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti_tool ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | lti tool object | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## updateLtiTool

`PUT /lti/tools/{id}`

**updates the LTI tool**

Updates an existing LTI tool

- Allowed roles: teacher

```bash
curl -X PUT "${SIMVA_URL}/lti/tools/{id}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `id` | string | yes | The lti_tool ID |

### Request body

`Content-Type: application/json`, optional.

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "ObjectId(\"5d07a0767c1405004bc702b2\")"
    },
    "name": {
      "type": "string",
      "example": "Session tool"
    },
    "description": {
      "type": "string",
      "example": "This is a test tool used for testing"
    },
    "client_id": {
      "type": "string",
      "example": "lti-tool-client-12345"
    },
    "url": {
      "type": "string",
      "example": "https://lti-tool.test/"
    },
    "jwks_uri": {
      "type": "string",
      "example": "https://lti-tool.test/.well-known/jwks.json"
    },
    "login_uri": {
      "type": "string",
      "example": "https://lti-tool.test/oidc/init"
    },
    "redirect_uri": {
      "type": "string",
      "example": "https://lti-tool.test/launch"
    },
    "extra_data": {
      "type": "object"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | item created | unknown |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---
