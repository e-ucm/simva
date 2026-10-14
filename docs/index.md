# SIMVA documentation

SIMVA (SIMple VAlidation, historically SurveyManager) is the HTTP API behind a research
platform for running studies that combine serious games with pre/post questionnaires and
records the resulting xAPI statements and results.

The documentation is organised with the [Diátaxis](https://diataxis.fr) method. The four
sections answer four different questions, and each one is written so it can be read on its
own:

| Section | Question it answers | Start here |
| --- | --- | --- |
| [Tutorials](./tutorials/) | *I am new here. Walk me through something that works.* | [Your first study](./tutorials/01-first-study.md) |
| [How-to guides](./how-to/) | *I know the domain. Do this specific task for me.* | [How-to index](./how-to/README.md) |
| [Reference](./reference/) | *What exactly does this endpoint/config/field accept?* | [API endpoint reference](./reference/api/index.md) |
| [Explanation](./explanation/) | *Why is it built this way? What were the trade-offs?* | [Architecture decisions](./explanation/decisions/README.md) |

Do not read them in order. Pick the question you have.

## The 30 second mental model

```
client ──JWT──▶ Express (src/app.ts)
                  ├─ auth        : verify token, resolve user      (src/middlewares/auth.middleware.ts)
                  ├─ roleAllowed : may this role call this route?   (role matrix read from api.yaml)
                  ├─ validator   : request/response vs api.yaml    (express-openapi-validator)
                  └─ router      : src/routes/**.ts
                       └─▶ controller : HTTP in, HTTP out          (src/controlers/**)
                            └─▶ service : use cases                 (src/services/**)
                                 └─▶ mapper : domain + permissions  (src/lib/mappers/**)
                                      ├─▶ SQL views  : complex reads (src/lib/views/**)
                                      ├─▶ Sequelize   : rows        (src/lib/models/**)
                                      └─▶ external    : Keycloak, LimeSurvey, LRS,
                                                          Kafka, S3/RustFS/MinIO
```

Vocabulary you will meet everywhere:

- **Simlet** — the study. Top level container (`SIMLETs` table, mounted at `/simlets`).
- **Session** — one test sitting inside a study (`Sessions`, `/simlets/{simletid}/sessions`).
- **Activity** — one step inside a session (`Activities`, `/activities/{activityid}`).
  Its behaviour comes from its *type*: `manual`, `limesurvey`, `gameplay`, `default`.
- **Simlet group** — a participant cohort inside a study (`ParticipantGroups`).
- **Allocator** — the strategy that decides which session a participant lands in.
- **Tag** — a free form label attached to simlets and sessions, permission scoped.
- **Tester** — a user standing in for the researcher while a session is being prepared;
  tester activity hits the LRS test URLs instead of production.

## Running it locally

```bash
npm install
npm run dev          # rebuilds the native sqlite3 binding, then tsx watch src/server.ts
```

The database file is created from `migrate/sqlite/01-schemas.sql` and
`migrate/sqlite/02-views.sql` on every boot, and forward migrations under
`src/lib/migrations` are applied by umzug. Configuration is environment driven with
development defaults baked in; see the [configuration reference](./reference/configuration.md).

## Generated documentation

| Command | Produces |
| --- | --- |
| `npm run update-docs` | `docs/reference/api/**` — endpoint reference, role matrix, spec-vs-implementation drift report |
| `npm run update-openapi` | `openapi.json` from `api.yaml` |
| `npm run updateQueryDocs` | `QUERY_DOCS.md` — every SQL view query template |
| `npm run validate-openapi` | Redocly lint of `api.yaml` |
| `npm run class-docs` | TypeDoc HTML for `src/lib` under `docs/typedoc` (not tracked) |
| `npm run check-docs` | all of the above, in order |

Everything under `docs/reference/api/` is generated and carries a "do not edit" banner plus the
commit it was generated from. Everything else is hand written.