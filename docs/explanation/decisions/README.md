# Architecture decision records

Fifteen decisions that explain why SIMVA looks the way it does. Each one is written from the
repository's own history: the commits are real, the dates are real, and where a decision was
later partly reversed, the ADR says so and links the reversal.

## Reading them

Each record has:

- **Status** — Accepted, Superseded, Partially reversed, Rejected, or Open.
- **Date** — when the decision was made.
- **Context** — the situation that made a decision necessary.
- **Decision** — what was chosen, and where to read it in the code today.
- **Consequences** — what it cost. Positive, neutral and negative.
- **Evidence** — the commits, so you can check.

## Index

| # | Decision | Status | Date |
| --- | --- | --- | --- |
| [0001](./0001-typescript-express5-rewrite.md) | Rewrite on TypeScript and Express 5 | Accepted | 2026-01-22 |
| [0002](./0002-sqlite-and-sequelize-as-the-datastore.md) | SQLite and Sequelize as the datastore | Accepted | 2026-01-22 |
| [0003](./0003-api-yaml-is-the-contract-and-the-authorization-matrix.md) | `api.yaml` is both the contract and the authorization matrix | Accepted | 2026-02-27 |
| [0004](./0004-validation-from-the-openapi-contract.md) | Validate from the OpenAPI contract, not per-route validators | Accepted | 2026-02-27 |
| [0005](./0005-layered-architecture-with-sql-views.md) | Routes → controllers → services → mappers → models, with reads in SQL views | Accepted | 2026-02-13 |
| [0006](./0006-keycloak-as-the-identity-provider.md) | Keycloak owns identity; SIMVA mirrors it | Accepted, with a caveat | 2026-01-22 |
| [0007](./0007-oauth2-device-authorization-flow.md) | SIMVA proxies the OAuth2 device flow | Accepted, mode selection still open | 2026-08-19 |
| [0008](./0008-object-storage-for-traces-and-results.md) | Object storage and the LRS for the large data | Accepted | 2020-03-04 → 2026-02-25 |
| [0009](./0009-rustfs-as-an-alternative-to-minio.md) | RustFS behind a runtime feature flag | Accepted | 2026-09-28 |
| [0010](./0010-soft-delete-and-the-admin-bypass.md) | Soft delete everywhere, with a view-level admin bypass | Partially reversed | 2026-08-06 |
| [0011](./0011-object-level-permissions-and-inheritance.md) | Object-level permissions with indirect inheritance | Accepted | 2026-02-11 |
| [0012](./0012-activity-and-allocator-types-as-the-extension-point.md) | Activity and allocator types as the extension point | Accepted | 2026-02-11 |
| [0013](./0013-allocator-strategies-and-sandbox-groups.md) | Allocation strategies, and sandbox groups for rehearsal | Accepted | 2019-11-06 → 2026-07-28 |
| [0014](./0014-umzug-migrations-and-a-python-backfill.md) | umzug forward migrations; a separate one-off Python backfill | Accepted | 2026-02-25 |
| [0015](./0015-service-account-roles.md) | Service-account roles, and `is_admin` as visibility not authorization | Accepted, with a caveat | 2026-09-29 |

## Rejected, never adopted

These are visible in the history because they were tried and undone. They are recorded here so
nobody re-attempts them without knowing the outcome.

| Attempt | Commits | Why it went |
| --- | --- | --- |
| `express-validator` per-route validation | `19298fd` → `d4eb044` + `4811e78` | Adopted and fully reverted within 24 hours; replaced by ADR-0004 |
| MySQL as the datastore | `eeaeea8` → `8e801ac` | +3,933 lines, abandoned a month later |
| Per-activity `oauth_login_mode` column | `c729779` → `e452e23` | Downgraded to an environment variable six days later |
| xAPI 2.0.0 version stamp | `608fa76` → `df34202` | Reverted 48 minutes later, no reason recorded |
| `$ref`-shared request bodies and responses in the spec | `eec211c3` → `1bd2c85` | DRY rejected; rolled back to inline schemas |
| `oauth_login_mode` in the DB, revisited | `c729779`, `967a45a` | Deleted by `e452e23` |

## Known open items

Things the project has not settled, collected so they are not mistaken for decided:

1. **Which SSO mode a game uses.** `SSO_AUTH_METHOD` selects it globally, with the
   alternative still present as a commented-out ternary in `src/lib/config.ts`.
2. **How far soft delete should extend.** Two tables have already been carved out; the
   selection is discoverable rather than designed.
3. **Whether `is_admin` should be one flag.** It currently means "administrator" *and*
   "bypass own-data filters", which is why the `garbagecollector` account can be given it.
4. **Whether JWT signature verification should fail closed.** Currently it does not for
   Keycloak tokens.
5. **The LTI surface.** Fifteen documented operations, complete schemas, no implementation.
6. **The published contract.** SwaggerHub has served spec 1.0.0 since 2019.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| Accepted | In force, no known intent to change |
| Accepted, with a caveat | In force, with a documented sharp edge |
| Partially reversed | In force for most cases, explicitly excepted in others |
| Open | Implemented, not decided; the implementation encodes an unresolved choice |