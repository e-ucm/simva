# Permissions

There are two independent gates, and confusing them is the most common source of "the API
says no" confusion in SIMVA.

```
Gate 1 — role          Can this ROLE call this ENDPOINT?      api.yaml tags + roleAllowed()
Gate 2 — permission    Can this USER touch this OBJECT?       permission tables + mappers
```

A request must pass both. A `student` cannot call `GET /simlets/{id}` at all (gate 1), so
no amount of permission would help. A `teacher` can call it, but only sees the studies where
they hold a permission (gate 2).

## Gate 1 — the role matrix

Described fully in [the API contract page](./api-contract-and-authorization.md). Six roles:
`administrator`, `teacher`, `student`, `norole`, `lrsmanager`, `garbagecollector`.

## Gate 2 — object permissions

### Levels

| Level | Read | Edit | Delete | Manage permissions |
| --- | --- | --- | --- | --- |
| `WRITE` | yes | yes | no | no |
| `FULL` | yes | yes | yes | yes |

Uppercase, exactly. `664cb92` standardised the values in February 2026; the comparisons are
exact string equality, so `write` is stored and never matches.

```ts
// src/lib/mappers/simlet/Simlet.ts
canEdit(is_admin, current_user_id) {
  return is_admin || ['FULL', 'WRITE'].includes(this.current_user_permission);
}
canDelete(is_admin, current_user_id) {
  return is_admin || this.current_user_permission === 'FULL';
}
```

The identical shape appears on `Session`. Administrators bypass everything.

### Where the permission comes from

Not from the permission table alone. The SQL views resolve the effective permission for the
calling user, including inheritance:

| Source | `permission_type` |
| --- | --- |
| A row for this user on this object | `DIRECT` |
| Inherited from the parent simlet | `INDIRECT` |
| The user created the simlet or session | `FULL`, synthesised |

That last one is why `Session.ts` sets `current_user_permission: "FULL"` for the creator: the
creator's name is on the object but no permission row exists.

### Inheritance

A `WRITE` permission on a simlet covers its sessions and activities. `Simlet.getSessions()`
branches on it:

```ts
if (this.is_admin) { /* all sessions */ }
else { /* only sessions the user has a permission on */ }
```

That branch is the origin of the `is_admin` concept. It was local to one method in May 2026
(`d121f5d`) and became a parameter on 39 files in March 2026 (`4fdcba3`), threaded from the
middleware down through controllers, services and mappers into the SQL views.

## The indirect permission views

Three commits, four minutes, on 2026-05-20:

```
a28d71b  21:17  refactor indirect permissions handling      -45 lines: deletes the indirect branches
3286357  21:19  add indirect SIMLET permissions            +14 lines: re-adds one of them
766ff1f  21:21  fix subquery reference                     1 line:   wrong view named in the new code
```

The re-added branch referenced `v_session_direct_permissions_users` where it meant
`v_simlet_direct_permissions_users`, and the fix corrected the copy-paste two minutes later.
That diff also revealed a pre-existing typo, `vv_direct_permissions_users` with two `v`s, in
the deleted branches.

It is a useful illustration of how this part of the system is built: by editing a chain of
`UNION` branches in a SQL view, where a wrong table name compiles fine and fails at runtime.

## What `is_admin` actually means

```ts
// src/lib/mappers/Users/UserPermission.ts
canEdit(is_admin) { if (is_admin) return true; ... }
```

and, in SQL:

```sql
AND (deletedAt IS NULL OR :is_admin IS TRUE)
```

`is_admin` is **data visibility**, not authorization. It means "do not restrict this query to
the caller's own rows". It is set for `administrator` and for `garbagecollector`, and it is
relied upon to be safe by the tag matrix in `api.yaml`.

The overload is documented in a code comment and is worth repeating: the moment you add
`garbagecollector` to a write operation's tags, it gains write access. There is no code check.

## The `canEdit`/`canDelete` bug in `SingleUserPermission`

```ts
// src/lib/mappers/UserPermisions/SingleUserPermission.ts
canEdit() {
  if (is_admin) return true;
  if (current_user_id != null && this.user_id !== current_user_id) return true;
  throw new AuthentificationError(...);
}
```

The condition is `!==`, not `===`. Read literally, this says: **you may edit another user's
permission, and you may not edit your own.** Since the creator's own `FULL` row is injected at
creation, the intuitive reading is inverted.

Both `canEdit()` and `canDelete()` are identical here. Treat this as a bug candidate rather
than a documented rule — it is one of several reasons the permission layer is worth testing
before relying on it.

## Management endpoints

```
GET    /simlets/{simletid}/permissions
POST   /simlets/{simletid}/permissions
GET    /simlets/{simletid}/permissions/{userid}
PATCH  /simlets/{simletid}/permissions/{userid}
DELETE /simlets/{simletid}/permissions/{userid}
```

and the identical set under `/simlets/{simletid}/sessions/{sessionid}/permissions`.

Two rules the validator enforces:

- **A participant cannot hold a permission on the same simlet.** Participation and management
  are exclusive (`ddce6bb`).
- **Student roles are not grantable** on a simlet (`ddce6bb`).

Both exist because the alternative — a student who is also a participant of a study — produces
an authorisation state nobody has reasoned about.

## Soft delete and permissions

Re-granting a permission that existed before and was removed hits the primary key, because the
old row is still there with a `deletedAt`. `addUserPermission` therefore upserts, looks the row
up with `paranoid: false`, and calls `restore()`. See
[soft delete](./soft-delete.md).

## Related

- [ADR-0011 — object-level permissions and inheritance](./decisions/0011-object-level-permissions-and-inheritance.md)
- [How-to: grant and revoke permissions](../how-to/grant-and-revoke-permissions.md)
- [Role and endpoint matrix](../reference/api/rbac-matrix.md)