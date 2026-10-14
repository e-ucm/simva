# Add a sandbox group

A sandbox group is a rehearsal group. It exists so that a pilot run does not contaminate the
real study: participant counts report `null`, and several listings filter sandbox groups out
unless you ask for them.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export SIMLET_ID=42
```

## Create it

Sandbox is a flag on the group:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "group_name": "PILOT - not for analysis",
        "group_use_new_generation": true,
        "group_sandbox": true,
        "group_allocator_type": "session"
      }' | jq
```

Add pilot participants and allocate them exactly as you would for real participants.

## Turn it on and off again

```bash
curl -s -X PATCH "$SIMVA_URL/simlets/$SIMLET_ID/groups/7" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"group_sandbox": false}' | jq
```

Flipping the flag back is the whole "graduation" procedure: the group becomes part of the
study, its participants get counted, and its activities appear in the normal statistics.

## What sandbox changes

| Behaviour | Sandbox group |
| --- | --- |
| `GET .../groups/{groupid}/participants/count` | `null`, not a number |
| Simlet participant count | excluded |
| Group listings | filtered out unless the request asks for sandbox groups |

## Gotchas

- **A sandbox group still allocates participants to sessions.** Sandboxing hides it from
  counts and lists; it does not create a parallel study.
- **The sandbox flag was stabilised slowly** (five months between the column and a correct
  filter, including two bug fixes three days apart). If a sandbox group leaks into a listing,
  check `group_sandbox` is actually in the request and in the view.