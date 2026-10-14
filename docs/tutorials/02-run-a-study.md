# Tutorial 2 — Running a study as a participant

**Goal:** take a study from "nobody is in it" to "one participant has completed the first
activity", seeing both sides of the boundary — the researcher setting things up, and the
participant walking the schedule.

**Time:** ~15 minutes. **You need:** a teacher token and a student token, plus the
`simlet_id` / `session_id` / `activity_id` from [tutorial 1](./01-first-study.md).

---

## Step 1 — put participants in the study

Participants live in **simlet groups**, never directly on the simlet.

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "group_name": "Class 4B",
        "group_use_new_generation": true,
        "group_sandbox": false,
        "group_allocator_type": "session"
      }' | jq
```

```json
{ "group_id": 7, "group_name": "Class 4B", "group_allocator_type": "session", ... }
```

`group_sandbox: true` marks the group as a rehearsal group: participant counts report `null`
and the group is filtered out of several listings, so trial runs do not pollute your numbers.
Set it during piloting, clear it before the real study.

Now add the participant. Either by username (SIMVA looks the user up in Keycloak) or with a
token when the user does not have an account yet:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "username": "ana.ruiz", "email": "ana.ruiz@example.edu", "role": "student" }' | jq
```

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/participants" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "isToken": true, "token": "ana-ruiz-token-1234", "username": "ana", "role": "student" }' | jq
```

The token form is how you support participants with no institutional identity: SIMVA mints a
JWT for that token string and the participant authenticates with it forever after.

---

## Step 2 — allocate them to a session

A participant can be in a study without being in any session. Allocation is the step that
gives them work.

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/groups/7/allocate/$SESSION_ID" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "participant_id": 555 }' | jq
```

Which allocator your group uses decides whether you can do this by hand:

| `group_allocator_type` | Behaviour |
| --- | --- |
| `default` | everything lands in the first session |
| `session` | participants go to every session; the server rejects sessions whose dates overlap |
| `group` | whole groups are assigned, and `Experimental_Groups` records the pairing |
| `random` | `randomize_session_allocation` percentages decide, at allocation time |

The `random` allocator takes its percentages at creation time:

```json
"randomize_session_allocation": [
  { "session_id": 100, "percentage": 50 },
  { "session_id": 101, "percentage": 50 }
]
```

`GET /allocatortypes` lists the strategies the server has registered, with the extra fields
each one needs. See
[how-to: choose an allocator](../how-to/choose-and-configure-an-allocator.md).

---

## Step 3 — open the session (only if you asked for it)

If you set `session_can_be_manually_activated: true` in tutorial 1, nothing happens until you
open it:

```bash
curl -s -X POST "$SIMVA_URL/simlets/$SIMLET_ID/sessions/$SESSION_ID/activate" \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq
```

Otherwise the session opens on its own when its start date passes.

---

## Step 4 — become the participant

Everything from here uses the **student** token. A `student` gets `allocated: true` from
`getAccess()`, which switches the API into "only my own data" mode: the `?user=` and `?users=`
parameters you saw for teachers are ignored, and the server always scopes the query to the
caller.

The scheduler is the participant's home page:

```bash
curl -s "$SIMVA_URL/simlets/scheduler" -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```

```json
[
  {
    "simlet_id": 42,
    "simlet_name": "Serious game pre/post validation",
    "sessions": [
      {
        "session_id": 100,
        "session_name": "Pre",
        "activities": [
          {
            "activity_id": 900,
            "activity_name": "Read the consent form",
            "activity_type": "manual",
            "activity_openable": true,
            "activity_completed": false,
            "has_results": false
          }
        ]
      }
    ]
  }
]
```

The activity list tells the participant what they can do right now. An activity becomes
openable only when **every** gate passes: the session is open, its dates allow it, and every
earlier activity in the session is complete.

---

## Step 5 — open and complete the activity

Ask the server where to send the participant. The URL is generated per participant, so always
ask — never hard code it:

```bash
curl -s "$SIMVA_URL/activities/900/target" -H "Authorization: Bearer $STUDENT_TOKEN" | jq
```

```json
{ "activity_id": 900, "activity_url": "https://example.edu/consent?user=ana.ruiz" }
```

`GET /activities/900/open` does the same thing but answers with a `302` redirect, which is
what you want in a browser link.

Then mark the manual activity as done:

```bash
curl -s -X POST "$SIMVA_URL/activities/900/completion" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": true }' | jq
```

Progress is tracked separately from completion. Games and questionnaires report their own
scale:

```bash
curl -s -X POST "$SIMVA_URL/activities/900/progress" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "progress": 45 }' | jq
```

---

## What happened

The participant's completion is recorded against **their** user id, not against the
simlet. That is why every read endpoint has to be told who it is asking about — the next
tutorial is about that.

## Where to go next

- [Tutorial 3 — Getting the data out](./03-read-the-data.md)
- [How-to: read participant progress](../how-to/read-participant-progress.md)

## Things that surprise people

- **The student token cannot manage the study.** Management endpoints are tagged for
  `teachers` and `administrators` only, and `roleAllowed()` rejects the call with 401 before
  the controller runs. The generated [role matrix](../reference/api/rbac-matrix.md) shows
  exactly which endpoints a `student` has.
- **Completing an activity twice is a `409`.** Unless `activity_can_be_restarted` is true, in
  which case the server reopens it for that participant.