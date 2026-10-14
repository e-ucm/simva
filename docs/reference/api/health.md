# `/health` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `GET` | `/health` | [healthCheck](#healthcheck) |
| `HEAD` | `/health` | [healthCheckHead](#healthcheckhead) |

## healthCheck

`GET /health`

**health check endpoint**

Simple health check endpoint to verify that the API is running

- Allowed roles: all roles (untagged operation)

```bash
curl -X GET "${SIMVA_URL}/health" \
  --data @body.json    # see the request body below, omit for this verb
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Health check successful | object |
| `400` | Bad request error | object |
| `500` | Internal server error | object |

---

## healthCheckHead

`HEAD /health`

**Health check (HEAD)**

- Allowed roles: all roles (untagged operation)

```bash
curl -X HEAD "${SIMVA_URL}/health" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Health check successful | object |
| `400` | Bad request error | object |
| `500` | Internal server error | object |

---
