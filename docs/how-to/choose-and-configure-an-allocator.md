# Choose and configure an allocator

The allocator decides which session each participant ends up in. It belongs to the simlet
**group**, not to the simlet, so different cohorts in the same study can be allocated
differently.

## List the available strategies

```bash
curl -s "$SIMVA_URL/allocatortypes" -H "Authorization: Bearer $TOKEN" | jq
```

| Type | Behaviour | Extra fields |
| --- | --- | --- |
| `default` | everything goes to the first session | — |
| `session` | participants join every session; overlapping date ranges are rejected | — |
| `group` | whole groups are assigned, recorded in `Experimental_Groups` | — |
| `random` | percentages decide, at allocation time | `randomize_session_allocation` |

`default` and `group` are listed by default; ask for the others explicitly:

```bash
curl -s "$SIMVA_URL/allocatortypes?type=random" -H "Authorization: Bearer $TOKEN" | jq
```

## Set one on a group

```bash
curl -s -X PATCH "$SIMVA_URL/simlets/$SIMLET_ID/groups/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "group_allocator_type": "random",
        "randomize_session_allocation": [
          { "session_id": 100, "percentage": 50 },
          { "session_id": 101, "percentage": 50 }
        ]
      }' | jq
```

Percentages are integers and are validated as a whole: the server refuses a set that does not
describe a usable split.

## Allocate explicitly

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/allocate/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participant_id": 555}' | jq
```

Omit `participant_id` to allocate everyone in the group. The server refuses to put the same
participant twice in one session.

## Inspect the result

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/groups/7" -H "Authorization: Bearer $TOKEN" \
  | jq '{group_id, group_allocator_type, allocations, participants}'
```

`allocations` maps a session id to the participants assigned to it.

## Gotchas

- **Changing the allocator type after allocation does not move anyone.** Re-run the
  allocation for the sessions you want to change.
- **`session` allocation rejects overlapping sessions**, so a between-subjects design with
  simultaneous conditions needs `random` or `group`, not `session`.
- **Allocation rows are the one thing that is not soft deleted.** Soft-deleting
  `Experimental_Participants` broke allocation and was reverted. Do not add `paranoid: true`
  to those models.