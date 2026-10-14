# Set a session tester

A tester is a researcher standing in for a participant while a session is rehearsed. While
you are the tester, everything you do is redirected to the **test** LRS and test result
paths, so your rehearsal cannot contaminate the real data.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export SIMLET_ID=42
export SESSION_ID=100
```

## Become the tester

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/tester" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Now behave exactly like a participant: open activities, complete them, play the game.

## Watch it land in the test store

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/lrs_test_statements" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Rehearsal statements go here. `GET /activities/{id}/lrs/statements` stays empty.

## Leave

```bash
curl -s -X DELETE "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/tester" \
  -H "Authorization: Bearer $TOKEN"
```

If you want to clear the tester and keep your session state in one call:

```bash
curl -s -X PATCH "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/tester" \
  -H "Authorization: Bearer $TOKEN"
```

`PATCH` resets the tester (keeps the completed activity state and clears the tester mark);
`DELETE` removes the tester outright.

## Read completion as the tester

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/lrs_test_statements" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Gotchas

- **One tester per session.** Setting a second tester replaces the first.
- **The tester is per session, not per study.** Rehearsing a second session requires setting
  the tester again.
- **Results are separated too, not just statements.** `hasResults` and `getResults` check the
  test paths while you are a tester, so a rehearsal result file never shows up in the real
  result listing.