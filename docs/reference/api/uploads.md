# `/uploads` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `POST` | `/uploads` | [uploadLtiTool](#uploadltitool) |

## uploadLtiTool

`POST /uploads`

**adds a lti tool**

Adds an lti tool that will be later available for the activities

- Allowed roles: teacher

```bash
curl -X POST "${SIMVA_URL}/uploads" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Request body

`Content-Type: multipart/form-data`, required.

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
