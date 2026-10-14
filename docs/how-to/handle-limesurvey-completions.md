# Handle LimeSurvey completions

Instead of polling LimeSurvey for answers, SIMVA accepts completion webhooks and turns them
into state changes on the activity.

```bash
export SIMVA_URL=https://simva.example.edu
```

## 1. Expose the endpoint

```
POST https://simva.example.edu/limesurvey-completion-webhooks
```

It is one of the four public endpoints — no SIMVA token, because the caller is LimeSurvey.

## 2. Configure the signature

```bash
LIMESURVEY_SECRET=shared-secret
LIMESURVEY_HEADER_NAME=X-Signature-SHA256
LIMESURVEY_HEADER_PREFIX=
```

SIMVA verifies the signature before accepting anything; a bad signature is rejected before
any state changes.

## 3. Point a LimeSurvey notification at it

In LimeSurvey, add an expression manager notification fired on completion, with a webhook or
script target of the URL above and the secret in the configured header.

## What happens server side

1. `verifyHookdeckSignature` checks the signature.
2. `limesurveyWebhookHandler` publishes the event to the `simva_events_topic` Kafka topic.
3. The consumer marks the activity completed for that participant, using the same code path
   as `POST /activities/{id}/completion`.

## Verify it worked

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/completion?users=555" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Fall back to polling

If LimeSurvey cannot call out to you, poll instead:

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/result" -H "Authorization: Bearer $TOKEN" | jq
```

SIMVA asks LimeSurvey for each participant's responses by token and caches them as result
files, so results stay readable even if the webhook never arrives.

## Gotchas

- **The endpoint is public by prefix match.** `isPublicEndpoint()` matches `/limesurvey-completion-webhooks`
  and anything starting with it, so nothing else may be mounted under that prefix.
- **The webhook only changes state; it does not fetch answers.** Responses are still read
  from LimeSurvey, lazily, when you ask for results.
- **Kafka configuration must be set.** `KAFKA_SIMVA_EVENTS_TOPIC` and
  `KAFKA_SIMVA_EVENTS_GROUP_ID` name the channel the handler publishes on; the traces topic
  is a different one.