# ADR-0001 — Rewrite on TypeScript and Express 5

- **Status:** Accepted
- **Date:** 2026-01-22

## Context

SIMVA began in 2019 (`1da2a60`) as an Express 4 + Mongoose + `swagger-mongoose` service with
JavaScript, Mocha, and a hand-written validator (`src/lib/validator.js`). It grew for six
years into something whose main character was its own accretion: 924 commits by 2026, with a
MongoDB store, locally hashed passwords, a bespoke auth middleware and a validation layer that
had been patched around repeatedly.

By late 2025 the cost was visible in the commit history. The same bug class kept recurring —
`validator only checks schema $ref when it has a schema $ref` (`28bb4b2`, 2024-02-27) — and
the JavaScript layer had no types to make large refactors safe.

A SQL datastore was also being prototyped in parallel, which meant the rewrite had to absorb
that work too.

## Decision

Replace the runtime wholesale in one commit rather than incrementally.

```
f7465e0  2026-01-22  chore: remove deprecated user API tests and related files
                    9,459 lines changed
```

Removed: `mongoose`, `bcrypt`, `swagger-mongoose`, `express-body-schema`, `minio`, `ltijs`,
`kafkajs`, Mocha, `should`, pm2, clinic. Also deleted the whole `src/api/**` tree and
`docker-compose.yaml`.

Added: Express `5.2.1`, Sequelize `6.35.0`, `sqlite3`, `pino`, TypeScript `5.9.3`, Jest,
`"type": "module"`.

Supporting commits landed the same day:

| Commit | What |
| --- | --- |
| `cddf34f` | 30 Sequelize models, `src/lib/db.ts`, `src/lib/functions.ts`, the views and query templates, `validateParams.ts` (2,004 lines) |
| `7af0a90` | users and views routes with controllers |
| `a9d69a8` | JSDoc across the new layer (+1,175 lines) |
| `8430d3e` | the SQLite schema and views, plus the Python Mongo backfill |

## Consequences

**Positive**

- TypeScript across the whole application, so the 2026 feature work (which is 402 of 924
  commits) happens with compile-time checking.
- Express 5's async error propagation removes a whole class of unhandled rejection.
- The SQL rewrite happened as part of the big bang instead of beside a live MongoDB
  deployment.
- ESM throughout, which is where the ecosystem went.

**Negative**

- **No strangler-fig period.** There was no commit where the system was half-migrated and
  fully working. For the duration of the rewrite the service was, in the literal sense, broken.
- **The knowledge was in the deleted files.** The rewrite is written from scratch, so behaviours
  that lived only in the JavaScript controllers had to be re-derived from tests and the
  contract. Some were not, which is why parts of the current surface are weaker than their
  predecessors.
- **Big-bang rewrites concentrate risk in review.** The most consequential architectural
  choices of the last two years were made in commits too large to review carefully — which is
  visible in the defect pattern (a PostgreSQL `DISTINCT ON` on SQLite, a copy-pasted key in two
  permission branches, an xAPI version bumped and reverted within an hour).

**Carried forward**

- Everything downstream in this ADR set was shaped by this commit, including the ones that
  turned out badly. When a later decision is hard to explain, this rewrite is usually why.
- The single-author concentration (402 commits in 2026, effectively one person) has the same
  cause: there was no review layer to slow the work down or to catch defects.

## Evidence

- `1da2a60` — first proof of concept, 2019-07-29
- `f7465e0` — the rewrite
- `cddf34f`, `7af0a90`, `a9d69a8`, `8430d3e` — the same day
- `28bb4b2` — the validator bug that motivated leaving the old layer

## Related

- [ADR-0002](./0002-sqlite-and-sequelize-as-the-datastore.md)
- [ADR-0005](./0005-layered-architecture-with-sql-views.md)
- [Architecture](../architecture.md)