# ADR-0007 — SIMVA proxies the OAuth2 device authorization flow

- **Status:** Accepted; **the mode selection mechanism is still open**
- **Date:** 2026-08-19

## Context

A serious game is a web page or a desktop binary. It has to authenticate the participant, and
it cannot keep a client secret — anything shipped to a browser is public.

The OAuth 2.0 Device Authorization Grant (RFC 8628) exists for exactly this: the device polls
for a token while the user approves the request on a second device.

The alternative — resource owner password credentials — means the game handles the
participant's password, which is unacceptable in an institutional deployment and impossible
for a hosted game SIMVA does not control.

## Decision

SIMVA exposes two public endpoints that proxy the device flow to Keycloak, keeping the client
secret server side:

```
POST /auth2/{activity_id}/device    -> device_code, user_code, verification_uri, interval
POST /auth2/{activity_id}/token     -> poll; 400 authorization_pending until approved
```

They are mounted **before** the auth middleware (`src/app.ts:76`) and listed in
`isPublicEndpoint()`. They must be reachable by a client that has no SIMVA token yet — that is
the definition of the flow.

The Keycloak client is selected from the activity's `game_tracker_technology`: `uAdventure`
uses `SSO_UADVENTURE_CLIENT_ID`, everything else `SSO_PLUGIN_CLIENT_ID`.

SIMVA also **rewrites `verification_uri`** to point at its own screen,
`${EXTERNAL_URL}/scheduler/{simletId}/device`, so the approval UI is SIMVA's rather than
Keycloak's.

## The history is the interesting part

The feature was reworked four times in three weeks:

```
8ebe2c7  2026-08-19  adding oauth via device
                    GameplayActivity.ts  107 lines changed (net -31)
                    config.ts +1: deviceAuthUrl

4c2e092  2026-09-04  fix oauth2 2 modes
                    GameplayActivity.ts  +76/-27
                    wraps URL construction in a switch; the diff reveals a stray semicolon
                    had terminated a statement early, orphaning the device parameters

e452e23  2026-09-09  fix oauth mode device
                    GameplayActivity.ts  174 lines rewritten (+85/-125)
                    DELETES src/lib/migrations/2026-09-03-add-login-mode.ts
                    config.ts +1: authMethod default "device_oauth2"

7aff131  2026-09-09  adding oauth2 device mode from simva
                    creates controlers/auth2, services/auth2, routes/auth2
                    mounts /auth2 before the auth middleware
                    renames the default to "simva_device_oauth2"
```

`bdc19a9` (2026-09-16) added `login_hint` and `client_id` for password-grant mode, and
`cf22e02` (2026-09-28) *removed* 36 lines and added 11 — consolidating token handling after
`4c2e092` had added 76.

## The reversal: per-activity column to environment variable

`c729779` (2026-09-03) introduced an `oauth_login_mode` **column** on `GamePlay_Activities`,
with a umzug migration defaulting to `device_oauth2`. Per-activity mode configuration is
exactly what you would expect a research platform to want: one study on device flow, another on
password grant, for a legacy game that cannot be changed.

Six days later `e452e23` deleted the migration and the column and replaced it with
`config.sso.authMethod`, an environment variable — deployment-wide, with no per-activity
override.

The code still carries the shape of the unsettled choice:

```ts
// src/lib/config.ts
config.sso.authMethod = process.env.SSO_AUTH_METHOD || "simva_device_oauth2" //"token_oauth2"
```

A commented-out ternary. Three values are fully implemented, and
`GameplayActivity.getTrackerConfig()` and `target()` branch three ways:

| `SSO_AUTH_METHOD` | Endpoints handed to the game |
| --- | --- |
| `simva_device_oauth2` | SIMVA's own `/auth2/...` |
| `device_oauth2` | Keycloak's directly |
| `token_oauth2` | `login_hint` + `client_id`, or a pre-minted `auth_token` |

## Consequences

**Positive**

- **No client secret in the game.** The whole point, achieved.
- **The participant sees SIMVA's approval screen**, not Keycloak's.
- **One place to rotate the client secret.**
- **The client id follows the tracker technology**, so uAdventure and other games get the
  Keycloak clients they expect.
- **The poll loop is server-side**, so the game never constructs a Keycloak token request.

**Negative**

- **The choice is not settled.** Deployment-wide versus per-activity is an open question
  encoded as a commented-out alternative.
- **Two public endpoints exist to serve a feature.** `/auth2` being public by prefix match is
  permanent surface area.
- **The controller relays Keycloak errors verbatim**, so an upstream `400
  authorization_pending` reaches the game as a `400` rather than becoming a 500. That is
  correct and also means the game must handle LRS-style errors.
- **Refresh relies on a public client.** `refreshAuthToken()` passes `client_secret` only if
  the body supplies it — undefined by default, so refresh generally depends on the Keycloak
  client being registered as public.

## The decision to revisit

If a deployment ever needs two games with different SSO behaviours in one study, the
per-activity column is the answer and it should be reinstated deliberately — with the
migration, the model field, and the three-way switch — rather than by uncommenting a ternary.

## Evidence

- `8ebe2c7`, `4c2e092`, `e452e23`, `7aff131` — four iterations in three weeks
- `c729779`, `967a45a` — the per-activity column
- `e452e23` — the deletion of that migration
- `bdc19a9` — `login_hint` and `client_id`
- `cf22e02` — the consolidation
- `33b41db` (2026-09-11) — a refresh token fix along the way

## Related

- [Authentication and identity](../authentication-and-identity.md)
- [How-to: create a gameplay activity](../../how-to/create-a-gameplay-activity.md)
- [ADR-0006](./0006-keycloak-as-the-identity-provider.md)
- [decisions/README.md](./README.md) — open items