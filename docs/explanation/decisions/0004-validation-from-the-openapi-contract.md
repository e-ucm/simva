# ADR-0004 — Validate from the OpenAPI contract, not per-route validators

- **Status:** Accepted
- **Date:** 2026-02-27

## Context

Validation has been attempted four times in this codebase:

| Attempt | Period | Outcome |
| --- | --- | --- |
| `src/lib/validator.js` over `swagger-mongoose` | 2019-07 → 2026-01 | Patched repeatedly; deleted in the rewrite |
| `express-validator` per route | 2026-02-26 → 2026-02-27 | Reverted within 24 hours |
| `express-openapi-validator` globally | 2026-02-27 → present | In force |
| Two linters for the contract itself | 2026-03, 2026-05 | `openapi-cli`, then `@redocly/cli` |

The failure mode of the per-route approach was visible within a day:

```
19298fd  2026-02-26  feat: add express-validator integration for route validation
                    +123 across 6 route files, new src/lib/utils/validator.ts (89 lines)
d4eb044  2026-02-27  refactor: remove validation middleware from route files
                    -19 across the SAME 6 route files
4811e78  2026-02-27  refactor: remove unused validation utility from the project
                    -89, deletes the utility file
```

Adopted, undone, and the dependency deleted — in under a day. `express-validator` stayed in
`package.json` for another twelve days until `4fdcba3` removed it.

## Decision

One global middleware, validating against the same `api.yaml` the documentation and the role
matrix come from, for requests **and** responses.

```ts
// src/app.ts
app.use(OpenApiValidator.middleware({
  apiSpec: `${config.appFolder}/api.yaml`,
  validateRequests: true,
  validateResponses: true,
}));
```

Mounted **after** `auth` and `roleAllowed`, so an unauthorised caller is rejected before the
body is validated.

## Consequences

**Positive**

- **One declaration per rule.** The schema in `api.yaml` is the validator; there is no second
  expression of it to keep in sync.
- **Validation covers routes nobody remembered.** Adding a route without a schema fails
  loudly, immediately, rather than silently accepting anything.
- **Response validation is the real win.** It makes the contract binding on the way out, which
  is what forces a schema change whenever a response field is added. Without it the contract
  decays within a month.

**Negative — and this was expensive**

- **Enabling response validation required rewriting the contract**, not the code. Four
  commits over two weeks added and reshaped more than 1,400 lines of `api.yaml`. The schema
  was the thing that was wrong.
- **Per-caller fields cannot be described.** `current_user_id`, `current_user_username` and
  `current_user_permission` are injected into responses depending on the caller; they had to
  be removed from the response schemas (`55ebcea`). The convention survives, the guarantee does
  not.
- **A mismatched response is a 500 for every caller**, not a subtle degradation. This is a
  real hazard when adding a field: forget the schema and the endpoint stops working entirely.
- **The error shape is inconsistent.** Validator errors are `{ message, errors }`; application
  errors are `{ type, message, stack, name }`. Clients must handle both.

**Process residue**

- **Two linters in two months.** `openapi-cli` (March, `3f234c9`) was replaced by
  `@redocly/cli` (May, `f84b7af`) — the first could not lint the spec.
- **`updateOpenAPI` was dropped from `scripts`** in the same commit that introduced
  `validate-openapi`, even though `openapi.json` is still committed and still updated. It has
  been restored as `npm run update-openapi`.

## Evidence

- `1da2a60` — the original hand-written validator
- `28bb4b2` — "validator only checks schema $ref when it has a schema $ref"
- `19298fd`, `d4eb044`, `4811e78` — express-validator, adopted and reverted
- `b41cab7` — the OpenAPI validator middleware
- `4fdcba3` — removes `express-validator` and `swagger-cli` from `package.json`
- `a145b0c`, `6861cfd`, `0914524`, `55ebcea` — the contract rewrite
- `3f234c9`, `f84b7af` — the two linters

## Related

- [Errors](../../reference/errors.md)
- [ADR-0003](./0003-api-yaml-is-the-contract-and-the-authorization-matrix.md)
- [How-to: add an endpoint](../../how-to/add-an-endpoint.md)