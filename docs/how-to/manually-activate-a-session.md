# Manually activate a session

By default a session opens when its start date arrives and closes when its end date passes.
A session created with `session_can_be_manually_activated: true` ignores those dates for
opening, and waits for you.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
```

## Set the flag

It is fixed at creation time:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "session_name": "Pilot",
        "session_description": "Opened by hand when we decide",
        "session_can_be_manually_activated": true
      }' | jq
```

## Open it

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activate" \
  -H "Authorization: Bearer $TOKEN" | jq
```

The response lists the session's activities, which is how you confirm what participants will
see:

```json
{
  "session_id": 100,
  "session_activated": true,
  "activities": [ { "activity_id": 900, "activity_name": "Read the consent form" } ]
}
```

## Check the state

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/sessions" -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | {session_id, session_name, session_activated}'
```

## When to use it

- **Piloting.** Open the session, run the study with your colleagues as testers, then archive
  it instead of trying to clean the data.
- **Studies with no calendar.** Scheduling conferences and classroom sessions around fixed
  dates is fragile; opening on demand is not.
- **Reproducible demos.** The same session opens the same way every time.

## Gotchas

- **Activation does not override the date window for closing.** A session with an end date in
  the past that you activate manually still refuses activity opening.
- **You need a `teacher` or `administrator` token.** Students cannot activate anything.
- **Activating a LimeSurvey activity is a separate step.** Activation of the *session* creates
  the participant tokens upstream in LimeSurvey; see
  [create-a-limesurvey-activity.md](./create-a-limesurvey-activity.md).