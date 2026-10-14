# Create a gameplay activity

A gameplay activity points a participant at a serious game and wires its telemetry back into
SIMVA. SIMVA does not host the game; it hands out a signed configuration file and receives
xAPI statements back.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='...'
export SIMLET_ID=42
export SESSION_ID=100
```

## 1. Create it

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "activity_name": "Training mission",
        "activity_description": "The serious game under test",
        "activity_type": "gameplay",
        "game_type": "WEB",
        "game_url": "https://game.example.edu/mission",
        "game_technology": "html5",
        "game_tracker_technology": "Xasu",
        "game_backup": true,
        "activity_trace_storage": true,
        "activity_can_be_restarted": false
      }' | jq
```

Required fields for `gameplay` are `game_type`, `game_url`, `activity_trace_storage` and
`activity_can_be_restarted`. The optional `game_*` fields decide how the tracker config is
built; see the [activity type reference](../reference/activity-types.md).

## 2. Let the game fetch its configuration

The game asks SIMVA for a config file and reads the endpoint, the LRS credentials and the
authentication mode out of it:

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/tracker_config" \
  -H "Authorization: Bearer $TOKEN" | jq
```

```json
{
  "file_name": "tracker_config.json",
  "file_content": "{\"lrs_endpoint\":{\"url\":\".../activities/900/lrs\"},\"backup\":true}"
}
```

`file_name` depends on `game_tracker_technology`:

| `game_tracker_technology` | Config file |
| --- | --- |
| `uAdventure`, `Xasu+Simva_Plugin` | `simva.conf` |
| `Xasu` (default) | `tracker_config.json` |

## 3. Send the participant to the game

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/target" -H "Authorization: Bearer $TOKEN" | jq -r '.activity_url'
```

`GET /activities/{activityid}/open` answers with a redirect instead, which is what you want
in a link the participant clicks.

The URL carries the SSO parameters the game needs. Which parameters they are depends on
`SSO_AUTH_METHOD`:

| `SSO_AUTH_METHOD` | What the game receives |
| --- | --- |
| `simva_device_oauth2` (default) | SIMVA's own device endpoints, so the client secret never leaves the server |
| `device_oauth2` | Keycloak's device endpoints directly |
| `token_oauth2` | `login_hint` + `client_id`, or a pre-minted `auth_token` |

With the device flow the game shows a code and SIMVA's own verification screen:

```bash
curl -s -X POST "$SIMVA_URL/auth2/$ACTIVITY_ID/device" -H "Content-Type: application/json" | jq
curl -s -X POST "$SIMVA_URL/auth2/$ACTIVITY_ID/token" \
  -H "Content-Type: application/json" -d '{"device_code": "..."}' | jq
```

Both are public endpoints. They exist so that a device that cannot keep a client secret — a
game running in a browser — can still authenticate through Keycloak.

## 4. Collect results

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/result" -H "Authorization: Bearer $TOKEN" | jq
```

Result files only exist when `game_backup` is `true`; otherwise the game is expected to write
xAPI statements and nothing else is stored.

## Gotchas

- **`game_scorm_xapi: true` means SIMVA generates no traces itself.** The game is assumed to
  speak SCORM/xAPI directly, so SIMVA's own trace endpoint is a no-op.
- **A missing `game_url` makes the activity permanently non-openable**, with no validation
  error at creation time.
- **Tracker configuration was reworked repeatedly in 2026** (six commits between
  `5147be7` and `24ac082`). If a game's config looks wrong, check the activity's
  `game_tracker_technology` first — that is what selects the file name and the auth
  parameters.