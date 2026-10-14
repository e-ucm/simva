# `/tags` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/tags` | [getSimletTagsForUser](#getsimlettagsforuser) |
| `POST` | `/tags` | [createTagElement](#createtagelement) |
| `DELETE` | `/tags/{tagid}` | [deleteTagElement](#deletetagelement) |
| `PATCH` | `/tags/{tagid}` | [updateTagElement](#updatetagelement) |

## getSimletTagsForUser

`GET /tags`

**gets the list of tags available for the current user**

Obtains the list of tags available for the current user.

- Allowed roles: administrator, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/tags" \
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

## createTagElement

`POST /tags`

**creates a tag for the current user**

Creates a new tag for the current user.

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/tags" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "allOf": [
    {
      "type": "object",
      "properties": {
        "tag_name": {
          "type": "string",
          "example": "tag1"
        },
        "tag_color": {
          "type": "string",
          "example": "#FF5733"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "tag_name",
        "tag_color"
      ]
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the created tag | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---

## deleteTagElement

`DELETE /tags/{tagid}`

**deletes a tag for the current user**

Deletes a tag for the current user.

- Allowed roles: administrator, teacher

```bash
curl -X DELETE "${SIMVA_URL}/tags/{tagid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `tagid` | integer | yes | The tag ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | tag deleted | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## updateTagElement

`PATCH /tags/{tagid}`

**updates a tag for the current user**

Updates a tag for the current user.

- Allowed roles: administrator, teacher

```bash
curl -X PATCH "${SIMVA_URL}/tags/{tagid}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `tagid` | integer | yes | The tag ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "object",
  "properties": {
    "tag_name": {
      "type": "string",
      "example": "tag1"
    },
    "tag_color": {
      "type": "string",
      "example": "#FF5733"
    }
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the updated tag | object & object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---
