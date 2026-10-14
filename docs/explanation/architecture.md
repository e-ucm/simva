# Architecture

## The request path

Every request crosses the same chain, assembled in `src/app.ts`:

```ts
app.use(express.json({ limit: '50mb' }))
app.use(cors({ origin: dynamicCorsOrigin, ... }))
app.use(requestLogger)

app.use('/auth2', auth2Routes)      // public, mounted before auth

app.use(auth)                       // verify JWT, resolve user
app.use(roleAllowed)                // may this role call this route?
app.use(OpenApiValidator.middleware({ apiSpec: `${config.appFolder}/api.yaml`,
                                      validateRequests: true, validateResponses: true }))

app.post('/limesurvey-completion-webhooks', verifyHookdeckSignature, limesurveyWebhookHandler)
app.get('/health', ...)
app.get('/version', ...)

app.use('/users', userRoutes)
app.use('/simlets', simletRoutes)
// ...
app.use(errorMiddleware)
```

Three things about this ordering are load bearing:

1. **`/auth2` is mounted before `auth`.** The OAuth2 device flow has to be reachable by a
   client that has no SIMVA token yet — that is the entire point of a device flow. The
   compromise is that `Authenticator.isPublicEndpoint()` then lists `/auth2` as public by
   prefix.
2. **Role checking runs before validation.** A request from a role that is not allowed on a
   route gets 401 without the body ever being validated, so an unauthorised caller cannot
   probe the schema.
3. **Response validation is on.** A handler that produces a shape the contract does not
   describe does not return that shape — the request fails with 500. This is the mechanism
   that keeps `api.yaml` honest, and also the reason adding a response field is a two-file
   change.

## The layers

```
src/routes/**       URL shape only. No logic.
src/controlers/**   HTTP in, HTTP out. Parses params, calls getAccess(), delegates.
src/services/**     Use cases. Authorization refusals, validation, orchestration.
src/lib/mappers/**  Domain objects. Permissions, state machines, persistence.
src/lib/views/**    Query templates (raw SQL with typed parameters).
src/lib/models/**   Sequelize table definitions.
src/lib/utils/**    Clients for everything external.
```

The layer boundaries are real and worth preserving:

- **Routes never branch.** A route file registers a handler on a path. All the reasoning is
  downstream.
- **Controllers never query the database.** They translate HTTP to a service call and back.
  They do compute the access flags, because that is inherently a property of the request.
- **Mappers never build HTTP responses.** They throw `AuthentificationError`,
  `ValidationError`, `NotFoundError`, and the error middleware turns those into status codes.
- **No ad hoc SQL above the view layer.** Complex reads are query templates with declared
  parameter types, executed by `runViewQuery()` with Sequelize `replacements`.

## Why the layers exist

The layering is not decoration; each split corresponds to a change that actually happened.

**Services split out of controllers** in `afb8925` (2026-03-04): `simlet.controler.ts` lost
548 lines and `simlet.service.ts` lost 661, and six new service/controller/route triplets
appeared for sessions, session activities, session permissions, simlet groups, simlet
permissions and the allocator. The trigger was that simlets had grown sub-resources and a
single controller could no longer be reviewed in one sitting.

**Mappers split out of models** in `b4c8c8c` and `f39064f` (2026-02-11/13): `src/lib/classes`
became `src/lib/mappers`, and nine "fat" Sequelize models were deleted outright — 3,232 lines
— leaving thin table definitions. The trigger was that business rules (who may edit this
simlet? is this activity openable?) had ended up inside model files, making both the rules and
the persistence harder to test.

**Query templates split out of mappers** in `cddf34f` (2026-01-22) and grew through 2026. The
trigger was that a simlet listing with permissions, tags, sessions and groups is not
expressible as a Sequelize `include` graph without becoming unreadable. So the reads became
SQL views plus templates.

The cumulative effect is visible in the history: because every feature ends in
`migrate/sqlite/02-views.sql`, that one file is the bottleneck of the architecture. Soft
delete, tag visibility, indirect permissions, sandbox filtering and session permissions all
required editing it, and `2f5d86e` shows one fix there spreading across six query template
files.

## Where state lives, and where it does not

The layering also hides a deliberate split in *where data lives*:

| Kind | Store | Access path |
| --- | --- | --- |
| Study structure and completion state | SQLite | mappers → views |
| xAPI statements | an LRS | `LRSClient` → `xasu-js` |
| Result files and tracker state | S3-compatible object storage | `minioClient` presigned URLs |
| Survey answers | LimeSurvey | `limeSurveyClient`, cached locally |
| Identities | Keycloak | admin client, JWKS |

Only the first is a database SIMVA owns. Everything else is a proxy in front of a system
someone else runs, which is why so much of the code is URL construction, signing and
translation. See [object storage and traces](./object-storage-and-traces.md) and
[LRS integration](./lrs-integration.md).

## The extension point

Activities and allocators are polymorphic, and the polymorphism is the domain's main
extension mechanism. An activity's type selects a class through `ActivityToClass`, and that
class decides the target URL, the tracker config, the result storage and how statements are
interpreted. Adding a type is how you add an integration; see
[activity and allocator types](./activity-and-allocator-types.md).

## Boot sequence

`src/server.ts`:

1. construct the logger and the Sequelize connection (`src/lib/db.ts`),
2. `runMigrations()` — umzug over `src/lib/migrations/*.ts`,
3. `runSqlFile(config.db.table_file_path)` — `migrate/sqlite/01-schemas.sql`,
4. `runSqlFile(config.db.view_complete_path)` — `migrate/sqlite/02-views.sql`,
5. start listening.

Steps 3 and 4 use `IF NOT EXISTS` throughout, which is why restarting is safe and why a fresh
database is created from scratch on a clean checkout. `runSqlFile` strips comments and splits
on `;`, so it is a splitter, not a SQL client.

## Related

- [API contract is also the authorization matrix](./api-contract-and-authorization.md)
- [Persistence: SQLite and SQL views](./persistence-sqlite-and-views.md)
- [decisions/](./decisions/README.md)