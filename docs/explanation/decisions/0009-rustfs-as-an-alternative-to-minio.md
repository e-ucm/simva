# ADR-0009 — RustFS as an alternative to MinIO, behind a feature flag

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

SIMVA's object storage client is named `minioClient.ts` and historically used the `minio`
npm package. The dependency churn around it is visible:

| Date | Commit | What |
| --- | --- | --- |
| 2023-11-07 | `a0e78ab` | "Removed minio" |
| 2023-11-07 | `b7e7c44` | "Re added minio dependency" |
| 2023-11-12 | `f9bed81` | "Downgraded minio" |
| 2026-03-19 | `d551ee8` | "downgrade minio version to 8.0.1" — after being bumped to 8.0.7 the same day |

RustFS is an S3-compatible object store written in Rust. It speaks the same protocol, so the
question is only which SDK talks to it.

## Decision

Replace the MinIO SDK with `@aws-sdk/client-s3` (which speaks plain S3) and keep both
providers configurable, selected by a runtime flag rather than by a deployment.

```
820986a  2026-09-28  enhance MinIO configuration to support RustFS integration
                    src/lib/config.ts  +20/-6
                    RUSTFS_ENABLED, RUSTFS_URL, RUSTFS_API_URL, RUSTFS_SSL, RUSTFS_PORT,
                    RUSTFS_ACCESS_KEY, RUSTFS_SECRET_KEY added; existing keys renamed MINIO_*

0d7ca11  2026-09-29  update rustfs client
                    src/lib/utils/minioclient.ts  +305/-109
                    RUSTFS_INTERNAL_URL / MINIO_INTERNAL_URL added
```

Resolution is a ternary cascade at config load:

```ts
config.minio.rustfs_enabled = process.env.RUSTFS_ENABLED !== 'false';
config.minio.url     = config.minio.rustfs_enabled ? config.minio.rustfs_url     : config.minio.minio_url;
config.minio.apiUrl  = config.minio.rustfs_enabled ? config.minio.rustfs_api_url: config.minio.minio_apiUrl;
config.minio.ssl     = config.minio.rustfs_enabled ? config.minio.rustfs_ssl    : config.minio.minio_ssl;
// ... port, accessKey, secretKey
```

RustFS is the default; `RUSTFS_ENABLED=false` selects MinIO.

## Consequences

**Positive**

- **No call site changed.** Both servers speak S3, so the swap is entirely inside the config
  object and the client wrapper.
- **RustFS and MinIO coexist.** A deployment mid-migration, or a test environment on MinIO and
  production on RustFS, needs no second code path.
- **The AWS SDK is better maintained** than the abandoned `minio` package.
- **Bucket layout stays identical.** `MINIO_BUCKET`, `MINIO_BACKUP_DIR`, `MINIO_STATE_DIR`,
  `MINIO_OUTPUTS_DIR` are shared, so switching providers does not move any data.

**The internal URL**

```
config.minio.internalUrl = config.minio.rustfs_enabled
  ? process.env.RUSTFS_INTERNAL_URL : process.env.MINIO_INTERNAL_URL;
if (!config.minio.internalUrl) config.minio.internalUrl = config.minio.apiUrl;
```

> Inside the container network the external hostnames resolve to the load balancer loopback
> address, so the object storage service is reached through its internal service name.

Two hostnames for one bucket: the **external** one goes into presigned URLs handed to
browsers, the **internal** one is used by the server. This is a genuine consequence of running
object storage behind an ingress, and it is the kind of detail that is invisible until
presigned URLs start 403-ing.

**Negative**

- **The config object now has fourteen storage keys**, half of them a ternary cascade, for two
  servers that speak the same protocol.
- **The names lie.** `config.minio.*` and `minioclient.ts` are not MinIO. A RustFS deployment
  sets `MINIO_BUCKET` and `RUSTFS_ACCESS_KEY` in the same file.
- **The cascade is evaluated once at import time**, so a misconfigured deployment fails at
  startup rather than on first use — which is good — but the failure message names the wrong
  provider.
- **The `minio` dependency churn was not caused by the provider.** It was churn in the SDK.
  Choosing a protocol rather than a vendor would have avoided both this ADR and the four
  version fights above it.

## What this decision really is

The interesting part is that it is not a RustFS decision at all. It is the decision to depend
on the **S3 protocol** rather than on a vendor library. RustFS arrived and cost 325 lines in
`minioclient.ts` because the protocol boundary already existed by accident. Had the client
been written against `minio` in 2020 with no protocol seam, the same change would have been a
rewrite.

## Evidence

- `a0e78ab`, `b7e7c44`, `f9bed81`, `d551ee8` — the SDK churn
- `820986a` — the feature flag
- `0d7ca11` — the client and the internal URL
- `b10b8df` (2026-09-29) — "fix package json for rust update"

## Related

- [Object storage and traces](../object-storage-and-traces.md)
- [Configuration reference](../../reference/configuration.md)
- [ADR-0008](./0008-object-storage-for-traces-and-results.md)