# ADR-0015 — Service-account roles, and `is_admin` as visibility rather than authorization

- **Status:** Accepted, with a caveat
- **Date:** 2026-09-29 (`garbagecollector`); 2025-05-30 (`lrsmanager`)

## Context

Not every caller of this API is a person. Two jobs appeared:

1. **A trace allocator** that moves statements between the LRS and storage across every study,
   with no need to be a participant and no need to write anything.
2. **A garbage collector** that sweeps stored traces on a retention schedule.

Both need to read everything. Neither should be able to change a study. Neither is a
researcher, so a human role would be wrong.

The 2026 timeline also produced the term `is_admin`, whose meaning drifted as it was
threaded through the codebase:

```
d121f5d  2026-05-01  is_admin branches session listing in Simlet.ts
4fdcba3  2026-03-11  is_admin threaded through 39 files
2f5d86e  2026-09-21  AND (deletedAt is NULL OR :is_admin is true) across six query files
```

## Decision

Two service-account roles, each a real role with a real entry in the tag matrix, and `is_admin`
redefined as a **data visibility** flag rather than an authorization decision.

```ts
// src/controlers/users/user.helper.ts
case "garbagecollector":
  // Read only service account (trace allocator / garbage collector).
  // is_admin is used to bypass "only own data" filters on read endpoints; it is not an
  // authorization flag, since every mutating route rejects this role in the OpenAPI RBAC matrix.
  return { allocated: false, is_admin: true, currentUserId: ..., canImpersonate: false };

case "lrsmanager":
  return { allocated: true, is_admin: false, currentUserId: ..., canImpersonate: true };
```

`lrsmanager` is participant-shaped but may impersonate, which is what it needs to read one
participant's statements. `garbagecollector` gets `is_admin` so that read filters do not
restrict it to its own rows.

## Consequences

**Positive**

- **Background jobs are first class.** Their role is in the same matrix as a human's; there is
  no bypass, no shared admin account, no credential to rotate separately from a person.
- **Least privilege is expressible.** `garbagecollector` appears on 29 operations, all reads.
- **`is_admin` finally means one thing** — "do not restrict this query to the caller's rows" —
  which is what the SQL clause implements and what every mapper branch expects.
- **The distinction is documented in the code**, which is unusual and valuable.

**The caveat: the safety property is not in code**

Read the comment again: *"it is not an authorization flag, since every mutating route rejects
this role in the OpenAPI RBAC matrix."*

That sentence is a **caveat on the design**, not a reassurance. The entire safety of the
`garbagecollector` account rests on `garbagecollectors` appearing in the `tags` of 29 read
operations and zero write operations in `api.yaml`.

Concretely:

- Adding the tag to one write operation gives the collector write access. There is no code
  check to catch it.
- Nothing in the test suite asserts the property. Route tests mock the auth middleware out of
  existence (see
  [how-to: write a test](../../how-to/write-a-test.md)), so the matrix is not exercised by
  tests at all.
- The generated [role matrix](../../reference/api/rbac-matrix.md) makes the property *visible*
  in review, which is the actual mitigation.

**Why `is_admin` was overloaded in the first place**

It started as "is this user an administrator" in one method (`Simlet.getSessions()`, May 2026)
and became "bypass own-data filters" in March, when `4fdcba3` threaded it through 39 files for
permission handling. By September the same flag was being used for soft-delete visibility. Two
different questions — "may this user see other people's data" and "may this user see deleted
rows" — happened to have the same answer for every existing role, so one flag served both until
a non-administrator needed the second answer.

**The cost of adding a role is disproportionate**

```
d5f9b14  2026-09-29  add garbage collector role
                    src/controlers/users/user.helper.ts  +5
                    api.yaml                            47
                    openapi.json                        +10263 / -2249
```

Five lines of code, ten thousand lines of generated diff. That is the price of the single-file
design in [ADR-0003](./0003-api-yaml-is-the-contract-and-the-authorization-matrix.md), and it
is a good trade: the review surface scales with the change, not with the repository.

## If you are adding a role

1. Add it to `getRoleFromKeycloakJWT()` in the right priority position.
2. Add a case to `getAccess()` — and decide deliberately between `allocated`, `is_admin` and
   `canImpersonate`.
3. Add the pluralised tag to **every** operation it may call, and verify it appears on no
   mutating operation.
4. Regenerate the docs: `npm run update-docs`.
5. Read the generated role matrix and confirm the rows are what you intended. That review step
   *is* the control.

## Evidence

- `38cfa68` (2025-05-30) — the `lrsmanagers` tag
- `d633efd` (2026-05-12) — a `getAccess` correction for `lrsmanager`
- `d121f5d` (2026-05-01) — the origin of `is_admin`
- `4fdcba3` (2026-03-11) — `is_admin` across 39 files
- `2f5d86e` (2026-09-21) — `is_admin` as a SQL parameter
- `d5f9b14` (2026-09-29) — the `garbagecollector` role and the 10,263-line diff

## Related

- [Permissions](../permissions.md)
- [The API contract is also the authorization matrix](../api-contract-and-authorization.md)
- [Role and endpoint matrix](../../reference/api/rbac-matrix.md)
- [ADR-0003](./0003-api-yaml-is-the-contract-and-the-authorization-matrix.md)