# Tutorials

A tutorial is a **lesson**. It is written for somebody who does not know the domain yet, and
it deliberately gets things working once before it explains anything. Read it start to finish,
top to bottom, without skipping.

If you already know what you want to do, skip these and use the [how-to guides](../how-to/README.md).
If you need to know why something works this way, read the
[explanation section](../explanation/README.md).

## Available tutorials

| Tutorial | You will | Time |
| --- | --- | --- |
| [1. Your first study](./01-first-study.md) | Create a study, add a session and a manual activity, and get the endpoint list back | 20 min |
| [2. Running a study as a participant](./02-run-a-study.md) | Follow the schedule, open an activity, complete it, and see the state change | 15 min |
| [3. Getting the data out](./03-read-the-data.md) | Read progress, fetch results as presigned URLs, and query the LRS | 20 min |

## Before you start

All three tutorials assume:

- a running SIMVA instance and a base URL in `SIMVA_URL`,
- a JWT in `TOKEN` issued by your Keycloak realm for a user with the `teacher` role
  (tutorial 2 also uses a `student` token),
- `jq` available, for readability only.

```bash
export SIMVA_URL=https://simva.example.edu
export TOKEN='eyJhbGciOi...'
```

If you do not have a token yet, see the [authentication reference](../reference/authentication.md).