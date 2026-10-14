# Simva API

Simva, AKA Simple Validator, AKA SurveyManager is the evolution of a tool created to integrate and ease the task of validating serious games using pre-post surveys as a control point. This version allows to create more complex studies with more variety of activities and different allocations.

## Documentation

The documentation uses the [Diátaxis](https://diataxis.fr) structure and lives in [`docs/`](./docs/index.md):

| Section | Question |
| --- | --- |
| [Tutorials](./docs/tutorials/README.md) | I am new here. Walk me through something that works. |
| [How-to guides](./docs/how-to/README.md) | I know the domain. Do this specific task for me. |
| [Reference](./docs/reference/README.md) | What exactly does this endpoint accept? |
| [Explanation](./docs/explanation/README.md) | Why is it built this way, and what were the trade-offs? |

Start at [`docs/index.md`](./docs/index.md).

The endpoint reference under `docs/reference/api/` is generated from `api.yaml` and the router
tree; regenerate it with `npm run update-docs`.

## API specification

`api.yaml` is the OpenAPI 3.0 contract. It is also the runtime authorization matrix: the
`tags` of each operation are the roles allowed to call it, read by
`src/middlewares/auth.middleware.ts`. Editing a tag is an authorization change.

Swagger API URL: https://app.swaggerhub.com/apis/Synpheros/Simva/1.0.0