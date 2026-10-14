# Read participant progress

State — not results, not traces — is stored in SQLite and read from the activity endpoints.
All of them take the same shape of argument, so they all work the same way.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export ACTIVITY_ID=900
```

## Ask about specific participants

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/progress?users=555,556" \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
[
  { "user_id": 555, "progress": 100, "completed": true },
  { "user_id": 556, "progress": 40,  "completed": false }
]
```

`?users=` is a comma separated list of user ids. As a **student** it is ignored and the server
always uses your own id; as a **teacher** you must name who you are asking about.

## The other four state endpoints

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/initialized?users=555" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/completion?users=555" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/suspension?users=555"  -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/hasresult?users=555"   -H "Authorization: Bearer $TOKEN" | jq
```

## Write state

```bash
curl -s -X POST "$SIMVA_URL/activities/$ACTIVITY_ID/progress" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"progress": 75}' | jq

curl -s -X POST "$SIMVA_URL/activities/$ACTIVITY_ID/completion" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status": true}' | jq
```

As a teacher, add `?user=555` to write on somebody else's behalf. As a student that
parameter is ignored.

Complete several activities at once — this is how a batch import or a scripted analysis sets
up a fixture:

```bash
curl -s -X POST "$SIMVA_URL/activities/$ACTIVITY_ID/completion/multi" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status": true, "users": [555, 556]}' | jq
```

## Whole-study overview

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/participants" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/participants" -H "Authorization: Bearer $TOKEN" | jq
```

## Gotchas

- **`?users=` is ignored for participant-shaped roles.** `student` and `lrsmanager` get
  `allocated: true`, and every service short-circuits to your own id.
- **A single completion request covers one activity.** `completion/multi` exists for the
  batch case.
- **Re-completing a finished activity returns 409** unless `activity_can_be_restarted` is
  set on the activity.
- **`hasresult` asks object storage, not the database**, so it is the one of these that can be
  slow when storage is unreachable.