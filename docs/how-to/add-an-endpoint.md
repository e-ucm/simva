# Add an endpoint

The order matters. `api.yaml` is not a description of the API — it is the contract the
server validates against **and** the authorization matrix, so it has to be edited before or
with the code, never after.

## 1. Declare the operation in `api.yaml`

Add the path with a unique `operationId`, and give it **role tags**. Untagged operations are
open to every role, including users with no role at all.

```yaml
  /simlets/{simletid}/notes:
    get:
      summary: gets the notes of the simlet
      operationId: getSimletNotes
      tags:
        - administrators
        - teachers
      parameters:
        - $ref: '#/components/parameters/simletId'
      responses:
        '200':
          description: The notes
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/simletNotes'
        '401':
          $ref: '#/components/responses/AuthentificationError'
        '404':
          $ref: '#/components/responses/NotFoundError'
```

Add the schema under `components.schemas` if you introduce one. Reuse the existing shared
responses rather than inlining error bodies.

## 2. Register the route

```ts
// src/routes/simlets/simlet.routes.ts
router.get("/:simlet_id/notes", SimletControler.getSimletNotes);
```

The file's JSDoc header lists the routes it serves — keep it in sync, it is the only
place the full route surface is described in prose.

## 3. Add the controller

Controllers convert HTTP to a call on a service and back. They parse `req.params`,
`req.query` and `req.body`, ask `getAccess()` what the caller may do, and hand
`(allocated, is_admin, current_user_id)` down.

```ts
export async function getSimletNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user?.sql;
    const simletId = parseInt(req.params.simlet_id as string);
    const access = getAccess(currentUser);
    const notes = await simletService.getNotes(simletId, access.is_admin, access.currentUserId);
    return res.json(notes);
  } catch (err) {
    next(err);
  }
}
```

## 4. Add the service

Services hold use cases. They are where authorization refusals and validation live:

```ts
export async function getNotes(simletId: number, is_admin: boolean, current_user_id: number): Promise<string[]> {
  const simlet = await Simlet.getFromDbData(simletId);
  if (!simlet.canRead(is_admin, current_user_id)) {
    throw new AuthentificationError('You are not authorized to read this simlet');
  }
  return simlet.getNotes();
}
```

## 5. Add the mapper method

Mappers talk to the database. They never build HTTP responses. Read through a query template
from `src/lib/views/**.queries.ts` or the models, never through ad hoc SQL in the service.

## 6. Verify

```bash
npm run validate-openapi     # lint the contract
npm run update-docs          # regenerate the reference pages
npm test
```

## Conventions worth copying

- **Path parameters are `:snake_case` in code and `{lowercase}` in the contract.**
  `roleAllowed()` treats `{...}` segments as wildcards, so the naming difference does not
  affect authorization, and the drift report classifies it separately.
- **Throw `AuthentificationError`, not `next()`.** The error middleware maps the class to the
  status code: 401 for auth, 404 for not found, 409 for conflict, 406 for validation.
- **Never trust `req.user.sso` for authorization.** The role that counts is
  `req.user.sql.role`, resolved from the database.
- **Service signatures take `(allocated, is_admin, current_user_id)` in that order.** It is
  consistent across the codebase and reviewers rely on it.