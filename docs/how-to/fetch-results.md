# Fetch results

Result payloads are not in SQLite. They are files in object storage, and the API hands you
short-lived signed URLs to them.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export ACTIVITY_ID=900
```

## Get the links

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/result?users=555,556" \
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

A `null` value means no result file for that participant: they have not finished, or the
activity has no result storage configured.

## Download immediately

```bash
url=$(curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/result?users=555" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results["555"]')
curl -sO "$url"
```

Links expire. The lifetime is
`MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME` (default `1h`). Do not store them; store the file.

## Check before fetching

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/hasresult?users=555" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Just the link, without the metadata

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/presignedurl" -H "Authorization: Bearer $TOKEN" | jq
```

## Upload a result

```bash
curl -s -X POST "$SIMVA_URL/activities/$ACTIVITY_ID/result" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type": "full", "result": "{...}"}' | jq
```

`type` selects what is stored:

| `type` | Behaviour |
| --- | --- |
| `full` | store the payload as a result file |
| `code` | store it as the activity's result code |
| `traces` | do not store; run the incoming statements through the LRS pipeline |

Gameplay activities reject `full` and `code` unless `game_backup` is on.

## Export a whole activity or study

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/export"  -H "Authorization: Bearer $TOKEN" -o activity-900.zip
curl -s "$SIMVA_URL/simlets/$SIMLET_ID/export"        -H "Authorization: Bearer $TOKEN" -o simlet-42.zip
```

The export is a manifest plus presigned links, not an archive of the payloads. It is the
right format for handing a study to an analyst with the same storage access; it is **not** a
backup.

## Gotchas

- **Results are stored per participant**, keyed by `activity_id/user_id`. Two activities never
  share a result file.
- **`garbagecollector` has read-only access to results** — it is the account for a retention
  job that sweeps stored traces.
- **A result read is not permission checked per participant** beyond the activity-level rules
  you already pass. If you can read the activity, you can read everyone's results for it.