# Configuration reference

Everything is read from the environment in `src/lib/config.ts`, which builds one exported
`config` object at import time. Every setting has a development default, so the server starts
with no environment at all — which means a missing variable looks like a working deployment
pointing at `*.external.test`.

## Core

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_FOLDER` | `process.cwd()` | Root used to resolve `api.yaml` and the SQL files |
| `NODE_ENV` | `development` | `test` switches the database to `:memory:` |
| `DEBUG` | `false` | Debug flag |
| `EXTERNAL_URL` | `https://external.test` | Base of the IRIs SIMVA stamps into xAPI statements |
| `SIMVA_API_HOST` | `simva.external.test` | Public host name |
| `SIMVA_API_PORT` | `3000` | Listen port |
| `SIMVA_API_EXTERNAL_PORT` | `443` | Port used when building `config.api.url`; 80/443/8080 are omitted |
| `SIMVA_API_PROTOCOL` | `https` | `http` or `https` |
| `NODE_EXTRA_CA_CERTS` | `/var/lib/simva/tls/ca/rootCA.pem` | CA bundle for private Keycloak deployments |
| `SIMVA_STORAGE_PATH` | `/storage/` | Local path used by the MinIO backfill migration |

`config.api.url` is derived from host + external port, and is what appears in every activity
IRI the LRS knows.

## Logging

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOG_LEVEL` | `debug` | pino level |
| `LOG_FOLDER` | `$APP_FOLDER/../../logs` | Log directory |
| `PROCESS_TAG` | `simva-api` | Tag included in every log line |

`debug` is extremely chatty — the auth middleware logs the derived route tree, every token
check and every role decision at debug level.

## Database

| Variable | Default | Purpose |
| --- | --- | --- |
| `SQLLITE_DB_PATH` | `/data/db` | Directory of the SQLite file |
| `SQLLITE_DB_FILE` | `simva_data.db` | Filename |
| `SQL_TABLE_FILE` | `migrate/sqlite/01-schemas.sql` | Table DDL, run on boot |
| `SQL_VIEW_FILE` | `migrate/sqlite/02-views.sql` | View DDL, run on boot |

## SSO / Keycloak

| Variable | Default | Purpose |
| --- | --- | --- |
| `SSO_ENABLED` | `true` | Set to `false` to bypass all Keycloak interaction |
| `SSO_HOST` / `SSO_PROTOCOL` / `SSO_PORT` | `sso.external.test`, `https`, `443` | Realm base URL |
| `SSO_REALM` | `simva` | Realm name |
| `SSO_CLIENT_ID` / `SSO_CLIENT_SECRET` | `simva`, `secret` | SIMVA's own client |
| `SSO_PUBLIC_CLIENT` | `false` | Whether SIMVA registers as a public client |
| `SSO_ADMIN_USER` / `SSO_ADMIN_PASSWORD` | `administrator` | Admin client credentials |
| `SSO_PLUGIN_CLIENT_ID` | `simva-plugin` | Client used by games that are not uAdventure |
| `SSO_UADVENTURE_CLIENT_ID` | `uadventure` | Client used by uAdventure games |
| `SSO_AUTH_METHOD` | `simva_device_oauth2` | `simva_device_oauth2`, `device_oauth2` or `token_oauth2` |
| `SSO_WEBHOOK_SUBURL` | `/sso-events` | Path of the webhook SIMVA registers with Keycloak |
| `SSO_SSL_REQUIRED` | `external` | Passed to the Keycloak admin client |
| `SSO_JWT_ISSUER` | `simva` | Issuer of internally minted tokens |
| `SSO_JWT_SECRET` | `s3cret` | HMAC secret for those tokens |
| `SSO_JWT_EXPIRES_IN` | `24h` | Their lifetime |
| `SSO_STUDENT_ALLOWED_ROLE` | `true` | Which realm roles map to `student` |
| `SSO_TEACHING_ASSISTANT_ALLOWED_ROLE` | `true` | …to `teaching-assistant` |
| `SSO_TEACHER_ALLOWED_ROLE` | `true` | …to `teacher` |
| `SSO_RESEARCHER_ALLOWED_ROLE` | `true` | …to `researcher` |

Derived, not set directly: `SSO_URL`, `SSO_OPENID_URL`, `SSO_TOKEN_URL`,
`SSO_DEVICE_AUTH_URL`, `SSO_AUTH_URL`.

The four `*_ALLOWED_ROLE` variables exist so an institution that does not use one of the role
names can turn that mapping off without a code change.

## LRS

| Variable | Default | Purpose |
| --- | --- | --- |
| `LRS_ENDPOINT` | *(unset)* | **LRS integration is off when this is unset** |
| `LRS_API_KEY_DEFAULT` / `LRS_API_SECRET_DEFAULT` | `my_api_key` / `my_api_secret` | OAuth1 credentials |

## Object storage (RustFS by default, MinIO otherwise)

| Variable | Default | Purpose |
| --- | --- | --- |
| `RUSTFS_ENABLED` | `true` | Set to `false` to use the `MINIO_*` variables instead |
| `RUSTFS_URL` / `RUSTFS_API_URL` | `https://rustfs.external.test` | Browser-facing and server-facing endpoints |
| `RUSTFS_INTERNAL_URL` | *(falls back to `RUSTFS_API_URL`)* | In-network endpoint used by the server |
| `RUSTFS_SSL` / `RUSTFS_PORT` | `true`, `443` | TLS and port |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | `rustfs` / `secret` | Credentials |
| `MINIO_URL` / `MINIO_API_URL` / `MINIO_INTERNAL_URL` | `https://minio.external.test/` | MinIO equivalents |
| `MINIO_SSL` / `MINIO_PORT` | `true`, `443` | |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | `minio` / `secret` | |
| `MINIO_BUCKET` | `traces` | Bucket name |
| `MINIO_BACKUP_DIR` | `backup` | Prefix for result files |
| `MINIO_STATE_DIR` | `state` | Prefix for tracker state |
| `MINIO_OUTPUTS_DIR` | `outputs` | Prefix for game outputs |
| `MINIO_TRACES_TOPIC` | `traces` | Trace topic, also `config.kafka.topic` |
| `MINIO_TRACES_FILE` | `traces.json` | Trace file name |
| `MINIO_TOPICS_DIR` | `kafka-topics` | Prefix for per-topic trace files |
| `MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME` | `1h` | Lifetime of result links |

`MINIO_INTERNAL_URL` exists because inside the container network the public hostnames resolve
to a load balancer loopback address; the server reaches storage through the in-network service
name instead. Without it, every presigned URL is generated against the wrong host.

The same variables are read for RustFS, so a RustFS deployment still sets `MINIO_BUCKET`,
`MINIO_BACKUP_DIR` and friends — only the connection details come from the `RUSTFS_*` group.

## Kafka

| Variable | Default | Purpose |
| --- | --- | --- |
| `KAFKA_HOST` / `KAFKA_PORT` | `kafka1.internal.test`, `9092` | Used when `KAFKA_BROKERS` is unset |
| `KAFKA_BROKERS` | *(derived from host/port)* | Full broker list |
| `KAFKA_GROUP_ID` / `KAFKA_CLIENT_ID` | `simva-group`, `simva-client` | Trace consumer identity |
| `KAFKA_SIMVA_EVENTS_TOPIC` | `simva_events_topic` | Webhook / completion events |
| `KAFKA_SIMVA_EVENTS_GROUP_ID` | `simva-events-group` | |
| `KAFKA_SIMVA_EVENTS_CLIENT_ID` | `simva-event-client` | |

## LimeSurvey

| Variable | Default | Purpose |
| --- | --- | --- |
| `LIMESURVEY_HOST` / `LIMESURVEY_PROTOCOL` / `LIMESURVEY_PORT` | `limesurvey.external.test`, `https`, `443` | Base URL |
| `LIMESURVEY_ADMIN_USER` / `LIMESURVEY_ADMIN_PASSWORD` | `admin`, `secret` | Remote control API credentials |
| `LIMESURVEY_SECRET` | `secret` | Shared secret for the completion webhook |
| `LIMESURVEY_HEADER_NAME` | `X-Signature-SHA256` | Header carrying the signature |
| `LIMESURVEY_HEADER_PREFIX` | *(empty)* | Prefix stripped before comparing |
| `LIMESURVEY_USE_NEW_VERSION` | `false` | LimeSurvey 5 vs legacy administration URLs |
| `LIMESURVEY_VERSION_NUMBER` | `5` | Advertised version |

## Shlink

| Variable | Default | Purpose |
| --- | --- | --- |
| `SHLINK_SERVER_HOST` / `SHLINK_PROTOCOL` / `SHLINK_PORT` | `shlink.external.test`, `https`, `443` | |
| `SHLINK_SERVER_API_KEY` | `password` | |

## Other

| Variable | Default | Purpose |
| --- | --- | --- |
| `CORS_ALLOWED_ORIGINS` | *(empty)* | Comma separated origins, unioned with game URLs discovered in the database |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin`, `admin@external.test`, `password` | Bootstrap admin |
| `MAX_UPLOAD_FILE_SIZE` | `33554432` (32 MiB) | Upload ceiling |
| `BLOOM_FILTER_BACKUP_PATH` / `BLOOM_FILTER_BACKUP_FILE` | `../bloom-filter/`, `bloom-filter-backup.json` | Persisted statement-id filter |
| `LTI_PLATFORM_CLIENT_ID` / `LTI_PLATFORM_SIGNING_KEY` | `lti_platform`, `secret` | Present but unused: there is no LTI route |
| `KEYCLOAK_LOGGER_ACTIVE` | — | Enables the upstream Keycloak logger |
| `AWS_REGION`, `RUSTFS_REGION` | — | Read by the S3 client |

## Defaults that will bite you

1. **Every default hostname ends in `.external.test`.** A deployment with a missing variable
   starts cleanly and then fails to reach Keycloak, LimeSurvey, storage and Shlink.
2. **`LRS_ENDPOINT` being unset disables the LRS entirely**, without a warning. Traces posted
   to `/lrs/statements` return an empty array rather than an error.
3. **`SSO_JWT_SECRET` defaults to `s3cret`.** Any deployment that does not override it can
   mint a valid token for any user.
4. **`LIMESURVEY_USE_NEW_VERSION` is coerced with `Boolean(process.env...)`,** so setting it
   to the string `"false"` still yields `true`. Only leaving it unset works.