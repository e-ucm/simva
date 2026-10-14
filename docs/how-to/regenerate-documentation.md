# Regenerate the documentation

## Everything at once

```bash
npm run check-docs
```

Refreshes `openapi.json`, regenerates the API reference, and regenerates the query
documentation.

`npm run validate-openapi` is deliberately **not** part of that chain: the contract currently
fails Redocly lint with 9 errors that predate this documentation. Run it when you are fixing
the contract, and read [known contract defects](../../explanation/api-contract-and-authorization.md#known-contract-defects)
before assuming your change caused them.

## Individually

| Command | Writes | Source |
| --- | --- | --- |
| `npm run update-docs` | `docs/reference/api/**` | `api.yaml` + `src/routes` |
| `npm run update-openapi` | `openapi.json` | `api.yaml` |
| `npm run updateQueryDocs` | `QUERY_DOCS.md` | `src/lib/views/**.queries.ts` |
| `npm run validate-openapi` | nothing (lints) | `api.yaml` |
| `npm run class-docs` | `docs/typedoc/` (git ignored) | `src/lib` |

## What `update-docs` produces

Everything under `docs/reference/api/`:

- **`index.md`** — hub, with one row per documented operation.
- **`<resource>.md`** — one page per top-level path segment, with full operation detail:
  description, parameters, request body, responses, and a copy-pasteable `curl`.
- **`rbac-matrix.md`** — which role may call which operation, plus the `getAccess()` flags.
- **`spec-vs-implementation.md`** — a drift report produced by statically walking
  `app.use()` / `router.use()` mounts in `src/app.ts` and `src/routes`, then comparing with
  `api.yaml`. It distinguishes *documented but not implemented*, *implemented but not
  documented*, and *path parameter naming differences*.

Each generated page carries a banner with the git commit it was produced from, so a stale page
is obvious in review.

## When to regenerate

Run `npm run update-docs` whenever you touch:

- any path, method, `operationId`, tag, parameter or schema in `api.yaml`;
- any route registration in `src/routes` or `src/app.ts`;
- any role added to `api.yaml`.

A pull request that changes the contract but not `docs/reference/api/` is incomplete.

## What is **not** generated

These are hand written and must be edited by hand:

- `docs/tutorials/**`
- `docs/how-to/**`
- `docs/reference/*.md` (everything except `api/`)
- `docs/explanation/**`

If a generated page is wrong, the fix belongs in `api.yaml` or in the route files, not in
`docs/reference/api/`.

## Adding a hand-written reference page

Put it in `docs/reference/` and link it from the list at the top of
`updateDocs.ts` (`renderIndex`), so it appears in the generated hub and is reachable from the
documentation index.