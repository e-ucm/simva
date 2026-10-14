# Object storage and traces

## What is not in the database

| Data | Size per study | Store |
| --- | --- | --- |
| xAPI statements | thousands to millions | the LRS |
| Result files | megabytes each | object storage |
| Tracker state | small but continuous | object storage |
| Survey answers | medium | LimeSurvey, cached in object storage |
| Study structure, completion state | tiny | SQLite |

A study with fifty participants playing a serious game for an hour produces on the order of
hundreds of thousands of statements. SQLite is a good fit for the other five rows of that
table and a terrible fit for the first one.

## Why presigned URLs rather than an API

`GET /activities/{activityid}/result` does not return file content. It returns a map of
participant id to a time-limited signed URL:

```json
{ "results": { "555": "http://rustfs.internal:9000/traces/backup/900/555.result?X-Amz-Signature=..." } }
```

The alternatives were:

- **Proxy the bytes through SIMVA.** Simple, and wrong: every result download becomes an
  Express request holding a response buffer, and one slow client holds a connection.
- **Expose static file serving.** Means the storage is behind the API's network boundary,
  which it is not — it is a separate service.
- **Signed URLs.** SIMVA authorises the read, then gets out of the data path. The client
  fetches from storage directly, with the lifetime under SIMVA's control.

The lifetime is `MINIO_PRESIGNED_URL_FILE_EXPIRATION_TIME`, one hour by default. This is also
why `GET /activities/{id}/export` and `GET /simlets/{id}/export` are manifests: structure plus
links, not archives. The export is a handoff with a time window, not a backup.

## The history of getting there

| Date | Commit | What |
| --- | --- | --- |
| 2020-03-04 | `bc9e794` | `MinioActivity` stores xAPI statements into MinIO through Kafka — the origin of the pipeline |
| 2020-03-24 | `e83290f` | `RageMinioActivity` merges analytics and storage activities |
| 2023-11-07 | `a0e78ab`, `b7e7c44` | the `minio` dependency is removed and re-added within hours |
| 2024-05-07 | `91a603d` | a bloom filter, "to be sure to not have duplicated traceid" |
| 2024-09-06 | `10e07ca` | presigned URLs become the access model (+602/−186) |
| 2026-02-19 | `1c7fb0a`, `1887c95` | TypeScript storage client; `Activity.ts` shrinks by 184 lines |
| 2026-02-25 | `f35d050`, `5ace2ea` | MongoDB trace and backup data migrated into storage |
| 2026-09-28 | `820986a`, `0d7ca11` | MinIO → RustFS, behind a feature flag |

## Kafka sits in the trace path

Statements do not go straight to the LRS. `LRSClient.setStatement()` publishes to Kafka first
and sends to the LRS second:

```ts
// src/lib/utils/LRSclient.ts
setStatement(statement) {
  await this.sendTracesToKafka([statement]);
  await this.sendTracesToLRS([statement]);
}
```

The reason is durability under load. A game flushing a burst of traces should not have its
completion blocked by LRS latency, and a brief LRS outage should not lose the burst. Kafka is
the buffer.

Two topics exist and they are not the same:

| Config | Default | Carries |
| --- | --- | --- |
| `config.kafka.topic` (= `MINIO_TRACES_TOPIC`) | `traces` | xAPI statements |
| `config.kafkaEvent.topic` | `simva_events_topic` | LimeSurvey completions and other events |

Mixing them up was a real bug (`3342e82`).

## Bloom filters for statement ids

Every statement needs a stable, globally unique id. When a game does not supply one, SIMVA
generates it — and must not generate the same one twice.

```ts
generateStatementId(): string {
  let id: string;
  do {
    id = randomUUID();
  } while (this.filter.has(id));
  return id;
}
```

The filter is a `ScalableBloomFilter` persisted to `BLOOM_FILTER_BACKUP_PATH`, flushed on
`beforeExit`. A bloom filter answers "definitely not present" cheaply; a false positive would
mean regenerating an id that was fine, which is why the loop rather than a single check.

The persistence matters because the LRS deduplicates by statement id. Regenerating an id the
LRS has already seen silently drops the new statement.

## MinIO → RustFS: a flag, not a migration

```
820986a  2026-09-28  enhance MinIO configuration to support RustFS integration
                    src/lib/config.ts  +20/-6
0d7ca11  2026-09-29  update rustfs client
                    src/lib/utils/minioclient.ts  +305/-109
```

RustFS is an S3-compatible object store written in Rust. Swapping provider did not need to
touch any call site, because `minioclient.ts` is a thin wrapper over the AWS S3 SDK and both
servers speak the same protocol. The whole vendor change is a ternary cascade in the config:

```ts
config.minio.rustfs_enabled = process.env.RUSTFS_ENABLED !== 'false';
config.minio.url   = config.minio.rustfs_enabled ? config.minio.rustfs_url   : config.minio.minio_url;
config.minio.apiUrl= config.minio.rustfs_enabled ? config.minio.rustfs_api_url: config.minio.minio_apiUrl;
// ... and so on for ssl, port, accessKey, secretKey
```

The file kept its `minio` name, which is now misleading.

## The internal URL subtlety

```
config.minio.internalUrl = config.minio.rustfs_enabled
  ? process.env.RUSTFS_INTERNAL_URL : process.env.MINIO_INTERNAL_URL;
if (!config.minio.internalUrl) config.minio.internalUrl = config.minio.apiUrl;
```

The comment explains why it exists:

> Inside the container network the external hostnames resolve to the load balancer loopback
> address, so the object storage service is reached through its internal service name.

Two different hostnames are needed for the same bucket: the **external** one goes into
presigned URLs handed to browsers, the **internal** one is used by the server itself. Generating
presigned URLs against the internal name produces links that no browser can resolve; signing
against the external name works but makes every server-side fetch go out through the load
balancer.

This is a genuinely non-obvious thing about running object storage behind an ingress, and it is
the kind of detail that belongs in a reference page.

## Results: two very different paths

| | Traces | Results |
| --- | --- | --- |
| Written by | the game, via `/lrs/statements` | the game or LimeSurvey, via `/activities/{id}/result` |
| Stored in | the LRS | object storage, `backup/{activity_id}/{user_id}.result` |
| Read via | `/lrs/statements` | presigned URLs from `/result` |
| Tested with | `game_backup`, `survey_lrsset` | same flags |

Gameplay activities reject `full` and `code` result types unless `game_backup` is on: a game
that streams xAPI does not need its own result file, and doubling storage for the same data is
waste.

## Related

- [ADR-0008 — object storage for traces and results](./decisions/0008-object-storage-for-traces-and-results.md)
- [ADR-0009 — RustFS behind a runtime flag](./decisions/0009-rustfs-as-an-alternative-to-minio.md)
- [LRS integration](./lrs-integration.md)
- [How-to: fetch results](../how-to/fetch-results.md)