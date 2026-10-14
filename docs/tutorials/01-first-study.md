# Tutorial 1 — Your first study

**Goal:** create a study (*simlet*), put one *session* and one *manual activity* inside it,
and confirm it exists by listing it back.

**Time:** ~20 minutes. **You need:** a teacher token, `jq`.

---

## Step 0 — confirm the server is up

```bash
curl -s "$SIMVA_URL/health" | jq
```

```json
{ "status": true, "db": { "status": true } }
```

`GET /health` is one of four public endpoints (`/health`, `/version`,
`/limesurvey-completion-webhooks`, `/auth2*`). No token required, which is why it is the right
first call.

Now confirm *your* token works and see who the server thinks you are:

```bash
curl -s "$SIMVA_URL/users/me" -H "Authorization: Bearer $TOKEN" | jq
```

The response carries the role the server will use for authorization. It comes from the
database, not from the token — see [ADR-0011](../explanation/decisions/0011-object-level-permissions-and-inheritance.md).

---

## Step 1 — the three nouns

Before touching the API, internalise the containment chain. Everything else is detail.

```
simlet  ──has many──▶  session  ──has many──▶  activity
(study)               (one test run)          (one step)
```

A **simlet group** holds the participants of a study, and an **allocator** decides which
session each of them lands in. We will ignore both in this tutorial and add participants in
tutorial 2.

---

## Step 2 — create the study

```bash
curl -s -X POST "$SIMVA_URL/simlets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "simlet_name": "Serious game pre/post validation",
        "simlet_description": "Baseline questionnaire, then the game, then the follow-up."
      }' | jq
```

```json
{
  "simlet_id": 42,
  "simlet_name": "Serious game pre/post validation",
  "simlet_description": "Baseline questionnaire, then the game, then the follow-up.",
  "simlet_owner_username": "jdoe",
  "simlet_can_be_archived": false,
  ...
}
```

Two things to notice:

- You are **not** sending an owner. The server stamps you as owner and creates your `FULL`
  permission row, which is why you can read and edit this study afterwards
  (`Simlet.createSimlet`).
- The response is validated against `api.yaml` before it leaves the server. If the server
  ever adds a field you have not seen, it must also update the contract — that is a
  deliberate constraint, explained in
  [ADR-0003](../explanation/decisions/0003-api-yaml-is-the-contract-and-the-authorization-matrix.md).

Save the id:

```bash
export SIMLET_ID=42
```

---

## Step 3 — add a session

A session is one run of the study for one cohort. For a pre/post design you typically want
two: *pre* and *post*.

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "session_name": "Pre",
        "session_description": "Baseline measurement before playing",
        "session_can_be_manually_activated": false
      }' | jq
```

```json
{ "session_id": 100, "session_name": "Pre", ..., "session_activated": false }
```

`session_can_be_manually_activated` is a genuine fork in behaviour, not cosmetic:

- `false` — the session opens on its own when its start date arrives, and closes on its end
  date.
- `true` — the dates are ignored for opening; you call
  `POST /simlets/{simletid}/sessions/{sessionid}/activate` yourself. Useful for testing or
  for studies with no fixed calendar.

Create the matching `Post` session the same way and keep going with `Post`'s id.

```bash
export POST_SESSION_ID=101
```

---

## Step 4 — add an activity

Activities are **polymorphic**. The `activity_type` you send selects a class, and that class
decides what the rest of the API does with it — LimeSurvey calls, game tracker configuration,
whether a trace endpoint exists at all. The full list is in the
[activity type reference](../reference/activity-types.md).

Start with the simplest one, `manual`: the researcher marks it complete by hand.

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "activity_name": "Read the consent form",
        "activity_description": "Participants read and accept the study conditions.",
        "activity_type": "manual",
        "manual_user_managed": true,
        "manual_ressource_type": "WEB",
        "manual_ressource_url": "https://example.edu/consent",
        "activity_trace_storage": false,
        "activity_can_be_restarted": false
      }' | jq
```

```json
{
  "activity_id": 900,
  "activity_name": "Read the consent form",
  "activity_type": "manual",
  "activity_order": 1,
  ...
}
```

Two of those fields are load-bearing:

- `activity_trace_storage` — `false` means no trace/xAPI endpoint is exposed for this
  activity. Set it to `true` whenever you want the participant's interaction data.
- `activity_can_be_restarted` — `false` (the default you want) means once completed, the
  activity cannot be reopened. `true` lets a participant redo it, which also changes what
  the scheduler does with downstream activities.

---

## Step 5 — read it all back

```bash
curl -s "$SIMVA_URL/simlets/$SIMLET_ID" -H "Authorization: Bearer $TOKEN" \
  | jq '{simlet_id, simlet_name, sessions: [.sessions[] | {session_id, session_name}]}'
```

```json
{
  "simlet_id": 42,
  "simlet_name": "Serious game pre/post validation",
  "sessions": [
    { "session_id": 100, "session_name": "Pre" },
    { "session_id": 101, "session_name": "Post" }
  ]
}
```

Sessions arrive embedded in the simlet, which saves the round trips of this tutorial. For
paginated listings use `GET /simlets?limit=&offset=&search=` and `GET /simlets/count`.

---

## What you built

```
simlet 42  "Serious game pre/post validation"
├── session 100  "Pre"
│   └── activity 900  "Read the consent form"   (manual)
└── session 101  "Post"
```

Nothing runs yet. Participants need to be added to the study, which is what
[how-to: add a participant to a study](../how-to/add-a-participant-to-a-study.md) and
[tutorial 2](./02-run-a-study.md) are for.

## Where to go next

- [How-to: add a participant to a study](../how-to/add-a-participant-to-a-study.md)
- [How-to: build a gameplay activity](../how-to/create-a-gameplay-activity.md)
- [Reference: the `/simlets` endpoints](../reference/api/simlets.md)

## Things that surprise people

- **Deleted objects still show up if you are an administrator.** Rows are soft deleted
  (`deletedAt`), and the "show me everything" filter is deliberately bypassed for admins. See
  [ADR-0010](../explanation/decisions/0010-soft-delete-and-the-admin-bypass.md).
- **The contract decides who may call what.** If a role is missing from an operation's tags in
  `api.yaml`, the route returns 401 even though the code exists and the handler would happily
  run. The [role matrix](../reference/api/rbac-matrix.md) is generated from the same file.