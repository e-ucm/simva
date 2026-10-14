# Grant and revoke permissions

Permissions are object level: a user can hold one on a simlet, a session, or a group. There
is no global "can read simlets" flag beyond the role.

Two levels exist:

| Permission | Can read | Can edit | Can delete | Can manage permissions |
| --- | --- | --- | --- | --- |
| `WRITE` | yes | yes | no | no |
| `FULL` | yes | yes | yes | yes |

Administrators bypass all of it through the `is_admin` flag.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export SIMLET_ID=42
```

## Grant on a simlet

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 4321, "permission": "WRITE"}' | jq
```

## Change and revoke

```bash
curl -s -X PATCH "$SIMVA_URL/simlets/$SIMLET_ID/permissions/4321" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permission": "FULL", "user_id": 4321, "username": "colleague", "isCurrentUser": false}' | jq

curl -s -X DELETE "$SIMVA_URL/simlets/$SIMLET_ID/permissions/4321" \
  -H "Authorization: Bearer $TOKEN"
```

## List

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/permissions" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/permissions/4321" -H "Authorization: Bearer $TOKEN" | jq
```

The same five verbs exist under sessions:

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/permissions" -H "Authorization: Bearer $TOKEN" | jq
curl -s -X POST  "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/permissions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id": 4321, "permission": "WRITE"}' | jq
```

## Indirect permissions

A permission can also be **inherited**. Holding `WRITE` on a simlet gives you access to its
sessions and activities without a row of your own. The read endpoints report which one
applied:

```json
{ "permission_type": "DIRECT" }   // your row on this object
{ "permission_type": "INDIRECT" } // inherited from the parent simlet
```

## Gotchas

- **Permission strings are uppercase.** `write` is stored but never matches; the comparisons
  in `Simlet.canEdit()` and `Session.canEdit()` are exact.
- **You cannot grant a permission to someone who is a participant of the same simlet.** The
  validator rejects it: participation and management are deliberately exclusive.
- **Granting a permission that already exists, but was soft deleted, resurrects the old row
  instead of failing.** `addUserPermission` upserts and then calls `restore()`. You will not
  see a duplicate-key error.
- **Archived simlets refuse permission edits** with a `ValidationError` (HTTP 406).