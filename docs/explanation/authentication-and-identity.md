# Authentication and identity

## The shape of the current system

SIMVA does not have users. It has *identities it mirrors*. Keycloak owns authentication and
the role assignment; SIMVA keeps a row so that "this user id" is a stable integer it can put
in foreign keys.

```
Keycloak  ──JWT──▶  validateJWT()   verify, decode, check exp
                        │
                        ▼
                   createOrUpdateKeycloakUser()
                        │   find by username
                        │   update email / role if they drifted
                        │   create if absent
                        ▼
                    req.user.sql  ── the role the server authorizes with
```

Two consequences fall straight out of that:

1. **The role used for authorization is the stored role**, not the role in the token.
   `createOrUpdateKeycloakUser` resynchronises it on every request, so the two agree — but the
   database is what `roleAllowed()` compares against.
2. **A Keycloak outage does not stop SIMVA reading existing users**, as long as tokens still
   verify. Only new logins and role changes need the admin client.

## How it got here

| Period | State |
| --- | --- |
| 2019-11 | `bcrypt` + locally issued JWT (`e93f9e3`) — SIMVA owns passwords |
| 2020-04 | `KeycloakKeyManager` appears (`565ae9a`) — SIMVA can verify external tokens, but still issues its own |
| 2024-02/03 | Full SSO: ~40 commits on a `keycloak` branch. `bcrypt` still present |
| 2026-01 | `bcrypt` **removed** in the TypeScript rewrite (`f7465e0`) — Keycloak is now the only source of identity |
| 2026-05 | JWKS verification rewritten with `jwk-to-pem` (`205d0ac`) |
| 2026-08 → 09 | OAuth2 device authorization flow, four iterations |

The 2019 decision — SIMVA hashes passwords — was fully reversed about six years later. The
reasoning is visible in `f7465e0`: the rewrite removed `bcrypt`, `mongoose`, `swagger-mongoose`
and `express-body-schema` in a single commit of roughly 9,500 changed lines. In an institution
with a Keycloak, a second source of credential truth is a liability, not a feature.

## Key verification

```ts
// src/services/users/user.auth.service.ts
if (issuer === keycloakRealmUrl) {
  if (header.kid) {
    const publicKey = await keyManager.getKey(header.kid);
    try { return jwt.verify(token, publicKey); }
    catch (e) { resolve(jwtPayload); }     // <-- verification failure is not fatal
  }
}
```

The last line is the most important line in authentication, and it is not obvious from
reading it: **a Keycloak token with an unverifiable signature is accepted anyway**, with the
decoded payload.

The checks that *are* enforced: `exp` in the future, and the presence of
`preferred_username || username || sub` plus an `email`. The internal-issuer branch, by
contrast, does fail closed — `jwt.verify(token, config.sso.jwt_secret, { issuer })` — because
the secret is shared.

Practical consequence: **do not treat a successful API call as proof of a valid signature.**
Anyone who can mint an arbitrary JWT with the right shape and issuer passes.

## JWKS and `jwk-to-pem`

`205d0ac` replaced a `keycloak-public-key` fork with `jwk-to-pem` and gave the cache an
explicit empty-key error path:

```ts
if (!privateKey || privateKey.trim() === '') {
  reject(new Error('No public key available for JWT verification'));
}
```

That commit also added `this.clearCache()` on **every** `getKey()`, with the comment
"Force clear cache before every getKey (for debugging)". The cache has therefore never hit in
production since May 2026 — every request fetches and converts the JWKS. It works; it is
unnecessary load on the Keycloak instance.

The class docstring still reads "Adapted from simva project for pumva TypeScript
implementation", which tells you the TypeScript layer was ported from a sibling project rather
than evolved from the JavaScript one.

## Roles

`getRoleFromKeycloakJWT()` is a strict priority chain over `realm_access.roles`:

```ts
administrator      -> administrator
garbagecollector   -> garbagecollector
lrsmanager         -> lrsmanager
teacher, researcher-> teacher
teaching-assistant, student -> student
(none)             -> norole
```

`teacher` before `student` is a deliberate choice: a researcher who also teaches should be
able to create studies.

Each mapping can be disabled with an `SSO_*_ALLOWED_ROLE` variable, so an institution that
does not use `teaching-assistant` can turn that arm off without a code change.

## Two service accounts

`lrsmanager` (2025-05-30, `38cfa68`) and `garbagecollector` (2026-09-29, `d5f9b14`) are not
people. Both were added to serve a background job.

`lrsmanager` is participant-shaped (`allocated: true`) but may impersonate: it can read another
user's data through the unscoped `/admin/lrs/statements` endpoints.

`garbagecollector` gets `is_admin: true`, and the code says why, and also says what that is
not:

```ts
case "garbagecollector":
  // Read only service account (trace allocator / garbage collector).
  // is_admin is used to bypass "only own data" filters on read endpoints; it is not an
  // authorization flag, since every mutating route rejects this role in the OpenAPI RBAC matrix.
  return { allocated: false, is_admin: true, currentUserId: ..., canImpersonate: false };
```

The safety property lives entirely in `api.yaml`. There is no code that says "garbagecollector
cannot write"; it is true because 29 read operations carry the tag and no write operation
does. Change a tag and the service account gains write access. That is the sharpest edge in
the current design, and it is documented precisely because it is invisible.

## The device flow

Games cannot keep a client secret. The OAuth2 device authorization grant (RFC 8628) solves
this, and SIMVA proxies it so the secret stays server side:

```
game ──POST /auth2/{id}/device──▶ SIMVA ──▶ Keycloak
     ◀── device_code, user_code, verification_uri ──

     (user enters the code at SIMVA's own screen, which proxies to Keycloak)

game ──POST /auth2/{id}/token──▶ SIMVA ──▶ Keycloak
     ◀── 400 authorization_pending ... then access_token
```

SIMVA **rewrites `verification_uri`** to point at `${EXTERNAL_URL}/scheduler/{simletId}/device`
rather than at Keycloak, so the branding and the copy are SIMVA's.

This went through four iterations in three weeks:

```
8ebe2c7  2026-08-19  adding oauth via device
4c2e092  2026-09-04  fix oauth2 2 modes          (+76/-27; a stray semicolon had orphaned the device params)
e452e23  2026-09-09  fix oauth mode device       (deletes the oauth_login_mode migration)
7aff131  2026-09-09  adding oauth2 device mode from simva   (extracts controller/service/router)
```

## Per-activity mode → process-wide flag

The interesting part of that history is a reversal:

`c729779` (2026-09-03) added an `oauth_login_mode` **column** to `GamePlay_Activities`, with a
migration, so each activity could choose its SSO mode. Six days later `e452e23` **deleted the
migration and the column**, moving the choice to `SSO_AUTH_METHOD`, an environment variable.

A per-activity decision was downgraded to a deployment-wide one. The likely reason is that a
deployment quickly needs the games to behave identically — mixing modes in one study produces
support problems that outweigh the flexibility. The code still carries the evidence:

```ts
config.sso.authMethod = process.env.SSO_AUTH_METHOD || "simva_device_oauth2" //"token_oauth2"
```

A commented-out ternary. **The decision is not closed.** Two modes are fully implemented
(`simva_device_oauth2`, `token_oauth2`) with a third (`device_oauth2`) pointed straight at
Keycloak, and tracker-config generation branches three ways in
`GameplayActivity.getTrackerConfig()` and `target()`.

## Practical guidance

- Rotate `SSO_JWT_SECRET` away from its default; it can mint a token for any user.
- Treat a token that passes `exp` and shape checks as *probably* legitimate, not proven.
- Before debugging a role problem, read `req.user.sql.role` from the database — that is the
  value that decided the outcome.
- When a game cannot authenticate, check `SSO_AUTH_METHOD` and the activity's
  `game_tracker_technology` first; that pair selects the client id and the config shape.

## Related

- [ADR-0006 — Keycloak as the identity provider](./decisions/0006-keycloak-as-the-identity-provider.md)
- [ADR-0007 — OAuth2 device authorization flow](./decisions/0007-oauth2-device-authorization-flow.md)
- [Authentication reference](../reference/authentication.md)
- [Permissions](./permissions.md)