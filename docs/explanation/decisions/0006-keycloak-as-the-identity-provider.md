# ADR-0006 — Keycloak owns identity; SIMVA mirrors it

- **Status:** Accepted, with a caveat
- **Date:** 2026-01-22 (the 2020–2024 groundwork is earlier)

## Context

SIMVA shipped its own identity system in 2019: `bcrypt` for passwords, `jsonwebtoken` for
sessions, a `/users/login` endpoint.

```
e93f9e3  2019-11-07  Added JWT and Bcrypt for auth and password management
                      package.json +2: bcrypt, jsonwebtoken
```

That was correct for a standalone tool. It became wrong for a tool deployed inside a
university: the institution already had identities, a password policy, MFA, account recovery
and offboarding. A second source of credential truth is a liability — SIMVA's copy would be
stale the moment a person changed their institutional password, and would keep working after
they left.

Keycloak integration arrived in 2020 (`565ae9a`, `KeycloakKeyManager`) but SIMVA kept issuing
its own tokens for years. Full SSO took over in a dedicated branch in 2024 — roughly 40
commits across two days — including `bcrypt` still in the dependency list.

## Decision

Keycloak owns authentication and role assignment. SIMVA mirrors the user.

```
f7465e0  2026-01-22  removes bcrypt, mongoose, swagger-mongoose, express-body-schema
```

The runtime flow:

```
JWT ─▶ validateJWT()          issuer decides the verification strategy
    ─▶ createOrUpdateKeycloakUser()
         find by username
         update email / role if drifted
         create if absent
    ─▶ req.user.sql            the role the server authorizes with
```

`getRoleFromKeycloakJWT()` maps realm roles to SIMVA roles in strict priority order:
`administrator`, then `garbagecollector`, `lrsmanager`, `teacher`/`researcher`,
`teaching-assistant`/`student`, else `norole`. Each mapping can be disabled with an
`SSO_*_ALLOWED_ROLE` environment variable.

## Consequences

**Positive**

- **One credential truth.** Offboarding is the identity provider's job; SIMVA has nothing to
  revoke.
- **No password storage at all**, and no breach surface for it.
- **Role changes take effect centrally.** The database role resynchronises on the next request.
- **The admin client is only needed for provisioning**, not for authentication, so a Keycloak
  outage does not stop SIMVA reading existing users as long as tokens still verify.

**The caveat: verification does not fail closed**

```ts
// src/services/users/user.auth.service.ts
if (issuer === keycloakRealmUrl && header.kid) {
  const publicKey = await keyManager.getKey(header.kid);
  try { return jwt.verify(token, publicKey); }
  catch (e) { resolve(jwtPayload); }      // <-- not fatal
}
```

**A Keycloak token whose signature does not verify is accepted anyway**, with the decoded
payload. What *is* enforced: `exp` in the future, and the presence of
`preferred_username || username || sub` plus an `email`.

The internal-issuer branch does fail closed, because the secret is shared
(`SSO_JWT_SECRET`, which defaults to `s3cret` and should be rotated).

**Positive consequences of central roles**

- **The role used for authorization is the stored role**, not the claim in the token, so a
  stale token cannot carry stale authority.
- **Mapping is configurable per institution**, without code changes, for institutions that do
  not use `teaching-assistant` or `researcher`.
- **New roles are cheap**: one entry in the priority chain plus a tag in `api.yaml`. See
  ADR-0015.

**Negative**

- **SIMVA cannot add a user without Keycloak.** The `/users` creation path is for token-based
  participants only.
- **`SSO_ENABLED=false` disables Keycloak entirely**, which is useful for tests and dangerous
  in production if the flag is set by accident.
- **`SSO_JWT_SECRET` has a shipped default.** Any deployment that does not override it can mint
  a token for any user.
- **The JWKS cache never hits.** `205d0ac` added `this.clearCache()` to every `getKey()`, with
  the comment "Force clear cache before every getKey (for debugging)". Since May 2026 every
  request fetches and converts the JWKS — unnecessary load on Keycloak.
- **The port is not obviously documented.** `KeycloakKeyManager`'s docstring reads "Adapted
  from simva project for pumva TypeScript implementation", evidence that the TypeScript layer
  was ported from a sibling project rather than evolved from the JavaScript one.

## Evidence

- `e93f9e3` (2019-11-07) — bcrypt and JWT
- `565ae9a` (2020-04-21) — `KeycloakKeyManager`
- `4887706` (2024-03-01) — full SSO
- `f7465e0` (2026-01-22) — bcrypt removed
- `205d0ac` (2026-05-15) — `jwk-to-pem`, explicit empty-key error
- `cc0527e` (2026-05-15) — realm roles in JWT handling

## Related

- [Authentication and identity](../authentication-and-identity.md)
- [Authentication reference](../../reference/authentication.md)
- [ADR-0007](./0007-oauth2-device-authorization-flow.md)
- [ADR-0015](./0015-service-account-roles.md)