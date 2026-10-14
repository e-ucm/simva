# Query xAPI statements

SIMVA does not store xAPI statements. It registers an activity in the LRS, proxies statements
to it, rewrites their context, and reads them back through the same endpoint games write to.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export ACTIVITY_ID=900
```

## Read statements for one activity

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Experience-API-Version: 1.0.3" | jq '.statements | length'
```

## Page through a large result set

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" | jq '.statements[-1].id' > /tmp/cursor

curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/lrs/statements/more?more=$(cat /tmp/cursor)" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Filter by actor

The `agent` filter is normalised for you — send the username as a string and SIMVA converts
it into the object form the LRS needs, and renames the xAPI 1.0.3 `actor` to the 2.0 `agent`
key:

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/lrs/statements?agent=ana.ruiz" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Other query parameters are forwarded to the LRS untouched, so anything your LRS supports
(`limit`, `since`, `until`, `ascending`, `format`, `attachments`) works here too.

## Read across a whole session

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Read across the whole instance

```bash
curl -s "$SIMVA_URL/admin/lrs/statements" -H "Authorization: Bearer $TOKEN" | jq
```

That endpoint is for `lrsmanager` and `administrator` accounts, or any account with
`canImpersonate`. The `garbagecollector` service account also has read access.

## Post statements

```bash
curl -s -X POST "$SIMVA_URL/activities/$ACTIVITY_ID/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Experience-API-Version: 1.0.3" \
  -d '{"statements": [{
        "actor": {"objectType": "Agent", "name": "ana.ruiz"},
        "verb": {"id": "http://adlnet.gov/expapi/verbs/completed"},
        "object": {"id": "https://game.example.edu/mission"}
      }]}' | jq
```

## What SIMVA does to your statement on the way in

1. Assigns an `id` if you did not, checking a persisted bloom filter so an id is never reused.
2. Stamps `version`, `platform`, `stored` and an authority account.
3. Rewrites `contextActivities` into `parent` and `grouping` IRIs that point at the simlet,
   session and activity that received it.
4. Drops values in those arrays that are not valid absolute IRIs — except `grouping`, which
   SIMVA keeps as opaque group identifiers.
5. Reads the verb and updates the activity state: `initialized`, `progressed`, `completed`,
   `terminated`.

Step 5 is why posting statements is a legitimate way to record progress: the game never has to
call the completion endpoints.

## Gotchas

- **Statements are only accepted when the activity is genuinely reachable.** Session active,
  dates in range, and every earlier activity complete — otherwise the call returns `[]` with
  no error. This is the same gate as opening the activity.
- **A tester never writes to production.** While you are set as the session's tester, the
  activity redirects to the test LRS URLs. Read them from
  `GET /activities/{id}/lrs_test_statements`.
- **`POST` and `PUT` on the statements endpoint are the same handler.** Both exist because
  different trackers emit different verbs for the same call.