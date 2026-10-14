# `/auth2` endpoint reference

> **Generated file. Do not edit by hand.**
>
> Regenerate with `npm run update-docs` (reads `api.yaml`, commit `85ca196`).
> Source of truth: `api.yaml` (v2.0.0), which is also the
> runtime authorization matrix — see `docs/reference/api/rbac-matrix.md`.

## Contents

| Method | Path | operationId |
| --- | --- | --- |
| `POST` | `/auth2/{activity_id}/device` | [initiateDeviceFlow](#initiatedeviceflow) |
| `POST` | `/auth2/{activity_id}/token` | [pollDeviceToken](#polldevicetoken) |

## initiateDeviceFlow

`POST /auth2/{activity_id}/device`

**Initiate the OAuth2 Device Authorization Grant flow**

Initiates the OAuth2 Device Authorization Grant (RFC 8628) flow against
Keycloak on behalf of a gameplay activity. Returns the device_code,
user_code and verification URIs that the game should show to the user.
The Keycloak client used is selected based on the activity's tracker
technology. This endpoint is public (no authentication required).

- Allowed roles: all roles (untagged operation)

```bash
curl -X POST "${SIMVA_URL}/auth2/{activity_id}/device" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Device authorization details | object |
| `400` | Bad request error | object |
| `404` | Requested resource not found | object |
| `500` | Internal server error | object |

---

## pollDeviceToken

`POST /auth2/{activity_id}/token`

**Poll for an access token in the device flow**

Polls the token endpoint to exchange the device_code for an access token.
If the user has not yet authorized, the error response contains
error=authorization_pending and the caller should keep polling after the
interval returned by the device endpoint. This endpoint is public (no
authentication required).

- Allowed roles: all roles (untagged operation)

```bash
curl -X POST "${SIMVA_URL}/auth2/{activity_id}/token" \
  -H "Content-Type: application/json" \
  --data @body.json    # see the request body below, omit for bodies you do not send
```

### Parameters

| In | Name | Type | Required | Description |
| --- | --- | --- | --- | --- |
| path | `activityid` | integer | yes | The activity ID |

### Request body

`Content-Type: application/json`, required.

```json
{
  "oneOf": [
    {
      "type": "object",
      "required": [
        "device_code"
      ],
      "properties": {
        "device_code": {
          "type": "string",
          "description": "The device_code returned by the device endpoint"
        }
      }
    },
    {
      "type": "object",
      "required": [
        "client_id",
        "grant_type",
        "refresh_token"
      ],
      "properties": {
        "client_id": {
          "type": "string",
          "description": "The client id defined"
        },
        "client_secret": {
          "type": "string",
          "description": "The client secret defined"
        },
        "grant_type": {
          "type": "string"
        },
        "refresh_token": {
          "type": "string"
        }
      }
    }
  ]
}
```

### Responses

| Status | Description | Body type |
| --- | --- | --- |
| `200` | Token response | object |
| `202` | Authorization pending - the user has not authorized yet | object |
| `400` | Invalid request or expired token | object |
| `500` | Internal server error | object |

---
