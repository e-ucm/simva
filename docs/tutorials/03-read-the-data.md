# Tutorial 3 — Getting the data out

**Goal:** read participant progress, fetch stored results as presigned URLs, and pull xAPI
statements for an activity, understanding which endpoint gives you which kind of data.

**Time:** ~20 minutes. **You need:** a teacher token, and the ids from tutorial 1.

---

## The three kinds of data

SIMVA stores three different things, and mixing them up is the most common source of
confusion:

| Data | Where it lives | How you read it |
| --- | --- | --- |
| **State** — initialised, progress, completion | SQLite, `Activities_completion` | `GET /activities/{id}/progress`, `.../completion` |
| **Results** — questionnaire answers, game result files | Object storage (S3/RustFS/MinIO) | `GET /activities/{id}/result` returns **presigned URLs** |
| **Traces** — xAPI statements | The LRS, behind `POST /activities/{id}/lrs/statements` | `GET /activities/{id}/lrs/statements` |

SQLite never holds the result payloads. When you ask for results you get back links, not
data, and those links expire. This is a deliberate decision, explained in
[ADR-0008](../explanation/decisions/0008-object-storage-for-traces-and-results.md).

---

## Step 1 — who is in the study

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/participants" \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
[
  { "user_id": 555, "username": "ana.ruiz", "email": "ana.ruiz@example.edu", "is_admin": false, "is_allocated": true }
]
```

---

## Step 2 — progress per participant

Progress endpoints take `?users=` as a comma separated list of user ids. As a teacher you
must name who you are asking about; as a student that parameter is ignored and the server
always uses your own id.

```bash
curl -s "$SIMVA_URL/activities/900/progress?users=555,556" \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
[
  { "user_id": 555, "progress": 100, "completed": true },
  { "user_id": 556, "progress": 40,  "completed": false }
]
```

The same shape is returned by `.../completion`, `.../initialized`, `.../suspension` and
`.../hasresult`.

For an overview across a whole session, use the session participant list:

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/participants" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Step 3 — results, as presigned URLs

```bash
curl -s "$SIMVA_URL/activities/900/result" \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
{
  "results": {
    "555": "http://rustfs.internal:9000/traces/backup/900/555.result?X-Amz-Signature=...",
    "556": null
  }
}
```

Each value is a time limited signed URL. `null` means that participant has not produced a
result yet, or the activity has no result storage enabled (`game_backup` for gameplay
activities, `survey_lrsset` for LimeSurvey ones).

Download one straight away — the link dies:

```bash
curl -sO "$(curl -s "$SIMVA_URL/activities/900/result" -H "Authorization: Bearer $TOKEN" | jq -r '.results["555"]')"
```

To hand a whole activity or study to someone else, use the export endpoints instead; they
assemble one archive server side:

```bash
curl -sO "$SIMVA_URL/simlets/$SIMLET_ID/export" -H "Authorization: Bearer $TOKEN"
curl -sO "$SIMVA_URL/activities/900/export" -H "Authorization: Bearer $TOKEN"
```

Both are signed-URL based too: `GET /simlets/{simletid}/events/getPresignedUrl` and
`GET /activities/{activityid}/presignedurl` hand you the link without downloading the payload.

---

## Step 4 — xAPI statements

The activity is registered in the LRS under a SIMVA activity IRI, and statements are scoped
to it:

```bash
curl -s "$SIMVA_URL/activities/900/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Experience-API-Version: 1.0.3" | jq
```

```json
{
  "statements": [
    {
      "id": "9f8b...",
      "actor": { "objectType": "Agent", "name": "ana.ruiz" },
      "verb": { "id": "http://adlnet.gov/expapi/verbs/completed", "display": { "en-US": "completed" } },
      "object": { "id": "http://rustfs-api/activities/900", "definition": { "type": ".../activities/assessment" } },
      "result": { "completion": true, "score": { "scaled": 0.85 } },
      "context": {
        "parent": [{ "id": "http://rustfs-api/activities/900" }],
        "grouping": [{ "id": "http://rustfs-api/simlets/42/sessions/100/activities/900" }]
      }
    }
  ]
}
```

SIMVA rewrites the context of every statement it accepts: it fills in the missing `id`
(with a bloom filter guarding against duplicates), stamps `version`, `platform`, `stored`
and an authority account, and rewrites `contextActivities` into `parent`/`grouping` IRIs
pointing back at the simlet, session and activity. That rewriting is the reason a statement
posted by a browser game is still queryable by the study that owns it.

Two variations:

- `GET /activities/900/lrs/statements/more` — continuation token for paging.
- `GET /activities/900/lrs_test_statements` — the **test** LRS, where tester activity goes.
  A session's tester is a researcher impersonating a participant while rehearsing; their
  statements must not contaminate production data.

To post statements yourself (a game writing traces):

```bash
curl -s -X POST "$SIMVA_URL/activities/900/lrs/statements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Experience-API-Version: 1.0.3" \
  -d '{"statements": [ ... ]}' | jq
```

Incoming statements are also interpreted: `initialized`, `progressed`, `completed` and
`terminated` verbs update the activity state that step 2 reads. That is how a gameplay
activity records progress without the game calling the completion endpoints.

---

## Step 5 — export everything at once

The most compact way to hand over a study:

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/export" -H "Authorization: Bearer $TOKEN" -o simlet-42.zip
```

The export contains the study structure, its participants and the presigned links to every
result and trace. It does **not** contain the payloads: anyone opening it still needs the
links to be live, so treat an export as a manifest plus a time window, not as an archive.

---

## Where to go next

- [How-to: query statements for a whole session](../how-to/query-xapi-statements.md)
- [Reference: the `/activities` endpoints](../reference/api/activities.md)
- [Explanation: how the LRS integration works](../explanation/lrs-integration.md)

## Things that surprise people

- **`/activities/{id}/result` returns links, not content.** If you build a dashboard, fetch
  the links and download them immediately; they expire (`MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME`,
  one hour by default).
- **A statement you posted yourself may come back with a different `id` and `context`.** That
  is SIMVA normalising it, not a bug. See
  [LRS integration](../explanation/lrs-integration.md#statement-normalisation).