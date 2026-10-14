# Errors

## Response body

Every error the application produces has the same shape:

```json
{
  "type": "NotFoundError",
  "message": "The simlet does not exist",
  "stack": "NotFoundError: The simlet does not exist\n    at ...",
  "name": "NotFoundError"
}
```

- `type` and `name` are the same value, the error class name.
- `originalError` is added when the error carries one (an LRS error, for example).
- **`stack` is populated in production.** There is commented-out code in
  `src/middlewares/error.middleware.ts` that would strip it, but as written it is included.

Errors raised by `express-openapi-validator` do **not** follow this shape. They come back as
`{ message, errors }` with a details array.

## Status codes

The mapping is in `src/middlewares/error.middleware.ts`, by `instanceof`:

| Error class | Status | Typical cause |
| --- | --- | --- |
| `LRSError` | 400 | the LRS rejected the statement |
| `BadRequestError` | 400 | malformed input the schema allowed |
| `AuthentificationError` | 401 | no token, bad token, or `roleAllowed()` refusal |
| `NotFoundError` | 404 | missing object, **or** a route the caller's role does not have |
| `ConflictError` | 409 | duplicate username, re-completing a finished activity, duplicate participant |
| `ValidationError` | **406** | a rule the schema cannot express: simlet archived, overlapping sessions |
| `NotImplementedError` | 501 | the service method is a stub |
| anything else | 500 | |

Two of these will bite you:

- **406 for validation.** Unusual and not what any HTTP client expects; a client that treats
  "not 2xx" as failure will report it as a generic error. The contract documents `406` on the
  relevant endpoints for exactly this reason.
- **404 for an authorization failure.** `roleAllowed()` throws `NotFoundError('The route you
  are trying to access does not exist.')` when the caller's role has no entry at all for that
  method, and `AuthentificationError` (401) when the role has entries but none match the
  path. So a 404 on an endpoint that definitely exists usually means "wrong role", not "wrong
  id".

## Shared response components

`api.yaml` defines these under `components.responses`, and generated documentation refers to
them by name:

| Component | Body |
| --- | --- |
| `HealthCheckSuccess` | `{ status, db }` |
| `VersionCheckSuccess` | `{ version, features }` |
| `BadRequestError` | 400 envelope |
| `AuthentificationError` | 401 envelope |
| `NotFoundError` | 404 envelope |
| `ConflictError` | 409 envelope |
| `ValidationError` | 406 envelope |
| `InternalServerError` | 500 envelope |
| `NotImplementedError` | 501 envelope |

## Validation errors in detail

With `validateRequests: true`, a body that does not match the schema is rejected before your
controller runs:

```json
{
  "message": "request/body must have required property 'simlet_name'",
  "errors": [
    {
      "path": "/body",
      "message": "must have required property 'simlet_name'",
      "errorCode": "required.openapi.validation"
    }
  ]
}
```

With `validateResponses: true` — and it is on — a response that does not match the declared
schema is also rejected, after your controller produced it. That is why adding a field to a
response object requires editing `api.yaml` in the same change: otherwise the endpoint starts
returning 500s for every caller.

## What to do about each

| Status | What it means for the caller |
| --- | --- |
| 400 | fix the request; `errors[].path` says where |
| 401 | token missing, expired, or the role is not allowed on that route |
| 404 | object does not exist, or the route is not in your role's list |
| 406 | a business rule failed; the message says which |
| 409 | state conflict; re-read the object before retrying |
| 501 | the deployment does not implement this; treat as a bug report |
| 500 | unexpected; `type` and `stack` are the only diagnostic you get |

## Related

- [Role matrix](./api/rbac-matrix.md) — which role can reach which status of which endpoint
- [Authentication](./authentication.md) — the 401s in detail
- [ADR-0003](../explanation/decisions/0003-api-yaml-is-the-contract-and-the-authorization-matrix.md)
  — why responses are validated at all