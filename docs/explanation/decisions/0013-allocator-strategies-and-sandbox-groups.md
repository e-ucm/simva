# ADR-0013 — Allocator strategies, and sandbox groups for rehearsal

- **Status:** Accepted
- **Date:** 2019-11-06 (allocators), 2026-03-05 → 2026-07-28 (sandbox)

## Context

A study has sessions; participants have to end up in one. How they get there depends on the
experimental design:

- **Between subjects** — one participant, one condition. Which condition is often decided by
  the participant's existing group (class, cohort, team), so it cannot be random *for them*.
- **Random assignment** — every participant allocated independently, at fixed proportions.
- **All conditions** — a participant experiences every session, which requires that the
  sessions' dates do not overlap.
- **Pilot runs** — a rehearsal cohort that must not contaminate the real data.

Hard-coding one of these means every other design is impossible, and "impossible" for a
research tool means "write a fork".

## Decision

Make allocation a strategy, chosen per group, resolved at runtime through the same factory
pattern as activity types (ADR-0012).

| `group_allocator_type` | Behaviour |
| --- | --- |
| `default` | everything goes to the first session |
| `session` | participants join every session; overlapping dates are rejected |
| `group` | whole groups are assigned, recorded in `Experimental_Groups` |
| `random` | `randomize_session_allocation[]` percentages, applied at allocation time |

```
5d063f4  2019-11-06  Added allocators
7f39f2e  2020-10-12  Created GroupAllocator
3f234c9  2026-03-09  add the session allocator type
c71be82  2026-05-21  add the Experimental_Groups table
```

**Sandbox groups** address the rehearsal problem without duplicating the study:

```
fb121e5  2026-03-05  group_sandbox on the Group and SimletGroup mappers, plus views
f81a1c4  2026-06-08  participant counts return null for sandbox groups
e344e8a  2026-07-21  expose group_sandbox as a contract parameter
741307f  2026-07-28  fix simlet groups with the sandbox filter
```

A sandbox group is a normal group that counts for nothing: participant counts report `null`,
and several listings filter it out unless asked.

## Consequences

**Positive**

- **New designs are configuration**, not code. Adding an allocator is a class, a factory case
  and a branch in the creation schema.
- **Between-subjects by existing group works**, which is the common case in educational
  research, and `Experimental_Groups` records the pairing so the design is auditable.
- **The percentages are validated as a whole**, so a set that cannot describe a usable split
  is refused at configuration time rather than at allocation time.
- **Piloting does not require a separate study.** Flip `group_sandbox` off when the pilot has
  served its purpose and the same group becomes part of the study.

**Negative**

- **Changing the allocator type does not move anyone.** The allocation that already happened
  stays; you re-run allocation for the sessions you want to change. This is not documented
  anywhere in the API and it surprises people.
- **`session` allocation rejects overlapping sessions**, so a between-subjects design with
  simultaneous conditions must use `random` or `group` — a constraint discovered by hitting
  it.
- **Sandbox took five months and eight commits to stabilise.** It began as a column in the
  initial schema (January), was renamed `sandbox_session_id` → `simlet_sandbox_session_id`
  three weeks later for consistency (`067f71d`), surfaced in the mappers in March, was given
  special count semantics in June, was exposed as a query parameter in July, and needed **two
  bug fixes three days apart** in late July (`7a26a4e`, `741307f`). The filter is only correct
  as of the last of those.
- **A sandbox group still allocates participants to sessions.** Sandboxing hides it from
  counts and lists; it does not create a parallel study.

## Allocation rows must not be soft deleted

This is the exception that shaped
[ADR-0010](./0010-soft-delete-and-the-admin-bypass.md). `Experimental_Groups` and
`Experimental_Participants` record facts about the experimental design. Soft-deleting them does
not hide them; it destroys the record that the allocation happened.

`ad1b8e1` (2026-09-02) removed `paranoid` from both models. `d4a6b31`, **the next day**, fixed
the breakage that removal caused in `SimletGroup` and `GroupAllocatorSimletGroup`. The
decision and its reversal cost more than never making it.

## The self-documenting cost

`GET /allocatortypes` lists only `default` and `group` by default. `session` and `random` are
commented out of the default array and only appear when you pass `?type=`. So the natural way
to discover the allocators under-reports them — an inconsistency with the activity types, where
everything is listed.

## Evidence

- `5d063f4` (2019-11-06) — allocators introduced
- `e35c1c4` (2020-02-13) — `setStudyAllocator`
- `7f39f2e`, `afe9ffb` (2020-10-12) — the group allocator
- `4322e58` (2026-02-24) — multiple object and group ids, improved validation
- `3f234c9` (2026-03-09) — the session allocator
- `c71be82` (2026-05-21) — `Experimental_Groups`
- `fb121e5`, `f81a1c4`, `e344e8a`, `7a26a4e`, `741307f` — the sandbox path
- `ad1b8e1`, `d4a6b31` — the paranoid carve-out and its regression

## Related

- [How-to: choose and configure an allocator](../../how-to/choose-and-configure-an-allocator.md)
- [How-to: add a sandbox group](../../how-to/add-a-sandbox-group.md)
- [ADR-0012](./0012-activity-and-allocator-types-as-the-extension-point.md)
- [ADR-0010](./0010-soft-delete-and-the-admin-bypass.md)