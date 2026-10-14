# The API contract is also the authorization matrix

This is the single most surprising thing about the codebase, and it is the reason several
otherwise reasonable changes fail.

## `api.yaml` does three jobs

`api.yaml` is 6,800 lines and is, simultaneously:

1. **The API contract.** Validated against at runtime by `express-openapi-validator`, for
   requests *and* responses.
2. **The authorization matrix.** `Authenticator.initPaths()` reads it at startup and turns the
   `tags` of every operation into "which role may call this route".
3. **The documentation.** SwaggerHub publishes it; `npm run update-docs` renders it.

One file, three consumers, no duplication. That is the appeal.

## How a tag becomes a role

```ts
// src/middlewares/auth.middleware.ts
const roleTag = methodConfig.tags[i].toLowerCase().slice(0, -1);
if (!roleTag.endsWith('_database') && !roleTag.endsWith('health')) {
  this.allowedRoutes[roleTag] ??= {};
  this.allowedRoutes[roleTag][method] ??= [];
  this.allowedRoutes[roleTag][method].push(path);
}
```

Drop the trailing `s`, lowercase, and you have the role key: `teachers` → `teacher`,
`administrators` → `administrator`, `lrsmanagers` → `lrsmanager`.

Operations with **no** tags go into a `'*'` bucket that is concatenated onto every role's
allowed list. Nine operations are untagged — `/health`, `/version`, the two `/auth2/*` device
endpoints, `/events`, the LimeSurvey webhook, and two commented-out `/users` routes — which
means they are reachable by users with no role at all.

At request time, `roleAllowed()` compares the request path against the role's list
segment by segment, treating `{...}` segments as wildcards.

## Why this was done this way

The alternative is a separate authorization configuration — a roles file, a decorator per
route, or middleware factories. The chosen design has one property none of them have: **the
set of endpoints a role can reach is exactly the set of endpoints documented for that role.**
There is no fourth place to update.

For a project where the API surface is large (155 operations), where documentation has
historically been neglected, and where the person writing the documentation is often the same
person wiring the route, that is a genuinely strong argument.

## What it costs

**Editing a tag is an authorization change.** A change that looks like documentation in a
pull request can grant `student` write access to a study. There is no second file to review,
so review has to know this.

**Role names must be singular and must not end in `s`.** `slice(0, -1)` is not a pluraliser.
The two escape hatches in the code — `_database` and `health` suffixes — exist because some
tags did not fit and were excluded rather than renamed.

**The role used for the check is the database role, not the token role.** `req.user.sql.role`
is the value compared against the tag-derived key. `getRoleFromKeycloakJWT()` maps realm roles
to it in priority order, so the token can claim `teacher` while the stored role says
`student`, and the stored role wins.

**Tag changes are expensive in diff terms.** Adding the `garbagecollector` role (`d5f9b14`,
2026-09-29) changed five lines of code and produced a 10,263-line `openapi.json` diff.

**Publishing drift.** SwaggerHub is pinned at spec 1.0.0 from 2019; `api.yaml` says 2.0.0.
The published contract has been wrong for roughly seven years, which is what you would expect
when a file serves three masters and only the runtime one is enforced.

## The response-validation consequence

Turning on `validateResponses: true` (`b41cab7`, 2026-02-27) forced a multi-week rewrite of
the spec itself, because the declared schemas no longer described what the code produced:

- `a145b0c` removed invalid `required` fields and standardised response references.
- `6861cfd` standardised operation ids and parameter names — 150 lines changed, 226 removed.
- `0914524` added a thousand lines of error schemas.
- `55ebcea` added the 406 validation response and removed `current_user_id`,
  `current_user_username` and `current_user_permission` from response schemas, because those
  are injected at runtime per caller and cannot be a static contract.

That last one is instructive: the contract cannot describe per-caller fields. The response
schema describes the *shape*; the injected context is a convention, not a guarantee.

## Known contract defects

`npm run validate-openapi` reports nine errors against the current `api.yaml`. They predate
this documentation and are listed here so that a change of your own is not blamed for them.

| Rule | Count | What |
| --- | --- | --- |
| `operation-operationId-unique` | 5 | `getSimletCount`, `getSimletTagsForUser` and `getGroupCount` are each used twice |
| `path-parameters-defined` | 4 | `/auth2/{activity_id}/…` declares `activityid`, so the parameter is not defined |
| `no-unused-components` | 3 | `tags_read_only`, `postInitializationMapper`, `lti_context` |

The duplicate `operationId`s are why the generated reference pages disambiguate duplicate
anchors by index.

Fixing the `path-parameters-defined` errors is the one with a security flavour: `/auth2/*` is a
public prefix, and the parameter name mismatch is a reminder that the auth path is matched by
prefix rather than by the contract's own parameter names.

## The documented-but-absent surface

The contract describes 155 operations; the router registers 123 routes. The gap is not
accidental drift alone — some of it is deliberate preservation of a planned surface:

- **The whole `/lti/*` family** — 15 operations with schemas for `lti_tool`, `lti_platform`,
  `lti_context`, line items, memberships, scores. `config.lti` exists. There is no LTI
  controller, service or route.
- **`POST /events`, `/tasklist`, `/uploads`** — documented, never routed.
- **`/simlets/import`, `/users/link`, `/users/events`** — routes exist in the files but are
  commented out.

Meanwhile `/activities/{activityid}/lrs/activities/status` is documented while the router
serves `/state`, so those four LRS calls are unreachable by the documented path.

Keeping a planned surface in the contract is defensible — it preserves the design — but it
inverts the usual failure: here a *client generated from the contract* will be built against
endpoints that answer 404, and the server will not warn until a request fails.

[`spec-vs-implementation.md`](../reference/api/spec-vs-implementation.md) regenerates this
comparison on every `npm run update-docs`, so the drift cannot grow unnoticed.

## Related

- [ADR-0003 — api.yaml is the contract and the authorization matrix](./decisions/0003-api-yaml-is-the-contract-and-the-authorization-matrix.md)
- [ADR-0004 — express-openapi-validator, after rejecting express-validator](./decisions/0004-validation-from-the-openapi-contract.md)
- [Role and endpoint matrix](../reference/api/rbac-matrix.md)
- [Errors](../reference/errors.md)