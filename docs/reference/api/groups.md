# `/groups` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/groups` | [getGroups](#getgroups) |

## getGroups

`GET /groups`

**gets the list of groups where this student plays**

Obtains the list of groups owned by current user.

- Allowed roles: administrator, teacher, student

```bash
curl -X GET "${SIMVA_URL}/groups" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
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
| `200` | the list of groups for this user | array<object & object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `500` | Internal server error | object |

---
