# `/tasklist` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `POST` | `/tasklist` | [addToTaskList](#addtotasklist) |

## addToTaskList

`POST /tasklist`

**add to the task list**

Add an action to the task list

- Allowed roles: administrator, teacher

```bash
curl -X POST "${SIMVA_URL}/tasklist" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | added to task list | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---
