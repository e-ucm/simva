# `/admin` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/admin/lrs/statements` | [getAdminLrsStatements](#getadminlrsstatements) |
| `POST` | `/admin/lrs/statements` | [postAdminLrsStatements](#postadminlrsstatements) |
| `GET` | `/admin/lrs/statements/more` | [getAdminMoreLrsStatements](#getadminmorelrsstatements) |

## getAdminLrsStatements

`GET /admin/lrs/statements`

**gets the xAPI statements of all the activities**

Get xAPI statements from the whole Learning Record Store without activity scoping.
The statements are produced by the frontend interactions (games, surveys, trackers).

- Allowed roles: administrator, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/admin/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `agent` | string | no | Filter statements by agent or identified group |
| query | `attachments` | boolean | no | Include attachments in the response |
| query | `ascending` | boolean | no | Return statements in ascending stored-time order |
| query | `activity` | string | no | The activity IRI to filter xAPI statements |
| query | `format` | string ("ids" \\| "exact" \\| "canonical") | no | Statement representation format |
| query | `related_agents` | boolean | no | Include statements related to matching agents |
| query | `related_activities` | boolean | no | Include statements related to the specified activity |
| query | `limit` | integer | no | Maximum number of xAPI statements to return |
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
| `200` | the statements of all the activities required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## postAdminLrsStatements

`POST /admin/lrs/statements`

**posts the xAPI statements to the whole LRS**

Post xAPI statements to the whole Learning Record Store without activity scoping.
A single xAPI statement or an array of them can be sent.

- Allowed roles: administrator, lrsmanager

```bash
curl -X POST "${SIMVA_URL}/admin/lrs/statements" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: application/json`, required.

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": true
  }
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the ids of the statements created | array<string> |
| `201` | the ids of the statements created | array<string> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---

## getAdminMoreLrsStatements

`GET /admin/lrs/statements/more`

**gets more xAPI statements of all the activities**

Get more xAPI statements using the more URL provided in the statements response

- Allowed roles: administrator, lrsmanager, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/admin/lrs/statements/more" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| query | `more` | string | no | Return more statements using this URL provided in the "more" property of the response |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the statements of all the activities required | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |
| `501` | Not implemented method | object |

---
