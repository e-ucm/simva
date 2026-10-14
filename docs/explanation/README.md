# Explanation

Explanation answers *why*. It is for reading when you want to understand a decision, not to
accomplish a task.

If you want to **do** something, use the [tutorials](../tutorials/README.md) or the
[how-to guides](../how-to/README.md). If you want to **look something up**, use the
[reference](../reference/README.md).

## How this section is sourced

Every claim here is traceable to the repository. Architectural decisions are written as ADRs
in [decisions/](./decisions/README.md) with:

- **Context** — the situation that made a decision necessary, with the date and the commits
  that establish the situation.
- **Decision** — what was chosen, and where in the code you can read it today.
- **Consequences** — what it cost. Including the parts that turned out badly, because those
  are the parts you cannot rediscover by reading the code.

The commits are real (`git show <hash>` works) and dated. Where the history shows a decision
being made and then partly undone, the ADR says so and links the reversal.

## The shape of the system

| Page | Covers |
| --- | --- |
| [Architecture](./architecture.md) | The layers, the request path, and why each layer exists |
| [Persistence: SQLite and SQL views](./persistence-sqlite-and-views.md) | Why a relational store and why the reads live in SQL |
| [The API contract is also the authorization matrix](./api-contract-and-authorization.md) | Why `api.yaml` does three jobs at once |
| [Authentication and identity](./authentication-and-identity.md) | Keycloak, JWT verification, roles, and the device flow |
| [Permissions](./permissions.md) | Role level versus object level, and inheritance |
| [Soft delete](./soft-delete.md) | What `deletedAt` bought, and what it cost across 24 tables |
| [Object storage and traces](./object-storage-and-traces.md) | Why results are files and links, not rows |
| [LRS integration](./lrs-integration.md) | Statement normalisation and why SIMVA rewrites your statements |
| [The activity and allocator type system](./activity-and-allocator-types.md) | Polymorphism as the domain's extension mechanism |

## Decisions

[decisions/README.md](./decisions/README.md) — the ADR index, including the decisions the
project has since reversed.

## Things worth knowing before you read any of it

- **The 2026 rewrite was big-bang, not incremental.** Commit `f7465e0` (2026-01-22) deleted
  over a hundred JavaScript files and swapped Mongoose, bcrypt, Express 4 and Mocha for
  TypeScript, Express 5, Sequelize and Jest in one commit of roughly 9,500 changed lines. Most
  of what follows is the shape that commit left behind, not a plan that preceded it.
- **The history is dominated by one author.** 402 of 924 commits are from 2026, and the
  commits behind these ADRs are effectively one person's work. There is no visible review
  layer in the log, which explains both the rapid iteration and the defects that survived
  (a PostgreSQL `DISTINCT ON` on SQLite, a copy-pasted `simlet_id` key in two permission
  branches, an xAPI version bumped and reverted within an hour).
- **Some decisions are still open.** The OAuth mode switch is still selected by a
  commented-out ternary; soft delete is still being carved back; the published SwaggerHub
  contract has been stale since 2019. Where that is true, the ADR says "not closed" instead of
  pretending otherwise.