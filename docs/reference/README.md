# Reference

Material you look things up in. Reference is not a lesson and not a task guide: it describes
what exists, precisely, without narrative.

## Generated from the contract

| Page | Contents |
| --- | --- |
| [API endpoint reference](./api/index.md) | every operation, grouped by resource, with parameters and responses |
| [Role and endpoint matrix](./api/rbac-matrix.md) | which role may call which operation, and the per-request capability flags |
| [Contract versus implementation](./api/spec-vs-implementation.md) | documented endpoints with no route, routes with no contract entry, parameter naming differences |

All three are produced by `npm run update-docs` from `api.yaml` and the router tree. They
carry a "do not edit" banner and the commit they were generated from.

## Hand written

| Page | Contents |
| --- | --- |
| [Authentication](./authentication.md) | token types, where they come from, how to present them |
| [Errors](./errors.md) | error classes, HTTP status codes, response body shape |
| [Configuration](./configuration.md) | every environment variable, grouped by subsystem |
| [Activity types](./activity-types.md) | the pluggable activity vocabulary and its fields |
| [Data model](./data-model.md) | tables, views, and how they relate |

## Two conventions worth knowing before reading the endpoint pages

**Path parameters differ in spelling between code and contract.** The router uses
`:simlet_id`; the contract uses `{simletid}`. Both work: `roleAllowed()` treats `{...}`
segments as wildcards when matching. The drift report lists the cases where the *name* of the
same segment differs, which is a different (harmless) thing.

**The global `security` block claims OAuth2 on every operation**, including `/health`,
`/version`, `/auth2/*` and the LimeSurvey webhook, because there are no per-operation
`security` overrides in `api.yaml`. Those four paths are public because the auth middleware
short-circuits them, not because the contract says so. The authoritative public list is
`Authenticator.isPublicEndpoint()` in `src/middlewares/auth.middleware.ts`.