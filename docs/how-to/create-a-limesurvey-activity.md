# Create a LimeSurvey activity

A LimeSurvey activity creates (or clones) a survey in an external LimeSurvey instance and
tracks which participants answered it.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
```

## 1. Create the activity

Either upload a survey file:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "activity_name": "Pre-test questionnaire",
        "activity_type": "limesurvey",
        "rawsurvey": "<base64 or raw .lsr content>",
        "survey_language": "en",
        "activity_trace_storage": true,
        "activity_can_be_restarted": false
      }' | jq
```

…or clone an existing survey:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "activity_name": "Post-test questionnaire",
        "activity_type": "limesurvey",
        "copysurvey": 456,
        "activity_trace_storage": true,
        "activity_can_be_restarted": false
      }' | jq
```

The survey is created in LimeSurvey immediately, so the activity id and the `survey_id` are
coupled from birth.

## 2. Register the LRS endpoint on the survey

SIMVA points the survey's LRS endpoint at itself so responses become xAPI statements:

```bash
curl -s "$SIMVA_URL/limesurvey/$SURVEY_ID/surveylanguages" -H "Authorization: Bearer $TOKEN" | jq
curl -s -X PATCH "$SIMVA_URL/limesurvey/$SURVEY_ID/surveyowner" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"simlet_id": 42}' | jq
```

On older installations this ran as a one-off migration (`2026-03-16-migrate-limesurvey-endpoints.ts`);
on new ones it happens when the activity is activated.

## 3. Activate the activity

Activation is what actually creates participant tokens in LimeSurvey and attaches them to
the allocated participants:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activate" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 4. Send the participant to the survey

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/target" -H "Authorization: Bearer $TOKEN" | jq
```

```json
{ "activity_url": "https://limesurvey.example.edu/index.php/survey/index/sid/789?token=ana_1234&lang=en" }
```

The participant's SIMVA username is used as their LimeSurvey token, which is what ties
responses back to users.

## 5. Read responses

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/result" -H "Authorization: Bearer $TOKEN" | jq
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/hasresult" -H "Authorization: Bearer $TOKEN" | jq
```

SIMVA asks LimeSurvey for each participant's responses using their token and caches them as
result files in object storage, so reading results does not hit LimeSurvey on every call.

## Receive completion notifications instead of polling

Point a LimeSurvey webhook at:

```bash
POST https://simva.example.edu/limesurvey-completion-webhooks
```

SIMVA verifies the signature on that endpoint and publishes the completion to Kafka, where it
updates the activity state. Configure the signing secret with `LIMESURVEY_SECRET` and the
header name with `LIMESURVEY_HEADER_NAME`.

## Gotchas

- **`rawsurvey` and `copysurvey` are mutually exclusive** and one of them is required. Sending
  neither fails at mapper construction time with a `NotFoundError`, not at request parsing.
- **Deleting a SIMVA participant deletes their LimeSurvey responses.** That is intentional and
  cannot be turned off.
- **Survey URL shapes changed with the LimeSurvey version.** Set `LIMESURVEY_USE_NEW_VERSION`
  to control which administration links `GET /activitytypes` advertises.