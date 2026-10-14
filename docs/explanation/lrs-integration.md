# LRS integration

SIMVA is not a learning record store. It is a *shim* in front of one: it registers an activity
in the LRS, rewrites the statements it receives so they are attributable and queryable, and
forwards reads and writes. Understanding what it rewrites is the difference between being
surprised by the API and using it.

## The pieces

| Component | Role |
| --- | --- |
| `src/lib/utils/LRSclient.ts` | singleton; auth, statement ids, normalisation, transport |
| `xasu-js` | `LRSTracker` / `JSScormTracker` (previously imported as `js-tracker`) |
| `LRS_ENDPOINT`, `LRS_API_KEY_DEFAULT`, `LRS_API_SECRET_DEFAULT` | OAuth1 credentials |
| `src/lib/keycloakKeyManager.ts` | unrelated to the LRS; JWKS for JWT verification |

The LRS integration is **off when `LRS_ENDPOINT` is unset**, without a warning. Posting
statements then returns an empty array rather than an error, which is a confusing failure
mode if you did not know to set the variable.

## Why SIMVA rewrites statements

A browser game emits a statement that is correct and nearly useless: it names the game, and
the game has no idea which study, session or participant it belongs to. Three failures follow.

1. **No id.** The LRS requires one. The game may not supply a stable one.
2. **No context.** Two studies running the same game produce indistinguishable statements.
   "Which participants finished mission 3" is unanswerable.
3. **No attribution.** No authority account, no platform, no stored timestamp, so retention
   and provenance are unknown.

So SIMVA rewrites every statement it accepts.

## Statement normalisation

### Identity and metadata

```ts
updateMissingTraceElements(statement) {
  statement.id ??= this.generateStatementId();     // bloom-filtered
  statement.version = '1.0.3';
  statement.platform = config.externalUrl;
  statement.authority = { ... isParticipant ? 'participant' : 'mylrsmanager' };
  statement.stored = new Date();
}
```

### Context

This is the important part. Context activities are rewritten into `parent` and `grouping` IRIs
that point back at the study that received the statement:

| Available | `parent` | `grouping` |
| --- | --- | --- |
| simlet + session + activity | `/activities/{id}` | `/simlets/{s}/sessions/{ss}/activities/{a}` |
| simlet + session | `/simlets/{s}` | the session, and the simlet |
| neither | `/admin` | `/admin` |

Types come from `{externalUrl}/about#{simlet|session|activity}`, so the LRS knows what each
IRI refers to.

The payoff: after normalisation, a query for `context.grouping.id =
".../simlets/42/sessions/100"` returns exactly the traces of one session of one study, from
any game, with no cooperation from the game.

### Robustness

Two normalisations exist because real trackers send malformed payloads:

- **`normalizeContextActivities`** repairs clients that send `contextActivities` as an array
  rather than an object. An array silently drops string-keyed relations on serialisation, so
  the game believes it sent context and the LRS receives none.
- **`normalizeStatementsQuery`** parses the `agent` filter from a string and renames xAPI
  1.0.3 `actor` to the 2.0 `agent`. A comment in the code states the reason: the LRS only
  understands the xAPI 2.0 name.

`LRSClient.isIri()` is the absolute-IRI test. Non-IRI values are dropped, except in
`grouping`, where opaque group identifiers are legitimate.

These normalisations exist because the tracker library does not perform them. The dependency is
tracked under a SIMVA fork (`github:e-ucm/js-tracker`, then `github:e-ucm/xasu-js`) precisely
because the fixes have to live somewhere: `85ca196` "update js-tracker dependency to a
specific commit hash" is the same decision restated — the fork, not the upstream library, is
the contract.

## Reading statements back

```ts
getLRSStatements(query) {
  return this.tracker.getStatements({
    ...query,
    activity: this.getLRSActivityId(),
    related_activities: true,
    ascending: true,
  });
}
```

`GET /activities/{id}/lrs/statements` is a pass-through with those three forced. `?more=`
becomes the continuation token. Agents, profiles, activities, state, about and extensions are
forwarded to the tracker untouched.

## The test LRS

A researcher rehearsing a session is a tester. While you are set as the session's tester, the
activity is redirected to the LRS test URLs:

```bash
POST   /simlets/42/sessions/100/tester      # become the tester
GET    /activities/900/lrs_test_statements   # your rehearsal traces
DELETE /simlets/42/sessions/100/tester      # stop
```

`isCurrentUserParticipantAsTester()` decides which base URL to use. Test URLs are skipped by
the Kafka path as well, so rehearsal traffic does not enter the trace pipeline either.

This matters more than it looks. Researchers rehearsing in production used to produce data
that was indistinguishable from real data.

## Writing state from statements

`processStatementsForActivity()` interprets what arrives, so a game that speaks xAPI does not
have to call the completion endpoints at all:

| Verb | Effect |
| --- | --- |
| `initialized` | marks initialised |
| `progressed` | `result.score.scaled` for LimeSurvey, `.../extensions/progress` for gameplay, rounded to 6 decimals |
| `completed`, `terminated` | completes when `result.completion` is truthy |

Statements are matched on `object.definition.type` against the type's IRI — `assessment` for
LimeSurvey, `serious-game` for gameplay, disabled for manual.

Per-statement failures are logged and skipped, not fatal. A batch containing one bad statement
still processes the rest.

## The gate

```ts
canSendStatementsLRS(): boolean {
  if (!session.isActive()) return false;
  if (!session.datesAllow()) return false;
  if (!previousActivitiesComplete()) return false;
  if (alreadyCompleted && !activity_can_be_restarted) return false;
  return true;
}
```

If the gate fails, `POST /lrs/statements` returns `[]` with **no error**. That is the single
most confusing behaviour in the API: a game that reports "sent 200 statements" and gets `[]`
back is almost always blocked by the gate, not broken.

## The xAPI version wobble

```
608fa76  2026-07-30 14:33  fix xapi version to 2.0.0 if not present
                          LRSclient.ts:  withVersion("1.0.3") -> withVersion("2.0.0")
df34202  2026-07-30 15:21  revert previous change
                          LRSclient.ts:  withVersion("2.0.0") -> withVersion("1.0.3")
```

Made at 14:33, reverted at 15:21 the same day, with no commit message recording why. Two months
later `72f430a` added the xAPI-2.0-specific `actor` → `agent` normalisation on top. So the
code kept the 2.0 assumption while the line that declared it was reverted — an inconsistent
state that no single commit explains.

## What this means for you

- **Never trust the shape of a statement you posted.** It comes back with an id, a platform, an
  authority and a rewritten context, or not at all.
- **`[]` from `POST /lrs/statements` is a gate rejection**, not a transport failure.
- **Query by `context.grouping`, not by the game's own object id.** That is the index the
  shim maintains for you.
- **Check `LRS_ENDPOINT` is set** before concluding that tracing is broken.

## Related

- [ADR-0008 — object storage for traces and results](./decisions/0008-object-storage-for-traces-and-results.md)
- [How-to: query xAPI statements](../how-to/query-xapi-statements.md)
- [Object storage and traces](./object-storage-and-traces.md)