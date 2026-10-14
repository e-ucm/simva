# `/limesurvey-completion-webhooks` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `POST` | `/limesurvey-completion-webhooks` | [getLimesurveyEvent](#getlimesurveyevent) |

## getLimesurveyEvent

`POST /limesurvey-completion-webhooks`

**get completion from limesurvey**

get completion from limesurvey

- Allowed roles: all roles (untagged operation)

```bash
curl -X POST "${SIMVA_URL}/limesurvey-completion-webhooks" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | completion from limesurvey | object |
| `400` | Bad request error | object |
| `401` | Authentification error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---
