# `/allocatortypes` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/allocatortypes` | [getAllAllocatorTypes](#getallallocatortypes) |

## getAllAllocatorTypes

`GET /allocatortypes`

**gets the types of allocators available**

Obtains the list of allocator types available to
be assigned to the studies

- Allowed roles: administrator, lrsmanager, teacher, garbagecollector

```bash
curl -X GET "${SIMVA_URL}/allocatortypes" \
  -H "Authorization: Bearer ${TOKEN}" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | the available allocator types | array<object> |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `406` | Validation error | object |
| `409` | Conflict error | object |
| `500` | Internal server error | object |

---
