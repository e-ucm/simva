# ADR-0011 — Object-level permissions with indirect inheritance

- **Status:** Accepted
- **Date:** 2026-02-11 (universalised 2026-03-11)

## Context

Roles answer "which endpoints may this user call". They cannot answer "which studies may this
teacher see", and a research platform needs exactly that: a team of researchers shares a
study; a department's groups are private; a participant sees only themselves.

Without object permissions, the only options are to give everyone the same visibility — which
leaks other people's studies — or to encode ownership as more roles, which does not survive
contact with a real research group.

## Decision

Three permission tables, one mapper.

```
SIMLETs_permissions         (simlet_id, user_id, permission)
Sessions_permissions        (session_id, user_id, permission)
ParticipantGroups_permissions (group_id, user_id, permission)
```

`UserPermission` in `src/lib/mappers/UserPermisions/` dispatches on the object type, so all
three behave identically. Two levels, standardised to uppercase in February 2026
(`664cb92`):

| Level | Read | Edit | Delete | Manage permissions |
| --- | --- | --- | --- | --- |
| `WRITE` | yes | yes | no | no |
| `FULL` | yes | yes | yes | yes |

```
b2c69bc  2026-02-11  introduce the UserPermission class
94d1c79  2026-02-19  permission retrieval across Simlet, SimletGroup, SimletParticipant (+1103)
97d2bba  2026-02-19  current_user_id becomes a parameter on permission retrieval
d121f5d  2026-05-01  indirect permissions; is_admin branches session listing
4fdcba3  2026-03-11  is_admin threaded through 39 files (+1207/-1212)
```

Inheritance is not computed in JavaScript. The SQL views resolve the effective permission for
the calling user and report whether it was `DIRECT` or `INDIRECT`:

| Source | `permission_type` |
| --- | --- |
| A row for this user on this object | `DIRECT` |
| Inherited from the parent simlet | `INDIRECT` |
| The user created the simlet or session | `FULL`, synthesised |

## Consequences

**Positive**

- **One mechanism for all three object types**, and one set of five endpoints each.
- **Inheritance means one grant covers a whole study**, which is what a research team actually
  wants — you do not want to grant a co-investigator access to 40 sessions.
- **`is_admin` short-circuits cleanly.** Administrators see everything without special-casing
  every query.
- **Two validation rules keep the model coherent:** a participant cannot also hold a permission
  on the same simlet (`ddce6bb`), and student roles are not grantable (`ddce6bb`).

**Negative**

- **`current_user_id` is a pervasive parameter.** It appears in most query templates and in
  most mapper methods, because permission resolution is a property of the *query*, not of the
  object. This is the single largest source of signature noise in the codebase.
- **`is_admin` is overloaded.** It started as "is an administrator" and became "bypass the
  own-data filter" — which is what `garbagecollector` is granted, and what the SQL clause
  `(deletedAt IS NULL OR :is_admin IS TRUE)` implements. Two different meanings, one flag.
- **Indirect permissions were thrashed in four minutes:**

```
a28d71b  21:17  deletes the indirect permission branches          -45
3286357  21:19  re-adds one of them                              +14
766ff1f  21:21  fixes the wrong view named in the new code         1
```

That diff also revealed a pre-existing typo, `vv_direct_permissions_users` with two `v`s, in
the code being deleted.

- **Soft delete broke re-granting**, and the fix is an upsert plus an explicit `restore()` on
  every permission grant. See [ADR-0010](./0010-soft-delete-and-the-admin-bypass.md).

## A defect worth recording

```ts
// src/lib/mappers/UserPermisions/SingleUserPermission.ts
canEdit() {
  if (is_admin) return true;
  if (current_user_id != null && this.user_id !== current_user_id) return true;
  throw new AuthentificationError(...);
}
```

The condition is `!==`. Read literally: **you may edit another user's permission, and you may
not edit your own.** Since the creator's `FULL` row is injected at creation, the intuitive
reading is inverted. `canDelete()` is identical. This is recorded as a bug candidate, not as a
rule.

## What to test before relying on it

- Grant `WRITE` on a simlet, then read a session of it: expect `INDIRECT` and read access.
- Grant, revoke, re-grant the same permission: expect resurrection, not a conflict.
- Create a simlet and try to grant yourself a permission: expect the upsert-and-restore path.
- Call `canEdit` on your own permission row: the current behaviour looks inverted.

## Evidence

- `8430d3e`, `cddf34f` — the three tables and their models
- `b2c69bc`, `664cb92` — the `UserPermission` class and uppercase levels
- `94d1c79`, `97d2bba` — the retrieval refactor and `current_user_id`
- `d121f5d` — indirect permissions and the origin of `is_admin`
- `a28d71b`, `3286357`, `766ff1f` — the four-minute thrash
- `4fdcba3` — `is_admin` across 39 files
- `ddce6bb` — the participant and student validations

## Related

- [Permissions](../permissions.md)
- [How-to: grant and revoke permissions](../../how-to/grant-and-revoke-permissions.md)
- [ADR-0010](./0010-soft-delete-and-the-admin-bypass.md)
- [ADR-0015](./0015-service-account-roles.md)