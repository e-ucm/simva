# Add a participant to a study

Participants do not attach to the simlet directly. They attach to a **simlet group**, and the
group is what carries an allocator.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'          # teacher or administrator
export SIMLET_ID=42
```

## 1. Create a group

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "group_name": "Class 4B",
        "group_use_new_generation": true,
        "group_sandbox": false,
        "group_allocator_type": "session"
      }' | jq
```

`group_use_new_generation: true` opts the group into the newer generation of study screens;
leave it `true` for anything you build now.

## 2. Add the user

**With an institutional account** (the user exists in Keycloak with a matching username):

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "ana.ruiz", "email": "ana.ruiz@example.edu", "role": "student"}' | jq
```

**With a token only** (no account anywhere, for pilot or field participants):

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isToken": true, "token": "ana-ruiz-1234", "username": "ana", "role": "student"}' | jq
```

Keep the token string: the participant authenticates with it from then on. Lose it and you
have to delete the participant and re-add them.

## 3. Allocate them to a session

Being in a group is not the same as having work to do.

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/allocate/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participant_id": 555}' | jq
```

Omit `participant_id` to allocate the whole group at once. Some allocator types refuse
manual allocation — see [choose-and-configure-an-allocator.md](./choose-and-configure-an-allocator.md).

## 4. Remove a participant

```bash
curl -s -X DELETE "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants/555" \
  -H "Authorization: Bearer $TOKEN"
```

For LimeSurvey activities this also deletes the participant's questionnaire responses
upstream in LimeSurvey, so the data does not linger after consent is withdrawn.

## Verify

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants" -H "Authorization: Bearer $TOKEN" | jq
```

## Gotchas

- **`role` must be one of the values Keycloak can map back.** `researcher` and
  `teaching-assistant` are accepted and stored, but the SIMVA role they resolve to is
  `teacher` and `student` respectively.
- **A participant cannot also hold a `WRITE`/`FULL` permission on the simlet.** The server
  rejects the second one; participation and management are separate grants.
- **Removing a participant soft-deletes their rows.** Their completion history stays, and an
  administrator can still see it. If you need it gone for good, that is a database decision,
  not an API one.