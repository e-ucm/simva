# Authentication reference

## Presenting a token

Two ways, both accepted by the auth middleware:

```http
Authorization: Bearer eyJhbGciOi...
```

```http
GET /simlets?token=eyJhbGciOi...
```

The query parameter form exists for `window.open()` style navigation and for `<img>`-driven
downloads, where you cannot set a header. It is equivalent; prefer the header.

Anything else — a raw token, a non-`Bearer` scheme — is rejected with 401.

## Public endpoints

These four prefixes bypass authentication entirely. The match is a prefix comparison, so
`/auth2/anything` is also public.

| Prefix | Why |
| --- | --- |
| `/health` | load balancer probe |
| `/version` | client feature detection |
| `/limesurvey-completion-webhooks` | the caller is LimeSurvey, authenticated by signature |
| `/auth2` | the OAuth2 device flow proxy; it has no SIMVA token yet by definition |

Public endpoints still go through `optional` authentication: if a valid token happens to be
present it is decoded and attached to `req.user`, but a failure is swallowed rather than
rejected. The user object there is the raw JWT payload, so `req.user.sql` may be incomplete —
do not branch on it in a public handler.

## Token types

| Issuer | Recognised by | Verified with |
| --- | --- | --- |
| Keycloak | `iss` is the realm URL | the JWKS public key for the token's `kid`, converted with `jwk-to-pem` |
| SIMVA internal | `iss` is `config.sso.jwt_issuer` (default `simva`) | HMAC with `SSO_JWT_SECRET` |
| Anything else | — | accepted **without** verification, with a warning |

Requirements for a Keycloak token: `exp` in the future, plus one of
`preferred_username` / `username` / `sub`, plus an `email`.

Keycloak's signature verification failure is currently **not** fatal — the validation
resolves with the decoded payload anyway. Do not treat a successful call as proof the
signature was checked. See
[ADR-0006](../explanation/decisions/0006-keycloak-as-the-identity-provider.md).

## Role resolution

Roles are read from the **database**, not from the token: `req.user.sql.role`. The database
value is refreshed from the JWT on each request when it drifts, by
`createOrUpdateKeycloakUser()`.

`getRoleFromKeycloakJWT()` maps `realm_access.roles` in strict priority order:

| Keycloak role(s) | SIMVA role |
| --- | --- |
| `administrator` | `administrator` |
| `garbagecollector` | `garbagecollector` |
| `lrsmanager` | `lrsmanager` |
| `teacher`, `researcher` | `teacher` |
| `teaching-assistant`, `student` | `student` |
| *(none)* | `norole` |

The order matters: `teacher` beats `student`, so a user with both gets `teacher`.

A user with no recognisable role passes `roleAllowed()` — because the routes they are allowed
carry the `noroles` tag — but `getAccess()` then throws. In practice `norole` users can reach
`PATCH /users`, `PATCH /users/{username}` and `GET /users/me` and nothing else.

## Capability flags

`getAccess(req.user.sql)` (`src/controlers/users/user.helper.ts`) is called at the top of
almost every controller and returns:

| Role | `allocated` | `is_admin` | `canImpersonate` |
| --- | --- | --- | --- |
| `administrator` | false | true | true |
| `garbagecollector` | false | true | false |
| `lrsmanager` | true | false | true |
| `teacher` | false | false | false |
| `student` | true | false | false |

- `allocated: true` → the caller is participant shaped. Services ignore any user id in the
  request and scope everything to the caller. Management endpoints reject them outright.
- `is_admin: true` → bypasses the "only my own data" filters, including the
  `AND (deletedAt IS NULL OR :is_admin IS TRUE)` clauses in the SQL views. **It is not an
  authorization flag**: the route matrix is what stops a `garbagecollector` from writing.
- `canImpersonate: true` → may read another participant's data by id, used by the unscoped
  `/admin/lrs/statements` endpoints.

## Object level permissions

Roles decide *which endpoints* you may call. Permissions decide *which objects* those endpoints
may return to you. Both must pass.

- Levels: `FULL` and `WRITE`, uppercase.
- Permission on a simlet is inherited by its sessions and activities, reported as
  `permission_type: "INDIRECT"`.
- The creator of a simlet gets a synthetic `FULL` on the sessions they created.

Full detail in [how-to: grant and revoke permissions](../how-to/grant-and-revoke-permissions.md).

## Getting a token

### With Keycloak (normal case)

Authorization code flow against your realm. The client id, secret and callback are declared in
`api.yaml` under `components.securitySchemes.OAuth2.0`, with the `x-client-id`,
`x-client-secret` and `x-callback-url` vendor extensions. Use a real client:

```bash
curl -s -X POST "$SSO_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'grant_type=password&client_id=simva&username=teacher&password=secret'
```

### With the device flow

For devices that cannot keep a client secret — a browser game. SIMVA proxies the flow so the
secret never reaches the client:

```bash
curl -s -X POST "$SIMVA_URL/auth2/$ACTIVITY_ID/device" -H "Content-Type: application/json" | jq
# { device_code, user_code, verification_uri, verification_uri_complete, interval, expires_in }

curl -s -X POST "$SIMVA_URL/auth2/$ACTIVITY_ID/token" \
  -H "Content-Type: application/json" -d '{"device_code": "..."}' | jq
# 400 { "error": "authorization_pending" }  -> keep polling after `interval` seconds
# 200 { access_token, refresh_token, ... }
```

`verification_uri` is rewritten by SIMVA to point at its own device screen, not at Keycloak's.

Refresh:

```bash
curl -s -X POST "$SIMVA_URL/auth2/$ACTIVITY_ID/token" \
  -H "Content-Type: application/json" \
  -d '{"grant_type": "refresh_token", "refresh_token": "..."}' | jq
```

The Keycloak client is selected from the activity's tracker technology: `uAdventure` uses
`SSO_UADVENTURE_CLIENT_ID`, everything else `SSO_PLUGIN_CLIENT_ID`.

### With a participant token

Participants created with `isToken: true` have no account. SIMVA mints an internal JWT for
their token string:

```bash
curl -s "$SIMVA_URL/activities/$ACTIVITY_ID/target?token=ana-ruiz-1234" | jq
```

Which SSO mode a game gets is chosen by `SSO_AUTH_METHOD`; see
[how-to: create a gameplay activity](../how-to/create-a-gameplay-activity.md).

## CORS

Allowed request headers: `Content-Type`, `Authorization`, `X-Experience-API-Version`. The last
one exists so a game can negotiate the xAPI version it speaks.

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`. **PATCH is not in the list** —
configure `CORS_ALLOWED_ORIGINS` carefully or browser clients will fail preflight on every
`PATCH` endpoint.

Allowed origins are computed dynamically, not from a static list: every origin parsed out of
the `game_url` of any `GamePlay_Activities` row, unioned with `CORS_ALLOWED_ORIGINS`, cached
for one minute. That is what lets a self-hosted game on a new domain work without a
deployment. Requests with no `Origin` header — curl, server to server — are always allowed.