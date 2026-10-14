# ADR-0008 — Object storage and an LRS for the large data

- **Status:** Accepted
- **Date:** 2020-03-04 (pipeline), 2024-09-06 (presigned URLs), 2026-02-25 (current shape)

## Context

SIMVA stores three kinds of data with very different profiles:

| Data | Volume | Shape |
| --- | --- | --- |
| Study structure, completion state | kilobytes to megabytes | relational, heavily joined |
| xAPI statements | hundreds of thousands per study | append-only, queried by context |
| Result files, tracker state | megabytes each | opaque blobs |

Pushing a game's statements and result files through a relational database is possible and
wrong: it inflates the smallest thing in the architecture, couples availability to the
metadata store, and makes retention a database operation.

The same conclusion had been reached once before for a different reason — analytics payloads
were already being diverted to object storage in 2020.

## Decision

SQLite holds the metadata. An LRS holds statements. S3-compatible object storage holds result
files and tracker state. Access to blobs is by **presigned URL**, never proxied.

```
bc9e794  2020-03-04  MinioActivity stores xAPI statements into minio through kafka
10e07ca  2024-09-06  get presigned url from minio  (+602/-186)
1887c95  2026-02-19  presigned URL handling consolidated; Activity.ts -184
254e8f3  2026-02-27  presigned URL generation across the activity mappers
f35d050  2026-02-25  migrate activity data from MongoDB to MinIO
5ace2ea  2026-02-25  migrate backup data to MinIO
```

## Consequences

**Positive**

- **Results never pass through Express.** SIMVA authorises the read, signs it, and gets out of
  the data path. One slow client cannot hold a connection or a response buffer.
- **Retention becomes a bucket policy**, not a SQL job.
- **The LRS can be swapped** without touching SIMVA's storage of state; it is a client behind
  `LRSClient`.
- **Availability is decoupled.** The LRS or object storage being down does not stop study
  management.
- **MongoDB data had somewhere to go.** The two 2026 migrations moved traces and backups out
  of documents into objects, which made dropping Mongo possible.

**Kafka sits in the trace path**

```ts
setStatement(statement) {
  await this.sendTracesToKafka([statement]);
  await this.sendTracesToLRS([statement]);
}
```

Kafka first, LRS second, so a burst of game telemetry is durable before the LRS is asked to
absorb it and a brief LRS outage does not lose the burst. Test URLs are skipped on the Kafka
path too, so rehearsals never enter the pipeline.

The cost is two topics that must not be confused — `traces` and `simva_events_topic` — and
they have been (`3342e82`).

**Bloom filters for statement ids**

A statement without an id gets one generated, and it must never collide with one already sent:

```ts
do { id = randomUUID(); } while (this.filter.has(id));
```

The filter is persisted, because the LRS deduplicates by id and a regenerated id is a silently
dropped statement. A bloom filter answers "definitely not present" cheaply enough to do this
on every statement; the false-positive case just regenerates.

**Presigned URLs everywhere, including exports**

`GET /activities/{id}/export` and `GET /simlets/{id}/export` produce a **manifest**: structure
plus links, not an archive of the payloads. That follows from the decision — SIMVA does not
proxy bytes — and it means an export is a handoff with a time window, not a backup. Anyone
receiving one still needs the links to be live.

**Negative**

- **Two different URL concepts.** A browser-facing external host and an in-network internal
  host for the same bucket, because presigned URLs must name the host the browser can reach
  while the server must reach the service by its internal name. `config.minio.internalUrl`
  exists solely for this and the comment above it explains why. Getting it wrong generates
  links no browser can resolve, or makes every server-side fetch traverse the load balancer.
- **Links expire**, default one hour, so clients must fetch immediately rather than store.
- **A result download is now two requests** instead of one, which changes every client's error
  handling.
- **`hasResults` and `getResults` hit object storage**, so they are the slowest state endpoints
  and fail differently from the SQLite ones.

**Decoupling has a cost:** if the storage credentials are wrong, `/result` fails while
`/progress` works, and that asymmetry is confusing the first time you meet it.

## Evidence

- `bc9e794` (2020-03-04) — the Kafka → MinIO pipeline
- `91a603d`, `154c788` (2024-05-07) — the bloom filter
- `10e07ca` (2024-09-06) — presigned URLs as the access model
- `1c7fb0a`, `1887c95` (2026-02-19) — the TypeScript storage client
- `f35d050`, `5ace2ea`, `68be34f` (2026-02-25 → 27) — the Mongo data migration
- `0144823` (2026-02-23) — bloom filter backup persistence
- `3342e82` (2026-05-13) — the Kafka topic mix-up

## Related

- [Object storage and traces](../object-storage-and-traces.md)
- [LRS integration](../lrs-integration.md)
- [ADR-0009](./0009-rustfs-as-an-alternative-to-minio.md)
- [How-to: fetch results](../../how-to/fetch-results.md)